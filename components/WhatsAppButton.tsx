"use client";

import { buildWhatsAppUrl } from "@/lib/contact-channels";
import { WhatsAppIcon } from "@/components/ui/Button";

/** Floating WhatsApp — kanal tanınırlığı için marka-teal; header CTAs marka rengi kullanır. */
export function WhatsAppButton() {
  return (
    <a
      href={buildWhatsAppUrl()}
      target="_blank"
      rel="noopener noreferrer"
      data-analytics-id="floating-whatsapp"
      className="fixed z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#128C7E] text-white bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-[max(1.5rem,env(safe-area-inset-right))] hover:bg-[#0E6E63]"
      aria-label="WhatsApp Kontakt"
    >
      <WhatsAppIcon className="w-7 h-7" />
    </a>
  );
}
