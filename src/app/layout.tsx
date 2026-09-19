import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/lib/theme-context";
import { QueryProvider } from "@/lib/query-provider";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/toaster";
import UnregisterServiceWorker from "@/components/unregister-sw";
import { Navigation } from "@/components/navigation";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { Footer } from "@/components/footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AdShrtPro - URL Shortener with Earning Features",
  description: "Shorten URLs and earn money with AdShrtPro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Runs before first paint and before React hydrates, so the `dark` class
          is already on <html>. This prevents both the flash of the wrong theme
          and the hydration mismatch that comes from reading localStorage during
          render (the server has no way to know the user's stored theme).
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={inter.className}>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-30LT9GKSFC"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-30LT9GKSFC');
          `}
        </Script>
        <ClerkProvider>
          <ThemeProvider>
            <QueryProvider>
              <AuthProvider>
                <div className="min-h-screen flex flex-col">
                  <Navigation />
                  <AnnouncementBanner />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
                <Toaster />
                <UnregisterServiceWorker />
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
