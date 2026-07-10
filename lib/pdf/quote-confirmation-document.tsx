import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { siteConfig } from "@/lib/config";
import type { QuoteFormData } from "@/lib/quote-form";
import {
  buildQuoteContactRows,
  buildQuoteTableRows,
  getQuoteContactName,
} from "@/lib/quote-summary";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  header: {
    backgroundColor: "#0369a1",
    padding: 20,
    borderRadius: 8,
    marginBottom: 24,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSub: {
    color: "#e0f2fe",
    fontSize: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0369a1",
    marginBottom: 8,
    marginTop: 16,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 6,
  },
  label: {
    width: "38%",
    color: "#64748b",
    fontSize: 9,
    fontWeight: "bold",
  },
  value: {
    width: "62%",
    fontSize: 10,
    fontWeight: "bold",
  },
  priceBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#eff6ff",
    borderLeftWidth: 4,
    borderLeftColor: "#0369a1",
    borderRadius: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0369a1",
  },
  footer: {
    marginTop: 30,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    fontSize: 8,
    color: "#64748b",
    lineHeight: 1.5,
  },
  badge: {
    marginTop: 12,
    fontSize: 9,
    color: "#059669",
  },
});

interface QuoteConfirmationDocumentProps {
  data: QuoteFormData;
  anfrageNr: string;
}

function DataTable({ rows }: { rows: [string, string][] }) {
  return (
    <View>
      {rows.map(([label, value], i) => (
        <View key={`${label}-${i}`} style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

export function QuoteConfirmationDocument({ data, anfrageNr }: QuoteConfirmationDocumentProps) {
  const name = getQuoteContactName(data);
  const date = new Date().toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" });
  const priceRow = buildQuoteTableRows(data, anfrageNr).find(([k]) => k === "Geschätzter Preis");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{siteConfig.name}</Text>
          <Text style={styles.headerSub}>{siteConfig.tagline} · ilyashan.de</Text>
        </View>

        <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>
          Eingangsbestätigung
        </Text>
        <Text style={{ fontSize: 10, color: "#64748b", marginBottom: 16 }}>
          Anfrage-Nr. {anfrageNr} · {date}
        </Text>

        <Text style={{ fontSize: 11, marginBottom: 12, lineHeight: 1.5 }}>
          Guten Tag {name || "Kunde/in"},{"\n"}
          vielen Dank für Ihre Anfrage. Wir haben Ihre Angaben erhalten und melden uns
          innerhalb von {siteConfig.business.responseTime} mit einem verbindlichen Festpreis-Angebot.
        </Text>

        <Text style={styles.sectionTitle}>Kontakt</Text>
        <DataTable rows={buildQuoteContactRows(data)} />

        <Text style={styles.sectionTitle}>Anfragedetails</Text>
        <DataTable rows={buildQuoteTableRows(data, anfrageNr).filter(([k]) => k !== "Geschätzter Preis")} />

        {priceRow && (
          <View style={styles.priceBox}>
            <Text style={{ fontSize: 9, color: "#64748b", marginBottom: 4 }}>
              Geschätzter Festpreis (unverbindlich)
            </Text>
            <Text style={styles.priceText}>{priceRow[1]}</Text>
          </View>
        )}

        <Text style={styles.badge}>✓ Kein Anfahrtszuschlag · ✓ Streifenfrei garantiert · ✓ Vollversichert</Text>

        <View style={styles.footer}>
          <Text>{siteConfig.name}</Text>
          <Text>
            {siteConfig.contact.address}, {siteConfig.contact.postalCode} {siteConfig.contact.city}
          </Text>
          <Text>
            Tel: {siteConfig.contact.phoneDisplay} · E-Mail: {siteConfig.contact.email} · ilyashan.de
          </Text>
          <Text style={{ marginTop: 8 }}>
            Diese Eingangsbestätigung wurde automatisch erstellt. Der finale Festpreis wird separat mitgeteilt.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
