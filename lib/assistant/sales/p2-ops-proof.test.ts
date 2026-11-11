/**
 * P2 HARD enterprise proofs — customer-like journeys, mail copy, admin/sync wiring,
 * tools, communication channels. Not policy-only smoke.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createSession } from "@/lib/concierge/types";
import {
  enforcePhotoIntake,
  photoRequiredForProduct,
  resolvePhotoIntakeRequirement,
  buildPhotoIntakePrompt,
} from "@/lib/photo-intake";
import {
  buildDepositReference,
  depositRecommendedForLead,
  depositRecommendedForProduct,
  suggestDepositAmountEur,
} from "@/lib/deposits/policy";
import {
  buildDepositAdminBlock,
  buildDepositCustomerEmail,
  createDepositRequest,
  markDepositPaid,
  markDepositWaived,
} from "@/lib/deposits/request-deposit";
import {
  buildWartungRenewEmail,
  findWartungRenewCandidates,
  isWartungLead,
} from "@/lib/wartung/renew";
import { generateWartungSeriesDates } from "@/lib/calendar/wartung-series";
import { addDaysIso } from "@/lib/calendar/week-range";
import {
  buildCsatInviteEmail,
  buildCsatPageUrl,
  createCsatToken,
  parseCsatScore,
  sampleQaFlags,
  shouldSendCsatInvite,
  verifyCsatToken,
} from "@/lib/csat/policy";
import {
  authorizeVoiceWebhook,
  normalizeVoiceEvent,
  voiceEventToCallbackLead,
  voiceReadiness,
} from "@/lib/voice/inbound";
import { parseVapiServerPayload } from "@/lib/voice/vapi-webhook";
import { buildVapiAssistantCreateBody, VAPI_ASSISTANT_NAME } from "@/lib/voice/vapi-assistant";
import { executeAllowlistedTool, isAllowlistedTool } from "../tools/registry";
import { openServiceCase } from "./catalog";
import { siteConfig } from "@/lib/config";
import type { StoredLead } from "@/lib/leads-store";

const ROOT = join(process.cwd());

function baseLead(over: Partial<StoredLead> = {}): StoredLead {
  return {
    id: "lead-p2-anna-01",
    source: "quote",
    createdAt: "2026-01-01T00:00:00.000Z",
    name: "Anna Müller",
    phone: "01733828354",
    email: "anna.mueller@example.com",
    anfrageNr: "AN-2026-0042",
    summary: "Bauendreinigung 80m²",
    photoCount: 0,
    status: "termin_bestaetigt",
    festpreis: 890,
    ...over,
  };
}

function read(pathFromRoot: string): string {
  return readFileSync(join(ROOT, pathFromRoot), "utf8");
}

describe("P2 customer journey — Bauend foto Pflicht (Anna)", () => {
  it("open_service_case Bauend fordert Foto + Festpreis-Pfad", () => {
    const session = createSession("anna-bauend");
    const opened = openServiceCase(session, "bauend");
    assert.match(opened.text, /Foto/i);
    assert.equal(opened.session.stage, "price_ready");
    assert.equal(opened.session.assistantProduct, "bauend");
    assert.equal(photoRequiredForProduct("bauend"), true);
  });

  it("request_photo_intake tool → DE Kunden-Text + Lead-Form Stage", async () => {
    const session = createSession("anna-foto");
    session.assistantProduct = "bauend";
    const result = await executeAllowlistedTool("request_photo_intake", "{}", { session });
    assert.ok(result.customerText);
    assert.match(result.customerText!, /Foto/i);
    assert.equal(result.session?.stage, "price_ready");
    const parsed = JSON.parse(result.content) as { required: boolean; openLeadForm: boolean };
    assert.equal(parsed.required, true);
    assert.equal(parsed.openLeadForm, true);
  });

  it("Anna ohne Foto → fail-closed; mit 1 Foto → ok", () => {
    const session = createSession("anna-submit");
    session.assistantProduct = "bauend";
    const blocked = enforcePhotoIntake({ photoCount: 0, session });
    assert.equal(blocked.ok, false);
    if (!blocked.ok) {
      assert.equal(blocked.code, "photos_required");
      assert.match(blocked.messageDe, /Foto/);
    }
    assert.equal(enforcePhotoIntake({ photoCount: 1, session }).ok, true);
  });

  it("Fenster stark verschmutzt → Foto Pflicht (Quote)", () => {
    const policy = resolvePhotoIntakeRequirement({ quote: { dirtLevel: "stark" } });
    assert.equal(policy.required, true);
    assert.match(policy.messageDe, /stark|extrem|Foto/i);
    assert.match(buildPhotoIntakePrompt("praxis"), /Foto/);
  });

  it("Fenster normal → optional", () => {
    const session = createSession("normal");
    session.assistantProduct = "fenster";
    session.quote.dirtLevel = "normal";
    assert.equal(enforcePhotoIntake({ photoCount: 0, session }).ok, true);
  });
});

describe("P2 customer journey — Anzahlung (Klaus Bauend 890€)", () => {
  it("deposit empfohlen + 30% capped amount synced into email", () => {
    assert.equal(depositRecommendedForProduct("bauend"), true);
    assert.equal(depositRecommendedForLead(baseLead()), true);
    const amount = suggestDepositAmountEur(890);
    assert.equal(amount, 267); // round(890*0.3)

    const dep = createDepositRequest({ id: "lead-p2-anna-01", festpreis: 890 });
    assert.equal(dep.amountEur, 267);
    assert.equal(dep.reference, buildDepositReference("lead-p2-anna-01"));

    process.env.DEPOSIT_IBAN = "DE89370400440532013000";
    process.env.DEPOSIT_RECIPIENT = "Ilyashan Fensterreinigung";
    const mail = buildDepositCustomerEmail({
      name: "Klaus Weber",
      deposit: dep,
      anfrageNr: "AN-2026-0042",
    });
    assert.match(mail.subject, /Anzahlung 267/);
    assert.match(mail.text, /Klaus/);
    assert.match(mail.text, /AN-2026-0042/);
    assert.match(mail.text, /DE89370400440532013000/);
    assert.match(mail.text, new RegExp(dep.reference));
    assert.match(mail.text, new RegExp(siteConfig.contact.phoneDisplay.replace(/\s+/g, "\\s*")));
    assert.match(mail.html, /tel:/);
    assert.match(mail.html, /Verwendungszweck/);

    const admin = buildDepositAdminBlock(dep);
    assert.match(admin.text, /267/);
    assert.match(admin.html, new RegExp(dep.reference));

    const paid = markDepositPaid(dep);
    assert.equal(paid.status, "paid");
    assert.ok(paid.paidAt);
    const waived = markDepositWaived(dep, "lead-p2-anna-01");
    assert.equal(waived.status, "waived");
    delete process.env.DEPOSIT_IBAN;
    delete process.env.DEPOSIT_RECIPIENT;
  });

  it("request_deposit tool: Fenster → not_required; Bauend ohne Resend → fail-closed", async () => {
    const fenster = createSession("dep-fenster");
    fenster.assistantProduct = "fenster";
    const r1 = await executeAllowlistedTool(
      "request_deposit",
      JSON.stringify({ name: "Max", phone: "01731234567" }),
      { session: fenster }
    );
    const j1 = JSON.parse(r1.content) as { ok: boolean; code?: string };
    assert.equal(j1.ok, false);
    assert.equal(j1.code, "not_required");

    const bauend = createSession("dep-bauend");
    bauend.assistantProduct = "bauend";
    const prev = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = "HIER_IHREN_KEY";
    const r2 = await executeAllowlistedTool(
      "request_deposit",
      JSON.stringify({
        name: "Klaus Weber",
        phone: "01733828354",
        email: "klaus@example.com",
        festpreisHint: 890,
      }),
      { session: bauend }
    );
    const j2 = JSON.parse(r2.content) as { ok: boolean; code?: string };
    assert.equal(j2.ok, false);
    assert.equal(j2.code, "email_unavailable");
    assert.match(r2.customerText ?? "", /anrufen|0173/i);
    process.env.RESEND_API_KEY = prev;
  });
});

describe("P2 customer journey — Wartung renew (positive window)", () => {
  it("finds Stammkunde near series end + builds DE renew mail with phone/CTA", () => {
    const anchor = "2025-01-07";
    const lead = baseLead({
      name: "Familie Schmidt",
      quote: {
        services: ["privat", "wartung"],
        wartungPackageId: "quarterly",
        wartungPreferredWeekday: "di",
      },
      appointment: { confirmedDate: anchor },
    });
    assert.equal(isWartungLead(lead), true);

    const series = generateWartungSeriesDates({
      anchorDate: anchor,
      packageId: "quarterly",
      preferredWeekday: "di",
    });
    assert.ok(series.length > 0);
    const last = series[series.length - 1]!;
    const today = addDaysIso(last, -10); // inside 21-day lookahead
    const found = findWartungRenewCandidates([lead], today);
    assert.equal(found.length, 1);
    assert.equal(found[0]!.horizonEnd, last);

    // already mailed → skip
    const mailed = baseLead({
      ...lead,
      wartungRenewEmail: { sentAt: "x", forHorizonEnd: last },
      quote: lead.quote,
      appointment: lead.appointment,
    });
    assert.equal(findWartungRenewCandidates([mailed], today).length, 0);

    const mail = buildWartungRenewEmail({
      name: "Familie Schmidt",
      packageLabel: "Vierteljährlich",
      horizonEnd: last,
      anfrageNr: lead.anfrageNr,
      renewUrl: "https://ilyashan.de/termin?token=abc",
    });
    assert.match(mail.subject, /Wartungsvertrag|verlängern/i);
    assert.match(mail.text, /Familie/);
    assert.match(mail.text, new RegExp(last.replace(/-/g, "\\-")));
    assert.match(mail.html, /termin\?token=abc/);
    assert.match(mail.html, /Verlängerung/);
  });
});

describe("P2 customer journey — CSAT after Abschluss + QA", () => {
  it("token → URL → invite mail with tel; score sync; QA flags", () => {
    process.env.ADMIN_PASSWORD = "p2-hard-secret";
    const token = createCsatToken("lead-p2-anna-01");
    assert.ok(token);
    assert.equal(verifyCsatToken(token)?.leadId, "lead-p2-anna-01");
    assert.equal(verifyCsatToken("forged.bad"), null);

    const url = buildCsatPageUrl("https://ilyashan.de", "lead-p2-anna-01");
    assert.ok(url);
    assert.match(url!, /\/feedback\?token=/);

    const invite = buildCsatInviteEmail({
      name: "Anna Müller",
      feedbackUrl: url!,
      anfrageNr: "AN-2026-0042",
    });
    assert.match(invite.subject, /Einsatz|Meinung|zufrieden/i);
    assert.match(invite.text, /Anna/);
    assert.match(invite.html, /feedback\?token=/);
    assert.match(invite.html, /AN-2026-0042/);

    assert.equal(parseCsatScore("4"), 4);
    assert.equal(parseCsatScore(0), null);

    assert.equal(
      shouldSendCsatInvite(
        baseLead({ status: "abgeschlossen" }),
        "termin_bestaetigt"
      ),
      true
    );
    assert.equal(
      shouldSendCsatInvite(
        baseLead({
          status: "abgeschlossen",
          csatInvite: { sentAt: "x", forStatus: "abgeschlossen" },
        }),
        "termin_bestaetigt"
      ),
      false
    );

    const flags = sampleQaFlags(
      baseLead({
        csat: { score: 2, submittedAt: "x", channel: "email_link" },
        deposit: {
          status: "requested",
          amountEur: 267,
          currency: "EUR",
          reference: "ANZ-X",
          requestedAt: "x",
        },
        session: {
          id: "s",
          stage: "idle",
          quote: {},
          turns: 2,
          assistantProduct: "bauend",
        },
        photoCount: 0,
        hot: true,
        status: "neu",
      })
    );
    assert.deepEqual(
      flags.sort(),
      ["deposit_open", "hot_unworked", "low_csat", "missing_photos"].sort()
    );
    delete process.env.ADMIN_PASSWORD;
  });
});

describe("P2 customer journey — Voice missed call → Rückruf lead", () => {
  it("native Vapi end-of-call-report → event with DE phone", () => {
    const parsed = parseVapiServerPayload({
      message: {
        type: "end-of-call-report",
        summary: "Kunde will Treppenhaus, 4 Stockwerke",
        call: {
          id: "call-xyz",
          customer: { number: "+491733828354", name: "Test" },
        },
      },
    });
    assert.equal(parsed.handled, true);
    assert.equal(parsed.skip, false);
    assert.equal(parsed.event?.fromPhone, "+491733828354");
    assert.match(parsed.event?.transcriptSummary ?? "", /Treppenhaus/);
  });

  it("Vapi status-update is skipped (no CRM spam)", () => {
    const parsed = parseVapiServerPayload({ message: { type: "status-update" } });
    assert.equal(parsed.skip, true);
  });

  it("assistant create body is DE Ilyashan", () => {
    const body = buildVapiAssistantCreateBody("https://ilyashan.de/api/voice/inbound");
    assert.equal(body.name, VAPI_ASSISTANT_NAME);
    assert.match(JSON.stringify(body), /Ilyashan|Fenster|Deutsch/i);
  });

  it("Vapi-like payload → DE callback session with transcript", () => {
    const event = normalizeVoiceEvent({
      from: "01733828354",
      caller_name: "Helga Schneider",
      summary: "Treppenhaus 4 Stockwerke, Rückruf bitte morgen",
      call_id: "vapi-call-77",
      outcome: "missed",
    });
    assert.ok(event);
    const mapped = voiceEventToCallbackLead(event!);
    assert.equal(mapped.ok, true);
    if (!mapped.ok) return;
    assert.equal(mapped.name, "Helga Schneider");
    assert.equal(mapped.phone, "01733828354");
    assert.match(mapped.session.salesNotes ?? "", /Voice/);
    assert.match(mapped.session.salesNotes ?? "", /Treppenhaus/);
    assert.match(mapped.session.salesNotes ?? "", /vapi-call-77/);
  });

  it("webhook auth fail-closed; readiness without ENV", () => {
    process.env.VOICE_WEBHOOK_SECRET = "voice-secret-test";
    assert.equal(authorizeVoiceWebhook("Bearer voice-secret-test"), true);
    assert.equal(authorizeVoiceWebhook("Bearer wrong"), false);
    assert.equal(authorizeVoiceWebhook(null), false);
    delete process.env.VOICE_WEBHOOK_SECRET;
    delete process.env.VOICE_AI_ENABLED;
    assert.equal(voiceReadiness().ready, false);
  });

  it("invalid phone → validation fail-closed", () => {
    const mapped = voiceEventToCallbackLead({
      fromPhone: "12",
      callerName: "X",
      outcome: "missed",
    });
    assert.equal(mapped.ok, false);
  });
});

describe("P2 data sync — lead fields / admin / widget / routes", () => {
  it("StoredLead P2 fields wired in store + admin PATCH + UI", () => {
    const store = read("lib/leads-store.ts");
    assert.match(store, /deposit\?:/);
    assert.match(store, /wartungRenewEmail\?:/);
    assert.match(store, /csat\?:/);
    assert.match(store, /csatInvite\?:/);

    const adminRoute = read("app/api/admin/leads/[id]/route.ts");
    assert.match(adminRoute, /depositAction/);
    assert.match(adminRoute, /shouldSendCsatInvite/);
    assert.match(adminRoute, /buildCsatInviteEmail/);
    assert.match(adminRoute, /createDepositRequest/);

    const adminUi = read("components/admin/AdminLeadDetailPanel.tsx");
    assert.match(adminUi, /admin-deposit-request/);
    assert.match(adminUi, /admin-deposit-paid/);
    assert.match(adminUi, /admin-csat-score/);
    assert.match(adminUi, /patchDeposit/);

    const widget = read("components/ConciergeWidget.tsx");
    assert.match(widget, /resolvePhotoIntakeRequirement/);
    assert.match(widget, /required=\{/);

    const step5 = read("components/quote/steps/Step5Contact.tsx");
    assert.match(step5, /photoPolicy\.required/);
    assert.match(step5, /photos\.length > 0/);
    assert.match(step5, /disabled=\{!canSubmit \|\| loading\}/);
    assert.match(step5, /quote-submit-email/);

    const contactApi = read("app/api/contact/route.ts");
    assert.match(contactApi, /enforcePhotoIntake/);

    const leadApi = read("app/api/concierge/lead/route.ts");
    assert.match(leadApi, /photos_required/);
  });

  it("tools + system prompt + communication channels", () => {
    assert.equal(isAllowlistedTool("request_photo_intake"), true);
    assert.equal(isAllowlistedTool("request_deposit"), true);
    assert.equal(isAllowlistedTool("open_whatsapp_handoff"), true);
    assert.equal(isAllowlistedTool("request_callback"), true);

    const prompt = read("lib/assistant/ai/system-prompt.ts");
    assert.match(prompt, /request_photo_intake/);
    assert.match(prompt, /request_deposit/);

    const catalog = read("lib/assistant/sales/catalog.ts");
    assert.match(catalog, /mindestens \*\*1 Foto\*\*/);
  });

  it("cron / voice / feedback / QA routes + vercel schedule", () => {
    const vercel = JSON.parse(read("vercel.json")) as { crons: Array<{ path: string }> };
    assert.ok(vercel.crons.some((c) => c.path.includes("wartung-renew")));
    assert.ok(vercel.crons.some((c) => c.path.includes("appointment-reminders")));

    assert.match(read("app/api/cron/wartung-renew/route.ts"), /findWartungRenewCandidates/);
    assert.match(read("app/api/voice/inbound/route.ts"), /requestCallback/);
    assert.match(read("app/feedback/page.tsx"), /csat-submit/);
    assert.match(read("app/api/feedback/route.ts"), /verifyCsatToken/);
    assert.match(read("app/api/admin/qa/route.ts"), /sampleQaFlags/);
  });

  it("this hard proof is registered in npm test", () => {
    const pkg = JSON.parse(read("package.json")) as { scripts: { test: string } };
    assert.match(pkg.scripts.test, /p2-ops-proof\.test\.ts/);
  });
});
