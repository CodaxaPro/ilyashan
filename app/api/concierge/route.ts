import { NextResponse } from "next/server";
import { processConciergeMessage, createSession } from "@/lib/concierge";
import type { ConciergeSession } from "@/lib/concierge";
import { recordUnknownMessage, shouldLogUnknownMessage } from "@/lib/concierge/unknown-queue";

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

    const reply = processConciergeMessage(message, session);

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
