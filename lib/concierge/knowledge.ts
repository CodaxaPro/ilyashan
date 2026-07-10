import { siteConfig } from "@/lib/config";
import { quoteServices } from "@/lib/quote-form";
import { routes } from "@/lib/routes";
import type { ConciergeAction } from "./types";
import type { ConciergeSession } from "./types";
import { getConciergeWhatsAppUrl } from "./whatsapp-handoff";

export function wizardAction(): ConciergeAction {
  return {
    type: "link",
    label: siteConfig.messaging.ctaPrimary,
    href: routes.angebot,
  };
}

export function phoneAction(): ConciergeAction {
  return {
    type: "phone",
    label: siteConfig.contact.phoneDisplay,
    href: `tel:${siteConfig.contact.phone}`,
  };
}

export function whatsappActionFromSession(session: ConciergeSession): ConciergeAction {
  return {
    type: "whatsapp",
    label: "WhatsApp mit Kalkulation",
    href: getConciergeWhatsAppUrl(session),
  };
}

export function whatsappAction(text?: string): ConciergeAction {
  const message = text
    ? encodeURIComponent(text)
    : encodeURIComponent("Hallo, ich habe eine Frage zur Fensterreinigung.");
  return {
    type: "whatsapp",
    label: "WhatsApp",
    href: `https://wa.me/${siteConfig.contact.whatsapp}?text=${message}`,
  };
}

export function buildGreeting(): string {
  return `Guten Tag! Ich bin der digitale Assistent von **${siteConfig.name}** – Ihr Ansprechpartner für streifenfreie Fensterreinigung in ${siteConfig.contact.region}.

Ich kann Ihnen sofort helfen bei:
• **Live-Preisschätzung** (basierend auf unserem echten Preisrechner)
• **Leistungen & Einsatzgebiet**
• **Ablauf** – von der Schätzung bis zum verbindlichen Festpreis-Angebot in ${siteConfig.business.responseTime}

Womit darf ich starten?`;
}

export function buildServicesOverview(): string {
  const lines = quoteServices.map(
    (s) => `• **${s.title}** – ${s.description} (${s.priceHint})`
  );
  const extras = siteConfig.services
    .filter((s) => !quoteServices.some((q) => q.id === s.id))
    .map((s) => `• **${s.title}** – ${s.description} (${s.priceFrom})`);

  return `Unsere Leistungen im Überblick:

**Hauptleistungen (Preisrechner):**
${lines.join("\n")}

**Zusätzlich im Wizard wählbar:**
${extras.join("\n")}

Alle Preise werden **live** nach Fensterflügeln, Etage, Verschmutzung und Extras berechnet – transparent und ohne versteckte Kosten.`;
}

export function buildAreaInfo(): string {
  const regions = siteConfig.serviceArea.regions
    .map((r) => `**${r.name}:** ${r.areas.join(", ")}`)
    .join("\n");

  return `${siteConfig.serviceArea.headline}

${siteConfig.serviceArea.description}

${regions}

✓ **${siteConfig.serviceArea.noTravelFeeLabel}** in allen genannten Gebieten – der vereinbarte Festpreis gilt.`;
}

export function buildProcessInfo(): string {
  const steps = siteConfig.process
    .map((s) => `${s.step}. **${s.title}** – ${s.description}`)
    .join("\n");

  return `So einfach funktioniert es bei uns:

${steps}

Die **Live-Preisschätzung** sehen Sie sofort im Wizard. Ihr **verbindliches Festpreis-Angebot** erhalten Sie innerhalb von ${siteConfig.business.responseTime} nach dem Absenden – inkl. PDF-Eingangsbestätigung.`;
}

export function buildFestpreisInfo(): string {
  return `Gerne erkläre ich den Unterschied – das ist wichtig für Ihre Planung:

**1. Live-Preisschätzung (sofort im Wizard)**
• Aktualisiert sich bei jeder Auswahl
• Transparent nach Flügeln, Etage, Extras
• **Unverbindlich** – zur Orientierung

**2. Verbindliches Festpreis-Angebot (nach Ihrer Anfrage)**
• Innerhalb von ${siteConfig.business.responseTime} per E-Mail
• Offizieller, fester Preis für Ihren Auftrag
• Ohne versteckte Kosten

Kurz: Die Schätzung zeigt Ihnen sofort die Richtung – das Festpreis-Angebot ist Ihr verbindlicher Preis.`;
}

export function buildInsuranceInfo(): string {
  return `Ja, wir sind **vollversichert** (Betriebshaftpflichtversicherung). Ihr Eigentum ist bei uns in sicheren Händen – das ist für uns selbstverständlich und Teil unseres Qualitätsversprechens.`;
}

export function buildWinterInfo(): string {
  return `Ja, wir reinigen auch im Winter – bei Temperaturen **über −5 °C** arbeiten wir das ganze Jahr über. Bei Frost planen wir den Termin ggf. auf einen milderen Tag – wir besprechen das transparent mit Ihnen.`;
}

export function buildAppointmentInfo(): string {
  return `Aktuell sind Termine in ${siteConfig.contact.region} verfügbar. Nach Ihrer Anfrage melden wir uns innerhalb von ${siteConfig.business.responseTime} mit Festpreis-Angebot und Terminvorschlag.

Bei **dringenden Terminen** rufen Sie uns direkt an: **${siteConfig.contact.phoneDisplay}** – wir finden eine Lösung.`;
}

export function buildContactInfo(): string {
  return `So erreichen Sie uns:

📞 **Telefon:** ${siteConfig.contact.phoneDisplay}
✉️ **E-Mail:** ${siteConfig.contact.email}
💬 **WhatsApp:** jederzeit schreiben
📍 **Adresse:** ${siteConfig.contact.address}, ${siteConfig.contact.postalCode} ${siteConfig.contact.city}

Am schnellsten zur **Live-Preisschätzung:** unser Preisrechner – in unter 2 Minuten.`;
}

export function buildFluegelGuide(): string {
  return `**So zählen Sie Fensterflügel (Flügel):**

Ein Flügel = ein beweglicher Fensterteil (eine Seite, die sich öffnet).

**Beispiele:**
• Kippfenster mit einem Teil = **1 Flügel**
• Zweiflügeliges Fenster = **2 Flügel**
• Balkontür (Glasfläche) = oft **2 Flügel**
• Dreifach-Fensterbank = **3 Flügel**

**Tipp:** Zählen Sie alle öffnbaren Glasflächen – lieber eine mehr angeben als zu wenig. Im Preisrechner sehen Sie sofort, wie sich die Zahl auf den Preis auswirkt.

Sagen Sie mir z. B.: *„12 Flügel, 2. Stock, Baesweiler"* – dann berechne ich Ihre Live-Preisschätzung.`;
}

export function buildThanks(): string {
  return `Sehr gerne! Wenn Sie noch Fragen haben oder Ihre **Live-Preisschätzung** berechnen möchten – ich bin für Sie da. Schöne Grüße von Ilyashan!`;
}

export function buildUnknown(): string {
  return `Das habe ich nicht ganz verstanden – aber ich helfe Ihnen gern bei allem rund um **Fensterreinigung**:

• Preis berechnen
• Leistungen & Einsatzgebiet
• Ablauf & Festpreis-Angebot

Stellen Sie Ihre Frage oder wählen Sie einen Vorschlag unten.`;
}

export function buildTrustFooter(): string {
  return `\n\n✓ ${siteConfig.serviceArea.noTravelFeeLabel} · ✓ Streifenfrei garantiert · ✓ Vollversichert · ✓ ${siteConfig.business.rating}★ Google`;
}
