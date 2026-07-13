#!/usr/bin/env node
/**
 * Google Indexing API — URL_UPDATED notifications from urls.txt
 *
 * Setup:
 *   1. Place service-account.json in this folder (or set GOOGLE_SERVICE_ACCOUNT_KEY)
 *   2. Add service account email as Owner in Google Search Console
 *   3. npm install (in this folder)
 *   4. node index.js
 *
 * Env:
 *   GOOGLE_SERVICE_ACCOUNT_KEY — path to JSON key (default: ./service-account.json)
 *   URLS_FILE                  — path to url list (default: ./urls.txt)
 *   REQUEST_DELAY_MS           — delay between requests (default: 1500)
 *   DRY_RUN=1                  — parse URLs only, no API calls
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";

const __dirname = dirname(fileURLToPath(import.meta.url));

const KEY_FILE = process.env.GOOGLE_SERVICE_ACCOUNT_KEY ?? join(__dirname, "service-account.json");
const URLS_FILE = process.env.URLS_FILE ?? join(__dirname, "urls.txt");
const REQUEST_DELAY_MS = Number(process.env.REQUEST_DELAY_MS ?? 1500);
const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadUrls(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`urls.txt not found: ${filePath}\nRun: node generate-urls.mjs`);
  }
  const lines = readFileSync(filePath, "utf8").split("\n");
  const urls = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    try {
      const u = new URL(trimmed);
      if (u.protocol !== "https:" && u.protocol !== "http:") {
        throw new Error(`unsupported protocol: ${u.protocol}`);
      }
      urls.push(u.href);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Invalid URL in urls.txt: "${trimmed}" — ${message}`);
    }
  }
  if (urls.length === 0) {
    throw new Error("urls.txt contains no URLs");
  }
  return urls;
}

function formatApiError(err) {
  const api = err.response?.data?.error;
  if (api) {
    return `[${api.code ?? err.code}] ${api.message}${api.status ? ` (${api.status})` : ""}`;
  }
  return err.message ?? String(err);
}

async function publishUrl(indexing, url, index, total) {
  const label = `[${index + 1}/${total}]`;
  if (DRY_RUN) {
    console.log(`${label} DRY-RUN would publish URL_UPDATED: ${url}`);
    return { ok: true, url };
  }

  try {
    const res = await indexing.urlNotifications.publish({
      requestBody: {
        url,
        type: "URL_UPDATED",
      },
    });
    console.log(`${label} ✓ ${url} (HTTP ${res.status})`);
    return { ok: true, url };
  } catch (err) {
    const msg = formatApiError(err);
    console.error(`${label} ✗ ${url}`);
    console.error(`         ${msg}`);
    return { ok: false, url, error: msg };
  }
}

async function main() {
  console.log("=== Google Indexing API — URL_UPDATED (Ilyashan) ===\n");

  if (!DRY_RUN && !existsSync(KEY_FILE)) {
    console.error(`Service account key not found: ${KEY_FILE}`);
    console.error("Download JSON from Google Cloud Console and save as service-account.json");
    console.error("Or set GOOGLE_SERVICE_ACCOUNT_KEY=/path/to/key.json");
    process.exit(1);
  }

  const urls = loadUrls(URLS_FILE);
  console.log(`URLs loaded:  ${urls.length}`);
  console.log(`Key file:     ${DRY_RUN ? "(dry run)" : KEY_FILE}`);
  console.log(`Delay:        ${REQUEST_DELAY_MS}ms between requests`);
  if (DRY_RUN) console.log("Mode:         DRY RUN (no API calls)\n");
  else console.log("");

  let indexing;
  if (!DRY_RUN) {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE,
      scopes: ["https://www.googleapis.com/auth/indexing"],
    });
    indexing = google.indexing({ version: "v3", auth });
  }

  const results = [];
  for (let i = 0; i < urls.length; i++) {
    const result = await publishUrl(indexing, urls[i], i, urls.length);
    results.push(result);
    if (i < urls.length - 1) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  const success = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  console.log("\n=== Summary ===");
  console.log(`Total:    ${urls.length}`);
  console.log(`Success:  ${success}`);
  console.log(`Failed:   ${failed.length}`);

  if (failed.length > 0) {
    console.log("\nFailed URLs:");
    for (const f of failed) {
      console.log(`  - ${f.url}`);
      console.log(`    ${f.error}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\nFatal error:", err.message ?? err);
  process.exit(1);
});
