/**
 * Patches existing Vapi assistant with enterprise tools + DE prompt.
 *
 *   export VAPI_API_KEY='…'
 *   export VOICE_WEBHOOK_SECRET='…'   # same as prod
 *   npx tsx scripts/patch-vapi-assistant.ts
 *
 * Optional: VAPI_ASSISTANT_ID=1b32a2d4-294c-4b12-8e5d-fe58986c49ba
 */
import { buildVapiAssistantCreateBody } from "../lib/voice/vapi-assistant";

const API = "https://api.vapi.ai";
const DEFAULT_ID = "1b32a2d4-294c-4b12-8e5d-fe58986c49ba";

async function main() {
  const key = process.env.VAPI_API_KEY?.trim();
  const secret = process.env.VOICE_WEBHOOK_SECRET?.trim();
  if (!key || !secret) {
    console.error("Need VAPI_API_KEY and VOICE_WEBHOOK_SECRET");
    process.exit(1);
  }
  const assistantId = process.env.VAPI_ASSISTANT_ID?.trim() || DEFAULT_ID;
  const serverUrl = `https://ilyashan.de/api/voice/inbound?secret=${encodeURIComponent(secret)}`;
  const body = buildVapiAssistantCreateBody(serverUrl);

  const res = await fetch(`${API}/assistant/${assistantId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(res.status, text.slice(0, 800));
    process.exit(1);
  }
  console.log("✓ Assistant patched:", assistantId);
  console.log("  tools → https://ilyashan.de/api/voice/tools");
  console.log("  price_fenster | get_available_slots | book_appointment | request_callback");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
