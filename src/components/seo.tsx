"use client";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
}

const defaultTitle = "AdShrtPro - Professional URL Shortener";
const defaultDescription = "Shorten, track, and optimize your links with powerful analytics, QR code generation, and earn rewards. Free URL shortener with advanced features.";

export function SEO({
  title,
  description = defaultDescription,
}: SEOProps) {
  // In Next.js App Router, SEO is handled via metadata export in layout/page
  // This component is kept for compatibility but does nothing in App Router
  // Use generateMetadata or metadata export instead
  return null;
}
