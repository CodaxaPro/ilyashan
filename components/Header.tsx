"use client";

import { siteConfig } from "@/lib/config";
import { Button, PhoneIcon } from "@/components/ui/Button";
import { isHomePath, routes } from "@/lib/routes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "#einsatzgebiet", label: "Einsatzgebiet", isPage: false },
  { href: "#leistungen", label: "Leistungen", isPage: false },
  { href: "#vorteile", label: "Vorteile", isPage: false },
  { href: "#ablauf", label: "Ablauf", isPage: false },
  { href: "#bewertungen", label: "Bewertungen", isPage: false },
  { href: "#faq", label: "FAQ", isPage: false },
  { href: routes.angebot, label: siteConfig.messaging.navAngebot, isPage: true },
];

export function Header() {
  const pathname = usePathname();
  const isHome = isHomePath(pathname);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const solid = !isHome || scrolled;
  const showSolid = solid || menuOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        showSolid
          ? "bg-white/95 backdrop-blur-md shadow-md py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href={routes.home} className="flex items-center gap-2 group">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-colors ${
                showSolid
                  ? "bg-primary text-white"
                  : "bg-white/20 text-white backdrop-blur"
              }`}
            >
              I
            </div>
            <div>
              <span
                className={`font-bold text-lg leading-tight block ${
                  showSolid ? "text-foreground" : "text-white"
                }`}
              >
                {siteConfig.name}
              </span>
              <span
                className={`text-xs ${
                  showSolid ? "text-muted" : "text-white/80"
                }`}
              >
                {siteConfig.contact.region}
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) =>
              link.isPage ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    showSolid ? "text-foreground/80" : "text-white/90"
                  }`}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={isHome ? link.href : `${routes.home}${link.href}`}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    showSolid ? "text-foreground/80" : "text-white/90"
                  }`}
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <a
              href={`tel:${siteConfig.contact.phone}`}
              className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
                showSolid ? "text-primary" : "text-white"
              }`}
            >
              <PhoneIcon className="w-4 h-4" />
              {siteConfig.contact.phoneDisplay}
            </a>
            <Button href={routes.angebot} variant="primary" size="sm">
              {siteConfig.messaging.ctaPrimary}
            </Button>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`lg:hidden p-2 rounded-lg ${
              showSolid ? "text-foreground" : "text-white"
            }`}
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
            className={`lg:hidden mt-4 pb-4 pt-4 space-y-3 ${
              showSolid ? "border-t border-border" : "border-t border-white/20"
            }`}
          >
            {navLinks.map((link) =>
              link.isPage ? (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block text-sm font-medium py-2 ${
                    showSolid ? "text-foreground" : "text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={isHome ? link.href : `${routes.home}${link.href}`}
                  onClick={() => setMenuOpen(false)}
                  className={`block text-sm font-medium py-2 ${
                    showSolid ? "text-foreground" : "text-white"
                  }`}
                >
                  {link.label}
                </a>
              )
            )}
            <a
              href={`tel:${siteConfig.contact.phone}`}
              className={`flex items-center gap-2 text-sm font-semibold py-2 ${
                showSolid ? "text-primary" : "text-white"
              }`}
            >
              <PhoneIcon className="w-4 h-4" />
              {siteConfig.contact.phoneDisplay}
            </a>
            <Button href={routes.angebot} variant="primary" size="md" className="w-full">
              {siteConfig.messaging.ctaPrimary}
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
