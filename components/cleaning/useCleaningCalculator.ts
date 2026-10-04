"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  areasSynchronized,
  calculateOfficeCleaningQuote,
  createInitialCustomerInput,
  floorsSynchronized,
  formatEuroFromCents,
  redistributeFloors,
  redistributeSubAreas,
  setFloorArea,
  setSubArea,
  type CustomerInput,
  type FloorAreas,
  type SubAreas,
  type CustomerQuoteSummary,
  type ValidationIssue,
} from "@/lib/cleaning";
import type { CleaningLocale } from "@/lib/cleaning/i18n";

export type CalculatorStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | "contact" | "success" | null;

export function useCleaningCalculator() {
  const locale: CleaningLocale = "de";
  const previewRequestId = useRef(0);
  const [input, setInput] = useState<CustomerInput>(() =>
    createInitialCustomerInput({
      totalAreaM2: 200,
      language: "de",
      subAreas: redistributeSubAreas(200, {
        office: 110,
        meeting: 24,
        kitchen: 16,
        sanitary: 16,
        corridors: 20,
        reception: 10,
        other: 4,
      }),
      floors: redistributeFloors(200, {
        carpet: 80,
        hard: 90,
        wet: 20,
        other: 10,
      }),
      office: {
        workstations: 10,
        officeBins: 10,
        officeBinsAutoSuggested: true,
        meetingRooms: 1,
        meetingChairs: 8,
        cabinetExterior: false,
        shelving: false,
        windowSills: false,
        phoneMonitorExterior: false,
        whiteboards: false,
      },
      sanitary: {
        toilets: 2,
        urinals: 1,
        washbasins: 2,
        mirrors: 2,
        sanitaryBins: 2,
        showers: 0,
        cubicles: 0,
      },
      kitchen: {
        kitchens: 1,
        tables: 1,
        chairs: 4,
        sinks: 1,
        countertopUnits: 2,
        bins: 1,
        applianceExteriors: 2,
        microwaveInside: false,
        refrigeratorInside: false,
        dishwasher: false,
        cabinetFronts: false,
        dishes: false,
      },
    })
  );
  const [openStep, setOpenStep] = useState<CalculatorStep>(1);
  const [serverQuote, setServerQuote] = useState<CustomerQuoteSummary | null>(null);
  const [serverValidation, setServerValidation] = useState<
    { code: string; level: string; message: string }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [anfrageNr, setAnfrageNr] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const localCalc = useMemo(() => calculateOfficeCleaningQuote(input), [input]);
  const quote = serverQuote ?? localCalc.customer;
  const validation: ValidationIssue[] = localCalc.admin.validation;

  const patch = useCallback((updater: (prev: CustomerInput) => CustomerInput) => {
    setInput((prev) => {
      const next = updater(prev);
      return next.language === "de" ? next : { ...next, language: "de" };
    });
    setServerQuote(null);
  }, []);

  const setTotalArea = useCallback(
    (total: number) => {
      patch((prev) => {
        const totalAreaM2 = Math.max(0, Math.min(50_000, total));
        const prevArea = prev.totalAreaM2 > 0 ? prev.totalAreaM2 : totalAreaM2;
        const scale = prevArea > 0 ? totalAreaM2 / prevArea : 1;
        // Keep workstation density stable when shrinking/growing area (avoids false MANUAL).
        const workstations =
          prev.office.officeBinsAutoSuggested || prev.office.workstations > 0
            ? Math.max(0, Math.round(prev.office.workstations * scale))
            : prev.office.workstations;
        const officeBins = prev.office.officeBinsAutoSuggested
          ? workstations
          : prev.office.officeBins;
        return {
          ...prev,
          totalAreaM2,
          subAreas: redistributeSubAreas(totalAreaM2, prev.subAreas, prev.subAreaLocks),
          floors: redistributeFloors(totalAreaM2, prev.floors, prev.floorLocks),
          office: {
            ...prev.office,
            workstations,
            officeBins,
          },
        };
      });
    },
    [patch]
  );

  const updateSubArea = useCallback(
    (key: keyof SubAreas, value: number) => {
      patch((prev) => ({
        ...prev,
        subAreas: setSubArea(prev.totalAreaM2, prev.subAreas, key, value, prev.subAreaLocks),
        subAreaLocks: { ...prev.subAreaLocks, [key]: true },
      }));
    },
    [patch]
  );

  const updateFloor = useCallback(
    (key: keyof FloorAreas, value: number) => {
      patch((prev) => ({
        ...prev,
        floors: setFloorArea(prev.totalAreaM2, prev.floors, key, value, prev.floorLocks),
        floorLocks: { ...prev.floorLocks, [key]: true },
      }));
    },
    [patch]
  );

  const setWorkstations = useCallback(
    (n: number) => {
      patch((prev) => {
        const workstations = Math.max(0, Math.round(n));
        const officeBins = prev.office.officeBinsAutoSuggested
          ? workstations
          : prev.office.officeBins;
        return {
          ...prev,
          office: { ...prev.office, workstations, officeBins },
        };
      });
    },
    [patch]
  );

  const setOfficeBins = useCallback(
    (n: number) => {
      patch((prev) => ({
        ...prev,
        office: {
          ...prev.office,
          officeBins: Math.max(0, Math.round(n)),
          officeBinsAutoSuggested: false,
        },
      }));
    },
    [patch]
  );

  const restoreBinsSuggestion = useCallback(() => {
    patch((prev) => ({
      ...prev,
      office: {
        ...prev.office,
        officeBins: prev.office.workstations,
        officeBinsAutoSuggested: true,
      },
    }));
  }, [patch]);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++previewRequestId.current;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/cleaning/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: { ...input, language: "de" },
            clientPreviewNetCents: localCalc.customer.netCents,
          }),
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          quote?: CustomerQuoteSummary;
          validation?: { code: string; level: string; message: string }[];
        };
        // Ignore stale responses from earlier area keystrokes.
        if (requestId !== previewRequestId.current) return;
        if (data.quote) setServerQuote(data.quote);
        if (data.validation) setServerValidation(data.validation);
      } catch {
        /* preview stays local */
      }
    }, 350);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [input, localCalc.customer.netCents]);

  const areasOk = areasSynchronized(input.totalAreaM2, input.subAreas);
  const floorsOk = floorsSynchronized(input.totalAreaM2, input.floors);

  const priceLabel = useMemo(() => {
    if (quote.quoteStatus === "MANUAL_REVIEW_REQUIRED") return null;
    return {
      net: formatEuroFromCents(quote.netCents, "de-DE"),
      vat: formatEuroFromCents(quote.vatCents, "de-DE"),
      gross: formatEuroFromCents(quote.grossCents, "de-DE"),
      monthlyNet:
        quote.monthlyNetCents != null
          ? formatEuroFromCents(quote.monthlyNetCents, "de-DE")
          : null,
      monthlyGross:
        quote.monthlyGrossCents != null
          ? formatEuroFromCents(quote.monthlyGrossCents, "de-DE")
          : null,
    };
  }, [quote]);

  async function submitQuote(contact: {
    company: string;
    contactPerson: string;
    email: string;
    phone: string;
    street: string;
    postalCode: string;
    city: string;
    notes?: string;
    privacyNoticeAccepted: boolean;
  }) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/cleaning/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { ...input, language: "de" },
          contact,
          clientPreviewNetCents: quote.netCents,
          website: "",
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        anfrageNr?: string;
        quote?: CustomerQuoteSummary;
      };
      if (!res.ok) {
        setSubmitError(data.error ?? "Error");
        return false;
      }
      setAnfrageNr(data.anfrageNr ?? null);
      if (data.quote) setServerQuote(data.quote);
      setOpenStep("success");
      setSheetOpen(false);
      return true;
    } catch {
      setSubmitError("Network error");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  return {
    locale,
    input,
    patch,
    setTotalArea,
    updateSubArea,
    updateFloor,
    setWorkstations,
    setOfficeBins,
    restoreBinsSuggestion,
    openStep,
    setOpenStep,
    quote,
    validation,
    serverValidation,
    areasOk,
    floorsOk,
    priceLabel,
    sheetOpen,
    setSheetOpen,
    submitting,
    submitError,
    anfrageNr,
    submitQuote,
    localCalc,
  };
}

export type CleaningCalculatorState = ReturnType<typeof useCleaningCalculator>;
