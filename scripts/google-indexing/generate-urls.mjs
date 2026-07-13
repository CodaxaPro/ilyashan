#!/usr/bin/env node
/**
 * Generates urls.txt from the same URL set as app/sitemap.ts
 * Run: node scripts/google-indexing/generate-urls.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.SITE_URL ?? "https://ilyashan.de/de";

const LOCATION_SLUGS = [
  "baesweiler", "aachen", "wurselen", "alsdorf", "ubach-palenberg",
  "herzogenrath", "eschweiler", "stolberg", "roetgen", "kornelimuenster",
  "dueren", "juelich", "geilenkirchen", "heinsberg", "erkelenz", "monschau",
];
const INTENT_TYPES = [
  "fensterputzer", "fenster-putzen", "glasreinigung", "fensterreiniger",
  "fensterreinigung-preis", "fensterreinigung-kosten", "fensterreinigung-firma",
  "professionelle-fensterreinigung", "gebaeudereinigung", "solaranlagen-reinigung",
  "glasfassaden-reinigung", "schaufenster-reinigung", "wintergarten-reinigung",
  "hausmeister-fenster", "wartungsvertrag-fenster", "geschenk",
];
const PACKAGE_SLUGS = ["privat", "gewerbe", "rahmen", "solar", "fassade", "wartung"];
const GUIDE_SLUGS = [
  "was-kostet-fensterreinigung", "fensterreinigung-selber-machen-vs-profi",
  "streifenfreie-fenster-tipps", "fensterreinigung-winter", "fensterreinigung-gewerbe-tipps",
  "solaranlage-reinigung-guide", "rahmen-falz-warum-wichtig", "fensterreinigung-haeufigkeit",
  "fensterreinigung-umzug-einzug", "erste-beauftragung-fensterprofi",
  "gutschein-fensterreinigung-tipps", "glasfassade-reinigung-sicherheit",
];
const GIFT_SLUGS = [
  "fensterreinigung-geschenk", "muttertag", "weihnachten", "valentinstag", "paar",
  "geburtstag", "freundin", "vatertag", "ostern", "last-minute", "danke", "hochzeit",
  "jubilaeum", "abschied", "firmen-geschenk", "ruhestand", "team-geschenk",
  "online", "fensterreinigung", "reinigung", "geschenkidee", "zeit-schenken",
  "selbstfuersorge", "premium", "fensterreinigung-nrw", "fuer-mama", "fuer-papa",
  "fuer-oma", "fuer-opa", "fuer-freund", "silberhochzeit", "nikolaus", "verlobung",
  "ueberraschung",
];

const urls = [
  BASE,
  `${BASE}/fensterreinigung`,
  ...PACKAGE_SLUGS.map((s) => `${BASE}/fensterreinigung/${s}`),
  `${BASE}/gutschein`,
  ...GIFT_SLUGS.map((s) => `${BASE}/gutschein/${s}`),
  ...LOCATION_SLUGS.map((s) => `${BASE}/fensterreinigung-${s}`),
  `${BASE}/ratgeber`,
  ...GUIDE_SLUGS.map((s) => `${BASE}/ratgeber/${s}`),
  ...INTENT_TYPES.flatMap((t) => LOCATION_SLUGS.map((c) => `${BASE}/${t}-${c}`)),
  `${BASE}/angebot`,
  `${BASE}/impressum`,
  `${BASE}/datenschutz`,
];

const out = join(DIR, "urls.txt");
const body = `# Ilyashan sitemap URLs (${urls.length} total)\n# Generated ${new Date().toISOString()}\n${urls.join("\n")}\n`;
writeFileSync(out, body, "utf8");
console.log(`Wrote ${urls.length} URLs to ${out}`);
