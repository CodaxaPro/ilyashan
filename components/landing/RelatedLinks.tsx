import Link from "next/link";

import type { RelatedLink } from "@/lib/landing-pages";

type Props = {
  title: string;
  links: RelatedLink[];
};

export function RelatedLinks({ title, links }: Props) {
  if (!links.length) return null;

  return (
    <>
      <div className="text-center mb-10">
        <p className="eyebrow mb-3">Mehr entdecken</p>
        <h2 className="headline-lg">{title}</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block bg-card border border-border rounded-xl p-6 hover:border-primary/40 hover:shadow-md transition-all group"
          >
            <p className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
              {link.label}
            </p>
            <p className="text-sm text-muted">{link.hint}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
