#!/usr/bin/env node
/**
 * Validates Google Cloud service account setup before running index.js
 * Run: node verify-gcp.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";

const DIR = dirname(fileURLToPath(import.meta.url));
const KEY_FILE = process.env.GOOGLE_SERVICE_ACCOUNT_KEY ?? join(DIR, "service-account.json");
const TEST_URL = process.env.TEST_URL ?? "https://ilyashan.de/de/fensterreinigung";

async function main() {
  console.log("=== GCP / Indexing API Setup Check (Ilyashan) ===\n");

  if (!existsSync(KEY_FILE)) {
    console.error("✗ service-account.json bulunamadı");
    console.error(`  Beklenen konum: ${KEY_FILE}`);
    console.error("\nAdımlar:");
    console.error("  1. console.cloud.google.com → Proje: ilyashan-indexing");
    console.error("  2. Web Search Indexing API → Enable");
    console.error("  3. Service Account → JSON key indir");
    console.error("  4. Dosyayı service-account.json olarak kaydet");
    console.error("  5. Search Console → https://ilyashan.de → Users → client_email → Owner");
    process.exit(1);
  }

  let key;
  try {
    key = JSON.parse(readFileSync(KEY_FILE, "utf8"));
  } catch {
    console.error("✗ JSON dosyası okunamadı — geçerli bir service account key mi?");
    process.exit(1);
  }

  const email = key.client_email;
  if (!email) {
    console.error("✗ client_email JSON içinde yok");
    process.exit(1);
  }

  console.log("✓ Key file found");
  console.log(`  Service account: ${email}`);
  console.log(`  Project:         ${key.project_id ?? "(unknown)"}`);
  console.log("");

  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });

  const indexing = google.indexing({ version: "v3", auth });

  console.log(`Test request: URL_UPDATED → ${TEST_URL}`);
  console.log("(Tek URL test — 129 URL göndermeden önce yetkiyi doğrular)\n");

  try {
    const res = await indexing.urlNotifications.publish({
      requestBody: { url: TEST_URL, type: "URL_UPDATED" },
    });
    console.log(`✓ API yanıtı: HTTP ${res.status}`);
    console.log("  Search Console Owner izni çalışıyor gibi görünüyor.");
    console.log("\nSonraki adım: node index.js");
  } catch (err) {
    const apiErr = err.response?.data?.error?.message;
    const msg = apiErr ?? (err instanceof Error ? err.message : String(err));
    console.error("✗ API hatası:", msg);
    console.error("\nOlası nedenler:");
    console.error("  · Web Search Indexing API etkin değil");
    console.error(`  · ${email} Search Console'da Owner değil`);
    console.error("  · Google politikası: Fensterreinigung landing sayfaları API kapsamında olmayabilir");
    console.error("\nYine de sitemap + GSC organik indexleme çalışır.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
