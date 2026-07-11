import { NextResponse } from "next/server";
import { Resend } from "resend";
import { siteConfig } from "@/lib/config";
import { buildConciergeLeadAdminEmail } from "@/lib/concierge-email";
import { validateLeadContact } from "@/lib/concierge/lead";
import type { ConciergeSession } from "@/lib/concierge/types";
import {
  normalizePhotoPayloads,
  photosToResendAttachments,
  validatePhotos,
  type PhotoPayload,
} from "@/lib/photo-upload";
import { saveLead } from "@/lib/leads-store";
import { createConciergeStoredLead } from "@/lib/lead-records";
import { getConciergeEnabled } from "@/lib/concierge-settings";
import { getFensterPricingConfig } from "@/lib/pricing-config";
import { createQuotePricingContext } from "@/lib/quote-pricing-context";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
    const photos = normalizePhotoPayloads(body.photos);
    const photoError = validatePhotos(photos);

    const validationError = validateLeadContact(name, phone);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (!session || typeof session !== "object") {
      return NextResponse.json({ error: "Sitzung ungültig." }, { status: 400 });
    }

    if (photoError) {
      return NextResponse.json({ error: photoError }, { status: 400 });
    }

    if (!resend || process.env.RESEND_API_KEY?.includes("HIER_IHREN")) {
      console.error("RESEND_API_KEY fehlt – Concierge-Lead nicht per E-Mail gesendet.");
      return NextResponse.json(
        { error: "E-Mail-Versand ist vorübergehend nicht verfügbar. Bitte rufen Sie uns direkt an." },
        { status: 503 }
      );
    }

    const pricingConfig = await getFensterPricingConfig();
    const pricingCtx = createQuotePricingContext(pricingConfig);
    const adminEmail = buildConciergeLeadAdminEmail(session, name, phone, photos.length, pricingCtx);
    const contactEmail = process.env.CONTACT_EMAIL ?? siteConfig.contact.email;
    const fromEmail =
      process.env.FROM_EMAIL ?? `Ilyashan Fensterreinigung <${siteConfig.contact.email}>`;

    await resend.emails.send({
      from: fromEmail,
      to: contactEmail,
      replyTo: siteConfig.contact.email,
      subject: adminEmail.subject,
      text: adminEmail.text,
      html: adminEmail.html,
      attachments: photosToResendAttachments(photos),
    });

    await saveLead(createConciergeStoredLead(session, name, phone, photos.length, pricingCtx));

    return NextResponse.json({
      success: true,
      message: `Vielen Dank, ${name.split(" ")[0]}! Wir melden uns innerhalb von ${siteConfig.business.responseTime} bei Ihnen.`,
    });
  } catch (error) {
    console.error("Concierge lead error:", error);
    return NextResponse.json(
      { error: "Anfrage konnte nicht gesendet werden. Bitte rufen Sie uns an." },
      { status: 500 }
    );
  }
}
