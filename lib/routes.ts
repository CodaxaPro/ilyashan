export const routes = {
  home: "/de",
  angebot: "/de/angebot",
  bueroreinigung: "/de/bueroreinigung",
  bueroreinigungAngebot: "/de/bueroreinigung/angebot",
  impressum: "/de/impressum",
  datenschutz: "/de/datenschutz",
} as const;

export function isHomePath(pathname: string) {
  return pathname === "/" || pathname === "/de";
}
