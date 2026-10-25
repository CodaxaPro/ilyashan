"use client";

import { BrandLogo } from "@/components/BrandLogo";
import { siteConfig } from "@/lib/config";
import { Button, PhoneIcon } from "@/components/ui/Button";
import Link from "next/link";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/de#leistungen", label: "Leistungen" },
  { href: "/de#einsatzgebiet", label: "Einsatzgebiet" },
  { href: "/de#kontakt", label: "Kontakt" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background py-3"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <BrandLogo size="header" />

          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <a
              href={`tel:${siteConfig.contact.phone}`}
              data-analytics-id="header-phone"
              className="flex items-center gap-2 text-sm font-semibold text-primary"
            >
              <PhoneIcon className="w-4 h-4" />
              {siteConfig.contact.phoneDisplay}
            </a>
            <Button href="/de#kontakt" variant="primary" size="sm" data-analytics-id="header-cta-anfrage">
              Anfrage
            </Button>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 text-foreground"
            aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
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
          <nav
            className="lg:hidden mt-4 space-y-3 border-t border-border pb-4 pt-4"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm font-medium text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={`tel:${siteConfig.contact.phone}`}
              data-analytics-id="header-phone"
              className="flex items-center gap-2 py-2 text-sm font-semibold text-primary"
            >
              <PhoneIcon className="w-4 h-4" />
              {siteConfig.contact.phoneDisplay}
            </a>
            <Button href="/de#kontakt" variant="primary" size="md" className="w-full">
              Anfrage
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
