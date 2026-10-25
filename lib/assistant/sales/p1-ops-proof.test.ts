/**
 * P1 enterprise proofs: speed-to-lead, playbooks, WA context, reminder waves, funnel math.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createSession } from "@/lib/concierge/types";
import {
  buildOwnerWhatsAppToCustomerUrl,
  buildSpeedToLeadAdminBlock,
} from "@/lib/leads/speed-to-lead";
import { buildPlaybookCopy, resolvePlaybookPage } from "@/lib/concierge/playbooks";
import { buildConciergeWhatsAppMessage } from "@/lib/concierge/whatsapp-handoff";
import { buildConciergeLeadAdminEmail } from "@/lib/concierge-email";
import { isAllowlistedTool } from "../tools/registry";
import { needsReminderForDate } from "@/lib/scheduling/appointment-reminders";

const ROOT = join(process.cwd());

describe("P1 speed-to-lead", () => {
  it("builds owner→customer WhatsApp with DE intl prefix", () => {
    const url = buildOwnerWhatsAppToCustomerUrl("01733828354", "Max Mustermann");
    assert.ok(url);
    assert.match(url!, /wa\.me\/491733828354/);
    assert.match(url!, /text=/);
  });

  it("rejects unusable phone fail-closed", () => {
    assert.equal(buildOwnerWhatsAppToCustomerUrl("123", "X"), null);
  });

  it("admin block marks hot priority", () => {
    const block = buildSpeedToLeadAdminBlock({
      name: "Anna",
      phone: "01731234567",
      priority: "hot",
    });
    assert.match(block.subjectPrefix, /⚡/);
    assert.match(block.text, /60/);
    assert.match(block.html, /tel:/);
  });

  it("concierge admin email embeds speed-to-lead actions", () => {
    const session = createSession("p1");
    session.stage = "price_ready";
    session.quote.windowCount = 10;
    session.quote.floorLevel = "og1";
    const email = buildConciergeLeadAdminEmail(session, "Anna Test", "01731234567");
    assert.match(email.subject, /⚡|Assistent/);
    assert.match(email.html, /Anrufen|WhatsApp an Kunden|tel:/);
  });
});

describe("P1 playbooks", () => {
  it("resolves service pages", () => {
    assert.equal(resolvePlaybookPage("/de/bueroreinigung"), "buero");
    assert.equal(resolvePlaybookPage("/de/treppenhausreinigung/angebot"), "treppenhaus");
    assert.equal(resolvePlaybookPage("/de/gutschein"), "gutschein");
  });

  it("hot session pushes close CTAs", () => {
    const session = createSession("hot");
    session.stage = "price_ready";
    const copy = buildPlaybookCopy("/de", session);
    assert.match(copy.nudge, /Rückruf|Termin/i);
    assert.ok(copy.quickReplies.some((q) => /Rückruf|Termin|Anrufen/i.test(q)));
  });
});

describe("P1 WhatsApp context", () => {
  it("includes büro and treppenhaus drafts", () => {
    const session = createSession("wa");
    session.assistantProduct = "buero";
    session.bueroDraft = { totalAreaM2: 120, frequency: "2_PER_WEEK" };
    const msg = buildConciergeWhatsAppMessage(session);
    assert.match(msg, /120/);
    assert.match(msg, /Büro/i);
  });

  it("open_whatsapp_handoff is allowlisted", () => {
    assert.equal(isAllowlistedTool("open_whatsapp_handoff"), true);
  });
});

describe("P1 reminder waves", () => {
  it("morning wave independent of eve", () => {
    assert.equal(
      needsReminderForDate(
        { confirmedDate: "2026-07-13", reminderEmail: { sentAt: "x", forDate: "2026-07-13" } },
        "2026-07-13",
        "morning"
      ),
      true
    );
  });
});

describe("P1 meta — wiring", () => {
  it("morning cron route + vercel schedule exist", () => {
    const vercel = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8")) as {
      crons: Array<{ path: string }>;
    };
    assert.ok(vercel.crons.some((c) => c.path.includes("appointment-reminders")));
    assert.ok(vercel.crons.some((c) => c.path.includes("morning")));
    const morning = readFileSync(
      join(ROOT, "app/api/cron/appointment-reminders-morning/route.ts"),
      "utf8"
    );
    assert.match(morning, /wave.*morning|morning/);
  });

  it("widget exposes WhatsApp urgent action", () => {
    const widget = readFileSync(join(ROOT, "components/ConciergeWidget.tsx"), "utf8");
    assert.match(widget, /concierge-whatsapp-tap/);
  });

  it("this proof is in npm test", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
      scripts: { test: string };
    };
    assert.match(pkg.scripts.test, /p1-ops-proof\.test\.ts/);
  });
});
