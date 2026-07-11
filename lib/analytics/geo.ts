import { siteConfig } from "@/lib/config";

export interface SessionGeo {
  ip?: string;
  ipHash?: string;
  countryCode: string;
  countryName: string;
  regionCode: string;
  regionName: string;
  city: string;
  continent: string;
  continentName: string;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  serviceAreaZone: ServiceAreaZone;
  serviceAreaMatch: string;
  inServiceArea: boolean;
  mapsUrl: string;
  label: string;
  labelShort: string;
}

export type ServiceAreaZone =
  | "core"
  | "aachen"
  | "extended"
  | "nearby_nrw"
  | "germany_other"
  | "international"
  | "unknown";

export const SERVICE_AREA_ZONE_LABELS_TR: Record<ServiceAreaZone, string> = {
  core: "Stammgebiet",
  aachen: "Aachen bölgesi",
  extended: "Geniş çevre",
  nearby_nrw: "NRW (dışı)",
  germany_other: "Almanya (bölge dışı)",
  international: "Yurt dışı",
  unknown: "Konum bilinmiyor",
};

const HQ = { lat: 50.9096, lon: 6.1837, label: "Baesweiler (Merkez)" };

const DE_REGIONS_TR: Record<string, string> = {
  BW: "Baden-Württemberg",
  BY: "Bavyera",
  BE: "Berlin",
  BB: "Brandenburg",
  HB: "Bremen",
  HH: "Hamburg",
  HE: "Hessen",
  MV: "Mecklenburg-Vorpommern",
  NI: "Aşağı Saksonya",
  NW: "Kuzey Ren-Vestfalya",
  RP: "Renanya-Pfalz",
  SL: "Saarland",
  SN: "Saksonya",
  ST: "Saksonya-Anhalt",
  SH: "Schleswig-Holstein",
  TH: "Turingiya",
};

const CONTINENT_LABELS_TR: Record<string, string> = {
  AF: "Afrika",
  AN: "Antarktika",
  AS: "Asya",
  EU: "Avrupa",
  NA: "Kuzey Amerika",
  OC: "Okyanusya",
  SA: "Güney Amerika",
};

const CORE_CITIES = new Set(
  siteConfig.serviceArea.regions[0].areas.map(normalizeCityKey)
);
const AACHEN_CITIES = new Set(
  siteConfig.serviceArea.regions[1].areas.map(normalizeCityKey)
);
const EXTENDED_CITIES = new Set(
  siteConfig.serviceArea.regions[2].areas.map(normalizeCityKey)
);

const CITY_ALIASES: Record<string, string> = {
  aachen: "Aachen",
  aixlachapelle: "Aachen",
  baesweiler: "Baesweiler",
  alsdorf: "Alsdorf",
  wurselen: "Würselen",
  ubachpalenberg: "Übach-Palenberg",
  herzogenrath: "Herzogenrath",
  eschweiler: "Eschweiler",
  stolberg: "Stolberg",
  roetgen: "Roetgen",
  koln: "Köln",
  koeln: "Köln",
  dusseldorf: "Düsseldorf",
  duesseldorf: "Düsseldorf",
  monchengladbach: "Mönchengladbach",
  moenchengladbach: "Mönchengladbach",
};

let countryDisplay: Intl.DisplayNames | null = null;

function getCountryDisplay(): Intl.DisplayNames {
  if (!countryDisplay) {
    countryDisplay = new Intl.DisplayNames(["tr"], { type: "region" });
  }
  return countryDisplay;
}

export function decodeGeoHeader(value: string | null | undefined): string {
  if (!value) return "";
  try {
    return decodeURIComponent(value.replace(/\+/g, " ")).trim();
  } catch {
    return value.trim();
  }
}

export function normalizeCityKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

export function formatCountryName(countryCode: string): string {
  const code = countryCode.trim().toUpperCase();
  if (!code) return "—";
  try {
    return getCountryDisplay().of(code) ?? code;
  } catch {
    return code;
  }
}

export function formatRegionName(countryCode: string, regionCode: string): string {
  const country = countryCode.trim().toUpperCase();
  const region = regionCode.trim().toUpperCase();
  if (!region) return "—";
  if (country === "DE") {
    return DE_REGIONS_TR[region] ?? region;
  }
  return region;
}

export function formatContinentName(code: string): string {
  const key = code.trim().toUpperCase();
  return CONTINENT_LABELS_TR[key] ?? key ?? "—";
}

