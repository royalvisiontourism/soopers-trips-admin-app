export const WHATSAPP_PHONE = "971525049000";

export function getAdminOrigin() {
  const env =
    (typeof process !== "undefined" &&
      process.env &&
      (process.env.NEXT_PUBLIC_ADMIN_URL ||
        // Backward compat
        process.env.NEXT_PUBLIC_AGENT_PORTAL_URL ||
        process.env.NEXT_PUBLIC_APP_URL)) ||
    "";
  const normalizedEnv = typeof env === "string" ? env.replace(/\/+$/, "") : "";
  if (normalizedEnv) return normalizedEnv;

  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;

  // Dev-friendly fallback (keeps SSR and client consistent if env isn't set)
  return "http://localhost:3002";
}

export function getWebsiteOrigin() {
  const env =
    (typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_WEBSITE_URL) || "";
  const normalizedEnv = typeof env === "string" ? env.replace(/\/+$/, "") : "";
  return normalizedEnv || "";
}

// Backward-compatible alias (older code calls this)
export function getPortalOrigin() {
  return getAdminOrigin();
}

export function buildWhatsAppUrl(message) {
  const text = typeof message === "string" ? message : "";
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
}

export function buildProductWhatsAppMessage({ title, link }) {
  const safeTitle = title ? `Product: ${title}` : "Product inquiry";
  const safeLink = link ? `\n${link}` : "";
  return `Hi, I'm an admin. I need help with:\n${safeTitle}${safeLink}`;
}

