import Image from "next/image";
import Link from "next/link";
import { routes } from "@/lib/routes";

type Props = {
  className?: string;
  /** Header: compact. Footer: slightly larger. */
  size?: "header" | "footer";
};

const sizes = {
  header: { className: "h-14 w-14 sm:h-16 sm:w-16", width: 128, height: 128 },
  footer: { className: "h-20 w-20", width: 160, height: 160 },
} as const;

export function BrandLogo({ className = "", size = "header" }: Props) {
  const dim = sizes[size];
  return (
    <Link href={routes.home} className={`inline-flex shrink-0 ${className}`} aria-label="Ilyashan Startseite">
      <Image
        src="/brand/ilyashan-logo.jpg"
        alt="Ilyashan Gebäudereinigung"
        width={dim.width}
        height={dim.height}
        priority={size === "header"}
        className={`${dim.className} object-contain`}
      />
    </Link>
  );
}
