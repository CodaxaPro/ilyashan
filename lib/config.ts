export const siteConfig = {
  name: "Ilyashan Fensterreinigung",
  tagline: "Professionelle Fensterreinigung",
  description:
    "Streifenfreie Fensterreinigung für Privat- und Gewerbekunden in Baesweiler, Aachen und Umgebung. Kein Anfahrtszuschlag, kostenloses Angebot, versichert und zuverlässig.",
  url: "https://ilyashan.de/de",
  locale: "de-DE",

  contact: {
    phone: "+49 173 3828354",
    phoneDisplay: "0173 3828354",
    email: "info@ilyashan.de",
    whatsapp: "491733828354",
    address: "Kückstr. 29",
    city: "Baesweiler",
    postalCode: "52499",
    region: "Baesweiler, Aachen & Umgebung",
  },

  serviceArea: {
    title: "Einsatzgebiet",
    headline: "Baesweiler, Aachen & alle Stadtteile – ohne Anfahrtszuschlag",
    description:
      "Wir sind in Baesweiler ansässig und reinigen Fenster in der gesamten Region Aachen. In allen aufgeführten Gebieten berechnen wir keinen Anfahrtszuschlag – der Festpreis gilt.",
    noTravelFeeLabel: "Kein Anfahrtszuschlag",
    regions: [
      {
        name: "Stammgebiet",
        areas: ["Baesweiler", "Übach-Palenberg", "Alsdorf", "Würselen"],
      },
      {
        name: "Aachen Stadtteile",
        areas: [
          "Aachen-Mitte",
          "Brand",
          "Haaren",
          "Laurensberg",
          "Richterich",
          "Kornelimünster",
          "Walheim",
          "Eilendorf",
          "Forst",
        ],
      },
      {
        name: "Weitere Umgebung",
        areas: ["Herzogenrath", "Eschweiler", "Stolberg", "Roetgen"],
      },
    ],
  },

  business: {
    founded: "2020",
    customers: "500+",
    rating: 4.9,
    reviews: 9,
    responseTime: "24 Stunden",
  },

  services: [
    {
      id: "privat",
      title: "Privatfenster",
      description:
        "Kleine Wohnung (ca. 8 Fenster, einseitig). Streifenfreie Reinigung für Wohnungen, Häuser und Balkone.",
      priceFrom: "ab 49 €",
      icon: "home",
    },
    {
      id: "gewerbe",
      title: "Gewerbefenster",
      description:
        "Büro, Praxis oder Laden – Preis nach Fensteranzahl und Fläche. Flexible Termine, auch außerhalb der Öffnungszeiten.",
      priceFrom: "auf Anfrage",
      icon: "building",
    },
    {
      id: "rahmen",
      title: "Rahmen & Falz",
      description:
        "Wohnung beidseitig inkl. Rahmen, Falz und Fensterbank (ca. 10–12 Fenster). Komplettpaket für ein perfektes Ergebnis.",
      priceFrom: "ab 79 €",
      icon: "frame",
    },
    {
      id: "solar",
      title: "Solaranlagen",
      description:
        "Kleine PV-Anlage bis ca. 15 Module. Professionelle Reinigung für maximale Energieausbeute.",
      priceFrom: "ab 99 €",
      icon: "sun",
    },
    {
      id: "fassade",
      title: "Glasfassaden",
      description:
        "Hochhaus- und Fassadenreinigung – Preis nach Aufmaß, Zugänglichkeit und Fläche.",
      priceFrom: "auf Anfrage",
      icon: "glass",
    },
    {
      id: "wartung",
      title: "Wartungsvertrag",
      description:
        "Regelmäßige Fensterreinigung zum Festpreis. Ideal für Büros, Praxen und Mehrfamilienhäuser.",
      priceFrom: "ab 59 €/Monat",
      icon: "calendar",
    },
  ],

  usps: [
    {
      title: "Streifenfrei garantiert",
      description: "Professionelle Technik für kristallklare Ergebnisse – jedes Mal.",
    },
    {
      title: "Vollversichert",
      description: "Betriebshaftpflichtversicherung für Ihre Sicherheit und unser Vertrauen.",
    },
    {
      title: "Festpreis-Angebot",
      description: "Transparente Preise ohne versteckte Kosten. Kostenloses Angebot in 24h.",
    },
    {
      title: "Pünktlich & zuverlässig",
      description: "Termintreue ist unser Versprechen. Über 500 zufriedene Kunden.",
    },
  ],

  process: [
    {
      step: 1,
      title: "Anfrage stellen",
      description: "Formular ausfüllen oder anrufen – wir melden uns innerhalb von 24 Stunden.",
    },
    {
      step: 2,
      title: "Kostenloses Angebot",
      description: "Wir erstellen ein transparentes Festpreis-Angebot – unverbindlich und klar.",
    },
    {
      step: 3,
      title: "Perfekte Reinigung",
      description: "Unser Team reinigt pünktlich, professionell und hinterlässt streifenfreie Fenster.",
    },
  ],

  testimonials: [
    {
      id: "cengiz-aydin",
      name: "Cengiz Aydin",
      initial: "C",
      avatarColor: "orange",
      localGuide: true,
      rating: 5,
      timeAgo: "vor 1 Jahr",
      text: "Er macht seine Arbeit so gut, dass man denkt, das Haus gehört ihm. Obwohl es nicht im Vertrag steht, macht er die Tür sauber. Ich rufe ihn an, er geht sofort dran. Die Produkte, die er benutzt, habe ich gesehen, die sind richtige Profiprodukte.",
    },
    {
      id: "markos-damigos",
      name: "Markos Damigos",
      initial: "M",
      avatarColor: "blue",
      reviewerReviews: 3,
      rating: 5,
      timeAgo: "vor 2 Jahren",
      text: "Alles perfekt – pünktlich, freundlich, professionell, gründlich. Das gesamte Paket 1+.",
    },
    {
      id: "k-o",
      name: "K O",
      initial: "K",
      avatarColor: "gray",
      reviewerReviews: 10,
      rating: 5,
      timeAgo: "vor 3 Jahren",
      text: "Sehr freundlich und flexibel! Haben bei uns die Bauendreinigung gemacht und alles schön sauber hinterlassen.",
    },
    {
      id: "hermann-josef",
      name: "Hermann-Josef Krautzberger",
      initial: "H",
      avatarColor: "gray",
      reviewerReviews: 2,
      rating: 5,
      timeAgo: "vor 5 Jahren",
      text: "Dieses Unternehmen ist nur zu empfehlen. Werde diesen Service wieder in Anspruch nehmen.",
    },
    {
      id: "dirck-ley",
      name: "Dirck Ley",
      initial: "D",
      avatarColor: "gray",
      reviewerReviews: 2,
      rating: 5,
      timeAgo: "vor 3 Jahren",
      text: "Sehr gut, immer pünktlich, sehr freundlich.",
    },
    {
      id: "niemann-consulta",
      name: "Niemann Consulta",
      initial: "N",
      avatarColor: "teal",
      reviewerReviews: 5,
      rating: 5,
      timeAgo: "vor 3 Jahren",
      text: "Zuverlässiges Unternehmen. Bester Service. Empfehlenswert!",
    },
    {
      id: "igi-r",
      name: "Igi R",
      initial: "I",
      avatarColor: "purple",
      reviewerReviews: 8,
      rating: 5,
      timeAgo: "vor 5 Jahren",
      text: "Super Service und Leistung – sehr empfehlenswert.",
    },
    {
      id: "yasin-karakuzu",
      name: "Yasin Karakuzu",
      initial: "Y",
      avatarColor: "brown",
      reviewerReviews: 3,
      rating: 5,
      timeAgo: "vor 4 Jahren",
      text: "Alles super gelaufen. Dankeschön.",
    },
    {
      id: "xxlittle-cakexx",
      name: "xxlittle cakexx",
      initial: "X",
      avatarColor: "blue",
      localGuide: true,
      rating: 4,
      timeAgo: "vor 2 Jahren",
      text: "Sehr freundlich und gute Arbeit. Die Kommunikation gestaltete sich etwas schwierig und es wurde zeitlich leider etwas knapp vor Öffnung. Dennoch würde ich diesen Service wieder in Anspruch nehmen.",
    },
  ],

  faq: [
    {
      question: "Was kostet eine Fensterreinigung?",
      answer:
        "Die Kosten hängen von Fensteranzahl, Größe, Zugänglichkeit und Reinigungsumfang ab. Orientierung für Baesweiler & Aachen: kleine Wohnung (ca. 8 Fenster, einseitig) ab 49 €, Wohnung beidseitig inkl. Rahmen ab 79 €, Einfamilienhaus ab 99 €. Pro Fenster liegt der Marktpreis bei ca. 2,50–5 €. Wir erstellen Ihnen ein kostenloses, unverbindliches Festpreis-Angebot – ohne versteckte Kosten.",
    },
    {
      question: "Wie schnell bekomme ich ein Angebot?",
      answer:
        "In der Regel innerhalb von 24 Stunden nach Ihrer Anfrage. Bei dringenden Terminen rufen Sie uns direkt an.",
    },
    {
      question: "Sind Sie versichert?",
      answer:
        "Ja, wir verfügen über eine umfassende Betriebshaftpflichtversicherung. Ihr Eigentum ist bei uns in sicheren Händen.",
    },
    {
      question: "Reinigen Sie auch im Winter?",
      answer:
        "Ja, bei Temperaturen über -5 °C führen wir Fensterreinigungen das ganze Jahr über durch.",
    },
    {
      question: "Muss ich beim Termin anwesend sein?",
      answer:
        "Nicht zwingend. Viele Kunden hinterlassen einen Schlüssel oder sind nur kurz anwesend. Wir besprechen das individuell.",
    },
    {
      question: "Fallen Anfahrtskosten für Aachen an?",
      answer:
        "Nein. Für alle aufgeführten Gebiete in Baesweiler, Aachen (alle Stadtteile) und der weiteren Umgebung berechnen wir keinen Anfahrtszuschlag. Der vereinbarte Festpreis gilt – ohne versteckte Kosten.",
    },
    {
      question: "Welche Zahlungsmethoden akzeptieren Sie?",
      answer:
        "Barzahlung, Überweisung und EC-Karte. Für Gewerbekunden bieten wir auch Rechnungsstellung mit Zahlungsziel.",
    },
  ],

  googleAds: {
  // Google Ads Conversion ID hier eintragen:
  // conversionId: "AW-XXXXXXXXX",
  // conversionLabel: "XXXXXXXXX",
  },
} as const;

export type Testimonial = {
  id: string;
  name: string;
  initial: string;
  avatarColor: string;
  rating: number;
  timeAgo: string;
  text: string;
  localGuide?: boolean;
  reviewerReviews?: number;
};
