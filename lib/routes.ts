export const routes = {
  home: "/de",
  angebot: "/de/angebot",
  fensterreinigung: "/de/fensterreinigung",
  bueroreinigung: "/de/bueroreinigung",
  bueroreinigungAngebot: "/de/bueroreinigung/angebot",
  bauendreinigung: "/de/bauendreinigung",
  renovierungsreinigung: "/de/renovierungsreinigung",
  praxisreinigung: "/de/praxisreinigung",
  entruempelung: "/de/entruempelung",
  impressum: "/de/impressum",
  datenschutz: "/de/datenschutz",
} as const;

export function isHomePath(pathname: string) {
  return pathname === "/" || pathname === "/de";
}
