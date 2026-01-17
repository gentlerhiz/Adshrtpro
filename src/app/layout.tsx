import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
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
      <body className={inter.className}>
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
      </body>
    </html>
  );
}