function canonicalCityName(city: string): string {
  const key = normalizeCityKey(city);
  if (!key) return "";
  return CITY_ALIASES[key] ?? city.trim();
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function resolveServiceArea(input: {
  city: string;
  countryCode: string;
  regionCode: string;
  latitude: number | null;
  longitude: number | null;
}): { zone: ServiceAreaZone; match: string; inServiceArea: boolean } {
  const city = canonicalCityName(input.city);
  const cityKey = normalizeCityKey(city);
  const country = input.countryCode.toUpperCase();

  if (!city && input.latitude == null) {
    return { zone: "unknown", match: "—", inServiceArea: false };
  }

  if (country && country !== "DE") {
    return {
      zone: "international",
      match: city || formatCountryName(country),
      inServiceArea: false,
    };
  }

  if (cityKey && CORE_CITIES.has(cityKey)) {
    return { zone: "core", match: city, inServiceArea: true };
  }
  if (cityKey && AACHEN_CITIES.has(cityKey)) {
    return { zone: "aachen", match: city, inServiceArea: true };
  }
  if (cityKey && EXTENDED_CITIES.has(cityKey)) {
    return { zone: "extended", match: city, inServiceArea: true };
  }

  if (input.latitude != null && input.longitude != null) {
    const km = haversineKm(HQ.lat, HQ.lon, input.latitude, input.longitude);
    if (km <= 8) return { zone: "core", match: `${city || HQ.label} (~${km.toFixed(1)} km)`, inServiceArea: true };
    if (km <= 18) return { zone: "aachen", match: `${city || "Aachen bölgesi"} (~${km.toFixed(1)} km)`, inServiceArea: true };
    if (km <= 30) return { zone: "extended", match: `${city || "Çevre"} (~${km.toFixed(1)} km)`, inServiceArea: true };
    if (km <= 80 && input.regionCode.toUpperCase() === "NW") {
      return { zone: "nearby_nrw", match: `${city || "NRW"} (~${km.toFixed(1)} km)`, inServiceArea: false };
    }
    if (country === "DE") {
      return { zone: "germany_other", match: `${city || "Almanya"} (~${km.toFixed(1)} km)`, inServiceArea: false };
    }
  }

  if (input.regionCode.toUpperCase() === "NW" && city) {
    return { zone: "nearby_nrw", match: city, inServiceArea: false };
  }

  if (country === "DE" && city) {
    return { zone: "germany_other", match: city, inServiceArea: false };
  }

  return { zone: "unknown", match: city || "—", inServiceArea: false };
}

export function buildMapsUrl(latitude: number | null, longitude: number | null, label: string): string {
  if (latitude != null && longitude != null) {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }
  if (label && label !== "—") {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}`;
  }
  return "";
}

export function extractRequestGeo(request: Request): Omit<SessionGeo, "ipHash" | "label" | "labelShort" | "mapsUrl"> & {
  ip?: string;
} {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || undefined;

  const countryCode = (request.headers.get("x-vercel-ip-country") ?? "").toUpperCase();
  const regionCode = decodeGeoHeader(request.headers.get("x-vercel-ip-country-region"));
  const city = decodeGeoHeader(request.headers.get("x-vercel-ip-city"));
  const continent = (request.headers.get("x-vercel-ip-continent") ?? "").toUpperCase();
  const timezone = decodeGeoHeader(request.headers.get("x-vercel-ip-timezone"));

  const latitude = parseCoord(request.headers.get("x-vercel-ip-latitude"));
  const longitude = parseCoord(request.headers.get("x-vercel-ip-longitude"));

  const countryName = formatCountryName(countryCode);
  const regionName = formatRegionName(countryCode, regionCode);
  const continentName = formatContinentName(continent);
  const canonicalCity = canonicalCityName(city);

  const service = resolveServiceArea({
    city: canonicalCity,
    countryCode,
    regionCode,
    latitude,
    longitude,
  });

  return {
    ip,
    countryCode,
    countryName,
    regionCode,
    regionName,
    city: canonicalCity,
    continent,
    continentName,
    timezone,
    latitude,
    longitude,
    serviceAreaZone: service.zone,
    serviceAreaMatch: service.match,
    inServiceArea: service.inServiceArea,
  };
}

function parseCoord(value: string | null): number | null {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function buildSessionGeoLabels(geo: {
  city: string | null;
  country?: string | null;
  country_code?: string | null;
  region?: string | null;
  region_code?: string | null;
  countryName?: string | null;
  regionName?: string | null;
}): { label: string; labelShort: string } {
  const countryCode = (geo.country_code ?? geo.country ?? "").toString().toUpperCase();
  const city = geo.city?.trim() ?? "";
  const countryName = geo.countryName ?? formatCountryName(countryCode);
  const regionName = geo.regionName ?? formatRegionName(countryCode, geo.region_code ?? geo.region ?? "");

  const parts = [city, regionName !== "—" ? regionName : "", countryName !== "—" ? countryName : ""].filter(
    Boolean
  );
  const label = parts.length > 0 ? parts.join(", ") : "—";
  const labelShort = city || countryName || "—";
  return { label, labelShort };
}

export function sessionRowToGeo(row: {
  city: string | null;
  country: string | null;
  region?: string | null;
  region_code?: string | null;
  continent?: string | null;
  timezone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  service_area_zone?: string | null;
  service_area_match?: string | null;
  in_service_area?: boolean | null;
}): SessionGeo {
  const countryCode = (row.country ?? "").toUpperCase();
  const regionCode = row.region_code ?? row.region ?? "";
  const { label, labelShort } = buildSessionGeoLabels({
    city: row.city,
    country_code: countryCode,
    region_code: regionCode,
    countryName: formatCountryName(countryCode),
    regionName: formatRegionName(countryCode, regionCode),
  });

  const latitude = row.latitude ?? null;
  const longitude = row.longitude ?? null;
  const service =
    row.service_area_zone && row.service_area_match
      ? {
          zone: row.service_area_zone as ServiceAreaZone,
          match: row.service_area_match,
          inServiceArea: Boolean(row.in_service_area),
        }
      : resolveServiceArea({
          city: row.city ?? "",
          countryCode,
          regionCode,
          latitude,
          longitude,
        });

  return {
    countryCode,
    countryName: formatCountryName(countryCode),
    regionCode,
    regionName: formatRegionName(countryCode, regionCode),
    city: row.city ?? "",
    continent: row.continent ?? "",
    continentName: formatContinentName(row.continent ?? ""),
    timezone: row.timezone ?? "",
    latitude,
    longitude,
    serviceAreaZone: service.zone,
    serviceAreaMatch: service.match,
    inServiceArea: service.inServiceArea,
    mapsUrl: buildMapsUrl(latitude, longitude, label),
    label,
    labelShort,
  };
}
