import { siteConfig } from "@/lib/config";
import { WhatsAppIcon } from "@/components/ui/Button";

export function WhatsAppButton() {
  const message = encodeURIComponent(
    "Hallo, ich möchte ein Angebot für Fensterreinigung anfordern."
  );

  return (
    <a
      href={`https://wa.me/${siteConfig.contact.whatsapp}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed z-50 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 hover:bg-[#20bd5a] hover:scale-110 transition-all duration-200 pulse-ring bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-[max(1.5rem,env(safe-area-inset-right))]"
      aria-label="WhatsApp Kontakt"
    >
      <WhatsAppIcon className="w-7 h-7" />
    </a>
  );
}
