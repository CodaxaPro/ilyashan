import { NextResponse } from "next/server";
import { processConciergeMessage, createSession } from "@/lib/concierge";
import type { ConciergeSession } from "@/lib/concierge";
import { recordUnknownMessage, shouldLogUnknownMessage } from "@/lib/concierge/unknown-queue";
import { getConciergeEnabled } from "@/lib/concierge-settings";
import { getFensterPricingConfig } from "@/lib/pricing-config";
import { createQuotePricingContext } from "@/lib/quote-pricing-context";

export const runtime = "nodejs";

interface ConciergeRequestBody {
  message?: string;
  session?: ConciergeSession;
  website?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ConciergeRequestBody;

    if (body.website) {
      return NextResponse.json({ success: true });
    }

    if (!(await getConciergeEnabled())) {
      return NextResponse.json(
        { error: "Der Assistent ist derzeit nicht aktiv." },
        { status: 503 }
      );
    }

    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message || message.length > 2000) {
      return NextResponse.json(
        { error: "Bitte geben Sie eine gültige Nachricht ein." },
        { status: 400 }
      );
    }

    const session =
      body.session && typeof body.session === "object"
        ? body.session
        : createSession(crypto.randomUUID());

    const pricingConfig = await getFensterPricingConfig();
    const pricingCtx = createQuotePricingContext(pricingConfig);

    const reply = processConciergeMessage(message, session, pricingCtx);

    if (shouldLogUnknownMessage(reply.intent)) {
      void recordUnknownMessage({
        message,
        intent: reply.intent,
        sessionId: reply.session.id,
      });
    }

    return NextResponse.json({
      success: true,
      reply: reply.text,
      intent: reply.intent,
      session: reply.session,
      actions: reply.actions,
      quickReplies: reply.quickReplies,
    });
  } catch {
    return NextResponse.json(
      { error: "Der Assistent ist vorübergehend nicht verfügbar. Bitte versuchen Sie es erneut oder rufen Sie uns an." },
      { status: 500 }
    );
  }
}
