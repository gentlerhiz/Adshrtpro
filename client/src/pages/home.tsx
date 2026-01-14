import { UrlShortener } from "@/components/url-shortener";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AdDisplay } from "@/components/ad-display";
import {
  Link2,
  BarChart3,
  QrCode,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  CheckCircle,
  Wallet,
  Users,
  Gift,
  Layers,
  DollarSign,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Link as LinkType } from "@shared/schema";
import { SiBitcoin, SiEthereum, SiDogecoin, SiLitecoin } from "react-icons/si";

interface PaymentProof {
  id: string;
  date: string;
  username: string;
  amount: string;
  paymentMethod: string;
}

function getCryptoIcon(coin: string) {
  const upperCoin = coin?.toUpperCase() || "";
  switch (upperCoin) {
    case "BTC":
    case "BITCOIN":
      return <SiBitcoin className="w-4 h-4 text-orange-500" />;
    case "ETH":
    case "ETHEREUM":
      return <SiEthereum className="w-4 h-4 text-blue-500" />;
    case "DOGE":
    case "DOGECOIN":
      return <SiDogecoin className="w-4 h-4 text-yellow-500" />;
    case "LTC":
    case "LITECOIN":
      return <SiLitecoin className="w-4 h-4 text-gray-500" />;
    default:
      return <Wallet className="w-4 h-4 text-green-500" />;
  }
}

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: recentLinks, isLoading } = useQuery<LinkType[]>({
    queryKey: ["/api/links"],
    enabled: !!user,
  });

  const { data: paymentProofs = [] } = useQuery<PaymentProof[]>({
    queryKey: ["/api/public/payment-proofs"],
    refetchInterval: 60000, // Refresh every 60 seconds
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const copyToClipboard = async (shortCode: string, id: string) => {
    const shortUrl = `${window.location.origin}/${shortCode}`;
    await navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard.",
    });
  };

  const features = [
    {
      icon: Link2,
      title: "URL Shortening",
      description: "Create short, memorable links with custom aliases. Supports bulk shortening up to 50 URLs at once.",
    },
    {
      icon: BarChart3,
      title: "Click Analytics",
      description: "Track clicks, countries, devices, browsers, and referrers with detailed insights.",
    },
    {
      icon: QrCode,
      title: "QR Code Generator",
      description: "Generate customizable QR codes with colors for any of your shortened links.",
    },
    {
      icon: DollarSign,
      title: "Earn Rewards",
      description: "Complete offerwalls, tasks, and surveys to earn real money you can withdraw.",
    },
    {
      icon: Users,
      title: "Referral Program",
      description: "Invite friends and earn bonus rewards when they sign up and participate.",
    },
    {
      icon: Wallet,
      title: "Crypto Withdrawals",
      description: "Withdraw your earnings via FaucetPay to Bitcoin, Ethereum, Litecoin, and more.",
    },
    {
      icon: Layers,
      title: "Bulk Import",
      description: "Import and shorten multiple URLs at once to save time on large campaigns.",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with password reset, email verification, and 2FA support.",
    },
    {
      icon: Globe,
      title: "No Expiration",
      description: "Your links stay active forever with no time limits or restrictions.",
    },
  ];

  return (
    <div className="min-h-screen">
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4" data-testid="badge-hero">
            Free URL Shortener
          </Badge>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Shorten Links,{" "}
            <span className="text-primary">Amplify Results</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Create short, powerful links with advanced analytics. Track every click
            and optimize your marketing with data-driven insights.
          </p>

          <UrlShortener />

          {!user && (
            <p className="text-sm text-muted-foreground mt-6">
              <Link href="/register" className="text-primary hover:underline">
                Sign up
              </Link>{" "}
              to manage your links and access full analytics.
            </p>
          )}
        </div>
      </section>

      <AdDisplay placement="header" className="py-4 px-4" />

      {user && recentLinks && recentLinks.length > 0 && (
        <section className="py-12 px-4 bg-card border-y">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-semibold">Recent Links</h2>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" data-testid="link-view-all">
                  View all
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              ) : (
                recentLinks.slice(0, 5).map((link) => (
                  <Card key={link.id} className="hover-elevate">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <a
                            href={`/${link.shortCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline flex items-center gap-1"
                            data-testid={`link-short-${link.id}`}
                          >
                            {window.location.host}/{link.shortCode}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          {link.isDisabled && (
                            <Badge variant="secondary" className="text-xs">
                              Disabled
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {link.originalUrl}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(link.shortCode, link.id)}
                        data-testid={`button-copy-${link.id}`}
                      >
                        {copiedId === link.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Powerful Features
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to manage and track your links effectively.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover-elevate">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="font-heading text-xl">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <AdDisplay placement="footer" className="py-6 px-4" />

      {paymentProofs.length > 0 && (
        <section className="py-12 px-4 bg-card border-y">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <h2 className="font-heading text-2xl font-semibold">Recent Payments</h2>
              </div>
              <p className="text-muted-foreground">Real withdrawals from our users</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {paymentProofs.slice(0, 12).map((proof) => {
                const amount = parseFloat(proof.amount);
                if (isNaN(amount) || amount <= 0 || !proof.date) return null;
                return (
                  <Card key={proof.id} className="bg-background">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            {getCryptoIcon(proof.paymentMethod)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{proof.username}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(proof.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600 dark:text-green-400">
                            ${amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground uppercase">
                            {proof.paymentMethod}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              Payments shown are real user withdrawals. Amounts vary based on activity and offer availability.
            </p>
          </div>
        </section>
      )}

      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Join thousands of users who trust AdShrtPro for their link management needs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                variant="secondary"
                className="font-semibold"
                data-testid="button-cta-signup"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/blog">
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                data-testid="button-cta-blog"
              >
                Read Our Blog
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
