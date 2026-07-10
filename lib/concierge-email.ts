import { siteConfig } from "@/lib/config";
import { buildDataTable, buildEmailLayout, buildInfoBox, escapeHtml } from "@/lib/email-templates";
import type { ConciergeSession } from "@/lib/concierge/types";
import { buildLeadSummaryRows, isHotLead } from "@/lib/concierge/lead";

export function buildConciergeLeadAdminEmail(
  session: ConciergeSession,
  name: string,
  phone: string,
  photoCount = 0
) {
  const timestamp = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
  const hot = isHotLead(session);
  const rows = buildLeadSummaryRows(session);

  const body = `
    ${buildInfoBox(
      `<strong>${hot ? "🔥 Heiße Anfrage" : "Neue Anfrage"}</strong> über Website-Assistent · ${escapeHtml(timestamp)}`
    )}
    ${buildDataTable([
      ["Name", name],
      ["Telefon", phone],
      ...(photoCount > 0 ? ([["Fotos", `${photoCount} im Anhang`]] as [string, string][]) : []),
      ...rows,
    ])}
    <p style="margin:16px 0 0;font-size:13px;color:#64748b;">
      <a href="tel:${escapeHtml(phone.replace(/\s/g, ""))}" style="color:#0369a1;font-weight:600;">Direkt anrufen</a>
      ·
      <a href="https://wa.me/${siteConfig.contact.whatsapp}" style="color:#059669;font-weight:600;">WhatsApp</a>
    </p>`;

  const text = [
    "NEUE CONCIERGE-ANFRAGE – ilyashan.de",
    hot ? "(Heiße Anfrage mit Preisschätzung)" : "",
    "",
    `Name: ${name}`,
    `Telefon: ${phone}`,
    ...(photoCount > 0 ? [`Fotos: ${photoCount}`] : []),
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    `Eingegangen: ${timestamp}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `${hot ? "🔥 " : ""}Assistent-Rückruf: ${name} (${phone})`,
    text,
    html: buildEmailLayout({
      preheader: `Rückruf-Anfrage von ${name}`,
      title: "Neue Assistent-Anfrage",
      subtitle: hot ? "Mit Live-Preisschätzung" : "Rückruf gewünscht",
      body,
    }),
  };
}
