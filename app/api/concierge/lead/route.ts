import { NextResponse } from "next/server";
import { getConciergeEnabled } from "@/lib/concierge-settings";
import type { ConciergeSession } from "@/lib/concierge/types";
import type { PhotoPayload } from "@/lib/photo-upload";
import { submitSalesLead } from "@/lib/assistant/sales/submit-lead";

export const runtime = "nodejs";

interface LeadBody {
  name?: string;
  phone?: string;
  session?: ConciergeSession;
  photos?: PhotoPayload[];
  website?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LeadBody;

    if (body.website) {
      return NextResponse.json({ success: true });
    }

    if (!(await getConciergeEnabled())) {
      return NextResponse.json(
        { error: "Der Assistent ist derzeit nicht aktiv." },
        { status: 503 }
      );
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const session = body.session;

    if (!session || typeof session !== "object") {
      return NextResponse.json({ error: "Sitzung ungültig." }, { status: 400 });
    }

    const result = await submitSalesLead({
      name,
      phone,
      session,
      photos: body.photos,
    });

    if (!result.ok) {
      const status =
        result.code === "validation" || result.code === "photos" ? 400 : 503;
      return NextResponse.json({ error: result.messageDe }, { status });
    }

    return NextResponse.json({
      success: true,
      message: result.messageDe,
    });
  } catch (error) {
    console.error("Concierge lead error:", error);
    return NextResponse.json(
      { error: "Anfrage konnte nicht gesendet werden. Bitte rufen Sie uns an." },
      { status: 500 }
    );
  }
}
