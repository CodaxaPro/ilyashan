import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import type { QuoteFormData } from "@/lib/quote-form";
import { QuoteConfirmationDocument } from "@/lib/pdf/quote-confirmation-document";

export async function generateQuotePdfBuffer(data: QuoteFormData, anfrageNr: string) {
  const element = React.createElement(QuoteConfirmationDocument, { data, anfrageNr });
  return renderToBuffer(element as unknown as React.ReactElement<DocumentProps>);
}

export function pdfBufferToBase64(buffer: Buffer) {
  return buffer.toString("base64");
}
