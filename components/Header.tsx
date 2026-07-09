"use client";

import { siteConfig } from "@/lib/config";
import { Button, PhoneIcon } from "@/components/ui/Button";
import { isHomePath, routes } from "@/lib/routes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "#einsatzgebiet", label: "Einsatzgebiet" },
  { href: "#leistungen", label: "Leistungen" },
  { href: "#vorteile", label: "Vorteile" },
  { href: "#ablauf", label: "Ablauf" },
  { href: "#bewertungen", label: "Bewertungen" },
  { href: "#faq", label: "FAQ" },
  { href: "#angebot", label: "Angebot" },
];

export function Header() {
  const pathname = usePathname();
  const isHome = isHomePath(pathname);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const solid = !isHome || scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        solid
          ? "bg-white/95 backdrop-blur-md shadow-md py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href={routes.home} className="flex items-center gap-2 group">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-colors ${
                solid
                  ? "bg-primary text-white"
                  : "bg-white/20 text-white backdrop-blur"
              }`}
            >
              I
            </div>
            <div>
              <span
                className={`font-bold text-lg leading-tight block ${
                  solid ? "text-foreground" : "text-white"
                }`}
              >
                {siteConfig.name}
              </span>
              <span
                className={`text-xs ${
                  solid ? "text-muted" : "text-white/80"
                }`}
              >
                {siteConfig.contact.region}
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  solid ? "text-foreground/80" : "text-white/90"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <a
              href={`tel:${siteConfig.contact.phone}`}
              className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
                solid ? "text-primary" : "text-white"
              }`}
            >
              <PhoneIcon className="w-4 h-4" />
              {siteConfig.contact.phoneDisplay}
            </a>
            <Button href="#angebot" variant="primary" size="sm">
              Angebot anfordern
            </Button>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`lg:hidden p-2 rounded-lg ${
              solid ? "text-foreground" : "text-white"
            }`}
            aria-label="Menü öffnen"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <nav className="lg:hidden mt-4 pb-4 border-t border-white/20 pt-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block text-sm font-medium py-2 ${
                  solid ? "text-foreground" : "text-white"
                }`}
              >
                {link.label}
              </a>
            ))}
            <a
              href={`tel:${siteConfig.contact.phone}`}
              className={`flex items-center gap-2 text-sm font-semibold py-2 ${
                solid ? "text-primary" : "text-white"
              }`}
            >
              <PhoneIcon className="w-4 h-4" />
              {siteConfig.contact.phoneDisplay}
            </a>
            <Button href="#angebot" variant="primary" size="md" className="w-full">
              Angebot anfordern
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
