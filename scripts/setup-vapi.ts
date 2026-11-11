/**
 * Creates Ilyashan Vapi assistant + free inbound phone number + prints 0173 forward steps.
 *
 * Usage:
 *   VAPI_API_KEY=xxx VOICE_WEBHOOK_SECRET=yyy npx tsx scripts/setup-vapi.ts
 *
 * Optional:
 *   VAPI_SERVER_URL=https://ilyashan.de/api/voice/inbound
 *   VAPI_AREA_CODE=415
 */
import {
  buildVapiAssistantCreateBody,
  ILYASHAN_PUBLIC_PHONE_DISPLAY,
  ILYASHAN_PUBLIC_PHONE_E164,
  VAPI_ASSISTANT_NAME,
} from "../lib/voice/vapi-assistant";

const API = "https://api.vapi.ai";

async function vapiFetch(path: string, key: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} → ${res.status}: ${text.slice(0, 500)}`);
  }
  return json as Record<string, unknown>;
}

async function main() {
  const key = process.env.VAPI_API_KEY?.trim();
  if (!key) {
    console.error(`
FEHLT: VAPI_API_KEY

1) https://dashboard.vapi.ai/ → eingeloggt
2) Organization / API Keys → Private Key kopieren
3) Dann:

   export VAPI_API_KEY='sk_...'
   export VOICE_WEBHOOK_SECRET='$(openssl rand -hex 24)'
   npx tsx scripts/setup-vapi.ts
`);
    process.exit(1);
  }

  const secret =
    process.env.VOICE_WEBHOOK_SECRET?.trim() ||
    `ily-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

  const baseUrl = (
    process.env.VAPI_SERVER_URL?.trim() ||
    "https://ilyashan.de/api/voice/inbound"
  ).replace(/\?.*$/, "");
  const serverUrl = `${baseUrl}?secret=${encodeURIComponent(secret)}`;

  console.log("→ Assistant anlegen:", VAPI_ASSISTANT_NAME);
  const assistant = await vapiFetch("/assistant", key, {
    method: "POST",
    body: JSON.stringify(buildVapiAssistantCreateBody(serverUrl)),
  });
  const assistantId = String(assistant.id ?? "");
  console.log("✓ Assistant ID:", assistantId);

  const area = process.env.VAPI_AREA_CODE?.trim() || "212";
  console.log("→ Free Vapi Nummer (US area", area + ") …");
  const phone = await vapiFetch("/phone-number", key, {
    method: "POST",
    body: JSON.stringify({
      provider: "vapi",
      assistantId,
      numberDesiredAreaCode: area,
      name: "Ilyashan inbound (forward from 0173)",
      server: { url: serverUrl },
    }),
  });

  const vapiNumber = String(phone.number ?? phone.numberE164 ?? "(pending — Dashboard prüfen)");
  const phoneId = String(phone.id ?? "");

  console.log(`
═══════════════════════════════════════════════════════════
 VAPI SETUP OK
═══════════════════════════════════════════════════════════
 Assistant:     ${assistantId}
 Phone ID:      ${phoneId}
 Vapi-Nummer:   ${vapiNumber}

 Öffentliche Firmennummer (Kunden sehen das):
   ${ILYASHAN_PUBLIC_PHONE_DISPLAY}  (${ILYASHAN_PUBLIC_PHONE_E164})

 WICHTIG — 0173 kann Vapi nicht „besitzen“.
 Kunden rufen weiter 0173 an. Du leitest um:

 iPhone / Android / Telekom:
   Einstellungen → Anrufweiterleitung / Rufumleitung
   → „Immer“ ODER „Nicht angenommen / Besetzt“
   → Ziel: ${vapiNumber}

 Vercel ENV (Production + Preview):
   VAPI_API_KEY=${key.slice(0, 6)}…
   VAPI_ASSISTANT_ID=${assistantId}
   VAPI_PHONE_NUMBER_ID=${phoneId}
   VOICE_AI_ENABLED=true
   VOICE_WEBHOOK_SECRET=${secret}

 Webhook (schon am Assistant):
   ${serverUrl}

 Test:
   1) Zuerst direkt ${vapiNumber} anrufen (Robot antwortet?)
   2) Dann 0173 → Weiterleitung prüfen
═══════════════════════════════════════════════════════════
`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
