import { Button } from "@/components/ui/Button";

type Props = {
  headline: string;
  text?: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  dark?: boolean;
};

export function ClosingCta({
  headline,
  text,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  dark = false,
}: Props) {
  return (
    <div className={`text-center max-w-2xl mx-auto ${dark ? "text-white" : ""}`}>
      <h2 className={`headline-lg mb-4 ${dark ? "text-white" : ""}`}>{headline}</h2>
      {text && <p className={`mb-8 leading-relaxed ${dark ? "text-white/70" : "text-muted"}`}>{text}</p>}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button href={primaryHref} variant={dark ? "primary" : "secondary"} size="lg">
          {primaryLabel}
        </Button>
        {secondaryHref && secondaryLabel && (
          <Button href={secondaryHref} variant="outline" size="lg" className={dark ? "!border-white/40 !text-white hover:!bg-white hover:!text-primary" : "!border-primary !text-primary hover:!bg-primary hover:!text-white"}>
            {secondaryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
