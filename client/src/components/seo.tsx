import { Helmet } from "react-helmet-async";

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
const defaultKeywords = "URL shortener, link shortener, analytics, QR codes, link management, earn money, referral program";

export function SEO({
  title,
  description = defaultDescription,
  keywords = defaultKeywords,
  ogImage,
  ogType = "website",
  noIndex = false,
}: SEOProps) {
  const fullTitle = title ? `${title} | AdShrtPro` : defaultTitle;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
}
