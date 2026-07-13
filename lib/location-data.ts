import type { LocationSlug } from "./seo-config";

export type LocationMeta = {
  slug: LocationSlug;
  city: string;
  region: string;
  distance: string;
  nearby: string[];
  localQuote?: { text: string; name: string; location: string };
};

export const LOCATION_META: Record<LocationSlug, LocationMeta> = {
  baesweiler: {
    slug: "baesweiler",
    city: "Baesweiler",
    region: "Kreis Heinsberg · Städteregion Aachen",
    distance: "Kückstr. 29 — ansässig in Baesweiler",
    nearby: ["Aachen", "Übach-Palenberg", "Alsdorf", "Würselen", "Herzogenrath", "Eschweiler"],
    localQuote: {
      text: "Er macht seine Arbeit so gut, dass man denkt, das Haus gehört ihm.",
      name: "Cengiz A.",
      location: "Baesweiler",
    },
  },
  aachen: {
    slug: "aachen",
    city: "Aachen",
    region: "Städteregion Aachen",
    distance: "ca. 15 Min. von Aachen-Mitte",
    nearby: ["Brand", "Haaren", "Laurensberg", "Kornelimünster", "Baesweiler", "Würselen"],
    localQuote: {
      text: "Alles perfekt – pünktlich, freundlich, professionell, gründlich.",
      name: "Markos D.",
      location: "Aachen",
    },
  },
  wurselen: {
    slug: "wurselen",
    city: "Würselen",
    region: "Städteregion Aachen",
    distance: "ca. 10 Min. von Würselen",
    nearby: ["Aachen", "Baesweiler", "Alsdorf", "Herzogenrath", "Eschweiler"],
    localQuote: {
      text: "Sehr freundlich und flexibel! Alles schön sauber hinterlassen.",
      name: "K O",
      location: "Würselen",
    },
  },
  alsdorf: {
    slug: "alsdorf",
    city: "Alsdorf",
    region: "Städteregion Aachen",
    distance: "ca. 12 Min. von Alsdorf",
    nearby: ["Würselen", "Baesweiler", "Eschweiler", "Aachen", "Stolberg"],
    localQuote: {
      text: "Dieses Unternehmen ist nur zu empfehlen.",
      name: "Hermann-Josef K.",
      location: "Alsdorf",
    },
  },
  "ubach-palenberg": {
    slug: "ubach-palenberg",
    city: "Übach-Palenberg",
    region: "Kreis Heinsberg · Städteregion Aachen",
    distance: "ca. 18 Min. von Übach-Palenberg",
    nearby: ["Baesweiler", "Geilenkirchen", "Alsdorf", "Herzogenrath", "Aachen"],
    localQuote: {
      text: "Sehr gut, immer pünktlich, sehr freundlich.",
      name: "Dirck L.",
      location: "Übach-Palenberg",
    },
  },
  herzogenrath: {
    slug: "herzogenrath",
    city: "Herzogenrath",
    region: "Städteregion Aachen",
    distance: "ca. 15 Min. von Herzogenrath",
    nearby: ["Aachen", "Alsdorf", "Würselen", "Baesweiler", "Eschweiler"],
    localQuote: {
      text: "Zuverlässiges Unternehmen. Bester Service. Empfehlenswert!",
      name: "Niemann Consulta",
      location: "Herzogenrath",
    },
  },
  eschweiler: {
    slug: "eschweiler",
    city: "Eschweiler",
    region: "Städteregion Aachen",
    distance: "ca. 12 Min. von Eschweiler",
    nearby: ["Aachen", "Stolberg", "Alsdorf", "Würselen", "Baesweiler"],
    localQuote: {
      text: "Super Service und Leistung – sehr empfehlenswert.",
      name: "Igi R",
      location: "Eschweiler",
    },
  },
  stolberg: {
    slug: "stolberg",
    city: "Stolberg",
    region: "Städteregion Aachen",
    distance: "ca. 15 Min. von Stolberg",
    nearby: ["Aachen", "Eschweiler", "Alsdorf", "Würselen", "Baesweiler"],
    localQuote: {
      text: "Alles super gelaufen. Dankeschön.",
      name: "Yasin K.",
      location: "Stolberg",
    },
  },
  roetgen: {
    slug: "roetgen",
    city: "Roetgen",
    region: "Städteregion Aachen",
    distance: "ca. 20 Min. von Roetgen",
    nearby: ["Aachen", "Stolberg", "Eschweiler", "Baesweiler", "Kornelimünster"],
    localQuote: {
      text: "Sehr freundlich und gute Arbeit.",
      name: "xxlittle cakexx",
      location: "Roetgen",
    },
  },
  kornelimuenster: {
    slug: "kornelimuenster",
    city: "Kornelimünster",
    region: "Aachen Stadtteil · Städteregion Aachen",
    distance: "ca. 18 Min. von Kornelimünster",
    nearby: ["Aachen", "Roetgen", "Stolberg", "Baesweiler", "Eschweiler"],
    localQuote: {
      text: "Professionell, gründlich und zuverlässig.",
      name: "Markos D.",
      location: "Kornelimünster",
    },
  },
};

export function getLocationMeta(slug: LocationSlug): LocationMeta {
  return LOCATION_META[slug];
}

export function getAllLocationMeta(): LocationMeta[] {
  return Object.values(LOCATION_META);
}
