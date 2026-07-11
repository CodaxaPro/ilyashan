export type PageFromType = "external" | "internal" | "direct";

export interface PageviewContext {
  referrer: string;
  referrerDomain: string;
  pageUrl: string;
  fromUrl: string;
  fromPath: string;
  fromType: PageFromType;
  fbclid: string;
  gclid: string;
}

export function parseReferrerDomain(referrer: string): string {
  if (!referrer) return "";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isSameOriginReferrer(referrer: string, origin: string): boolean {
  if (!referrer || !origin) return false;
  try {
    return new URL(referrer).origin === origin;
  } catch {
    return false;
  }
}

function readQueryParam(href: string, key: string): string {
  try {
    return new URL(href).searchParams.get(key) ?? "";
  } catch {
    return "";
  }
}

export function resolvePageviewContext(input: {
  documentReferrer: string;
  pageHref: string;
  pagePathWithSearch: string;
  previousPathWithSearch: string;
  origin: string;
}): PageviewContext {
  const referrer = input.documentReferrer.trim();
  const referrerDomain = parseReferrerDomain(referrer);
  const pageUrl = input.pageHref;
  const fbclid = readQueryParam(pageUrl, "fbclid");
  const gclid = readQueryParam(pageUrl, "gclid");

  const previous = input.previousPathWithSearch.trim();
  const current = input.pagePathWithSearch.trim();
  const hasInternalPrevious = Boolean(previous && previous !== current);

  if (hasInternalPrevious) {
    let fromUrl = previous;
    try {
      fromUrl = new URL(previous, input.origin).href;
    } catch {
      /* keep path */
    }
    return {
      referrer,
      referrerDomain,
      pageUrl,
      fromUrl,
      fromPath: previous,
      fromType: "internal",
      fbclid,
      gclid,
    };
  }

  if (referrer && !isSameOriginReferrer(referrer, input.origin)) {
    return {
      referrer,
      referrerDomain,
      pageUrl,
      fromUrl: referrer,
      fromPath: "",
      fromType: "external",
      fbclid,
      gclid,
    };
  }

  return {
    referrer,
    referrerDomain,
    pageUrl,
    fromUrl: "",
    fromPath: "",
    fromType: "direct",
    fbclid,
    gclid,
  };
}

export function formatFromLabel(context: Pick<PageviewContext, "fromUrl" | "fromPath" | "fromType" | "referrer">): string {
  if (context.fromType === "internal" && context.fromPath) {
    return context.fromPath;
  }
  if (context.fromUrl) return context.fromUrl;
  if (context.referrer) return context.referrer;
  return "Doğrudan";
}
