import { siteConfig } from "@/lib/config";

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface EmailLayoutOptions {
  preheader: string;
  title: string;
  subtitle?: string;
  body: string;
}

export function buildEmailLayout({ preheader, title, subtitle, body }: EmailLayoutOptions) {
  const { contact, name, url } = siteConfig;
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f6;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#eef2f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0369a1 0%,#0284c7 100%);border-radius:16px 16px 0 0;padding:28px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td width="48" style="vertical-align:middle;">
                    <div style="width:44px;height:44px;background:rgba(255,255,255,0.15);border-radius:12px;text-align:center;line-height:44px;font-size:20px;font-weight:700;color:#ffffff;">I</div>
                  </td>
                  <td style="padding-left:14px;vertical-align:middle;">
                    <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;line-height:1.2;">${escapeHtml(name)}</p>
                    <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.85);">${escapeHtml(siteConfig.tagline)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title bar -->
          <tr>
            <td style="background:#ffffff;padding:28px 36px 8px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">${escapeHtml(title)}</h1>
              ${subtitle ? `<p style="margin:8px 0 0;font-size:14px;color:#64748b;line-height:1.5;">${escapeHtml(subtitle)}</p>` : ""}
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:8px 36px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:24px 36px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0f172a;">${escapeHtml(name)}</p>
              <p style="margin:0 0 4px;font-size:12px;color:#64748b;line-height:1.6;">
                ${escapeHtml(contact.address)}<br>
                ${escapeHtml(contact.postalCode)} ${escapeHtml(contact.city)}
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#64748b;line-height:1.6;">
                Tel: <a href="tel:${contact.phone}" style="color:#0369a1;text-decoration:none;">${escapeHtml(contact.phoneDisplay)}</a><br>
                E-Mail: <a href="mailto:${contact.email}" style="color:#0369a1;text-decoration:none;">${escapeHtml(contact.email)}</a><br>
                Web: <a href="${url}" style="color:#0369a1;text-decoration:none;">ilyashan.de</a>
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:16px;padding-top:16px;border-top:1px solid #e2e8f0;">
                <tr>
                  <td style="font-size:11px;color:#94a3b8;line-height:1.6;">
                    &copy; ${year} ${escapeHtml(name)}. Alle Rechte vorbehalten.<br>
                    <a href="${url}/impressum" style="color:#94a3b8;">Impressum</a>
                    &nbsp;&middot;&nbsp;
                    <a href="${url}/datenschutz" style="color:#94a3b8;">Datenschutz</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildDataTable(rows: [string, string][]) {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:16px 0;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    ${rows
      .map(
        ([label, value], i) => `
    <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f8fafc"};">
      <td style="padding:14px 18px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.4px;width:38%;vertical-align:top;border-bottom:1px solid #e2e8f0;">${escapeHtml(label)}</td>
      <td style="padding:14px 18px;font-size:15px;font-weight:600;color:#0f172a;vertical-align:top;border-bottom:1px solid #e2e8f0;">${escapeHtml(value)}</td>
    </tr>`
      )
      .join("")}
  </table>`;
}

export function buildButton(href: string, label: string, color: string) {
  return `<a href="${href}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:10px;font-size:14px;font-weight:600;margin:4px 8px 4px 0;">${escapeHtml(label)}</a>`;
}

export function buildInfoBox(text: string) {
  return `<div style="background:#eff6ff;border-left:4px solid #0369a1;border-radius:0 10px 10px 0;padding:16px 20px;margin:20px 0;">
    <p style="margin:0;font-size:14px;color:#1e40af;line-height:1.6;">${text}</p>
  </div>`;
}
