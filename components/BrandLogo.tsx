import Image from "next/image";
import Link from "next/link";
import { routes } from "@/lib/routes";

type Props = {
  className?: string;
  size?: "header" | "footer";
};

const sizes = {
  header: {
    className: "h-9 w-auto sm:h-10",
    width: 360,
    height: 92,
    src: "/brand/header-logo.png",
  },
  footer: {
    className: "h-10 w-auto",
    width: 360,
    height: 92,
    src: "/brand/header-logo.png",
  },
} as const;

export function BrandLogo({ className = "", size = "header" }: Props) {
  const dim = sizes[size];
  return (
    <Link href={routes.home} className={`inline-flex shrink-0 items-center ${className}`} aria-label="Ilyashan Startseite">
      <Image
        src={dim.src}
        alt="Ilyashan Gebäudereinigung"
        width={dim.width}
        height={dim.height}
        priority={size === "header"}
        className={`${dim.className} object-contain object-left`}
      />
    </Link>
  );
}
