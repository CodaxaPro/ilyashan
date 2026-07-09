import { NextResponse } from "next/server";
import { Resend } from "resend";
import { siteConfig } from "@/lib/config";
import {
  buildAdminNotificationEmail,
  buildCustomerConfirmationEmail,
} from "@/lib/email";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, plz, service, message, website } = body;

    if (website) {
      return NextResponse.json({ success: true });
    }

    if (!name || !phone || !plz || !service) {
      return NextResponse.json(
        { error: "Bitte füllen Sie alle Pflichtfelder aus." },
        { status: 400 }
      );
    }

    if (!resend || process.env.RESEND_API_KEY?.includes("HIER_IHREN")) {
      console.error("RESEND_API_KEY fehlt oder ungültig – E-Mail konnte nicht gesendet werden.");
      return NextResponse.json(
        { error: "E-Mail-Versand ist noch nicht konfiguriert. Bitte rufen Sie uns direkt an." },
        { status: 503 }
      );
    }

    const contactData = { name, phone, email, plz, service, message };
    const adminEmail = buildAdminNotificationEmail(contactData);
    const toEmail = process.env.CONTACT_EMAIL ?? siteConfig.contact.email;
    const fromEmail = process.env.FROM_EMAIL ?? "Ilyashan Fensterreinigung <onboarding@resend.dev>";

    const { error: adminError } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: adminEmail.replyTo,
      subject: adminEmail.subject,
      text: adminEmail.text,
      html: adminEmail.html,
    });

    if (adminError) {
      console.error("Resend admin error:", adminError);
      const errorMessage =
        adminError.message?.includes("not verified")
          ? "E-Mail-Versand wartet auf Domain-Verifizierung. Bitte rufen Sie uns direkt an."
          : "E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder rufen Sie uns an.";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    if (email) {
      const customerEmail = buildCustomerConfirmationEmail(contactData);
      const { error: customerError } = await resend.emails.send({
        from: fromEmail,
        to: [email],
        subject: customerEmail.subject,
        text: customerEmail.text,
        html: customerEmail.html,
      });

      if (customerError) {
        console.error("Resend customer confirmation error:", customerError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut." },
      { status: 500 }
    );
  }
}
