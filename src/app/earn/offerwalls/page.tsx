"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, AlertCircle, DollarSign, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useEffect, useState } from "react";

const OFFERWALL_CONFIG = {
  adbluemedia: {
    name: "AdBlueMedia",
    description: "High-paying offers and downloads",
    color: "bg-purple-500",
    type: "api" as const,
  },
  bitcotasks: {
    name: "BitcoTasks",
    description: "Offers, surveys and tasks with instant rewards",
    color: "bg-amber-500",
    type: "newtab" as const,
  },
};

interface Offer {
  id: string;
  offerid?: string;
  name: string;
  title?: string;
  anchor?: string;
  description?: string;
  conversion?: string;
  payout: string;
  amount?: string;
  url: string;
  link?: string;
  network_icon?: string;
  image?: string;
}

function OfferwallOffers({ userId, network }: { userId: string; network: "adbluemedia" }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/offerwalls/${network}/offers?userId=${userId}`, {
          credentials: "include", // Send Clerk session cookies
        });
        if (!response.ok) throw new Error("Failed to fetch offers");
        const data = await response.json();
        setOffers(data);
      } catch (err) {
        setError("Failed to load offers. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, [userId, network]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {error}
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No offers available at the moment. Please check back later.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {offers.map((offer, index) => {
        const offerId = offer.id || offer.offerid || `offer-${index}`;
        const offerName = offer.name || offer.title || "Offer";
        const offerDesc = offer.anchor || offer.description || offer.conversion || "";
        const offerPayout = offer.payout || offer.amount || "0";
        const offerUrl = offer.url || offer.link || "#";
        const offerImage = offer.network_icon || offer.image;

        return (
          <Card key={offerId} className="hover-elevate">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                {offerImage && (
                  <img src={offerImage} alt="" className="w-12 h-12 rounded object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-2">{offerName}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{offerDesc}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <Badge variant="secondary" className="gap-1">
                  <DollarSign className="h-3 w-3" />
                  {parseFloat(offerPayout).toFixed(6)}
                </Badge>
                <a href={offerUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" data-testid={`button-offer-${offerId}`}>
                    Complete
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Opens the offerwall in a new tab rather than an iframe. BitcoTasks keeps its
// session (and captcha firewall state) in a PHPSESSID cookie; inside an iframe
// that cookie is third-party, which WebKit blocks outright - so the wall loops
// back to the captcha on every iOS browser and on desktop Safari. In its own tab
// the cookie is first-party and works everywhere.
//
// The URL is fetched up front so the tap lands on a real link: iOS blocks
// window.open() when it runs after an await instead of directly in the gesture.
function OfferwallLink({ network, name }: { network: string; name: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/offerwalls/${network}/url`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to load offerwall");
        const data = await response.json();
        setUrl(data.url);
      } catch {
        setUrl(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUrl();
  }, [network]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!url) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        This offerwall is unavailable right now. Please check back later.
      </div>
    );
  }

  // rel="noopener" without "noreferrer" so the offerwall still sees our site as
  // the referrer, the same as the documented window.open() integration.
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <Button asChild size="lg" data-testid={`button-open-offerwall-${network}`}>
        <a href={url} target="_blank" rel="noopener">
          Open {name}
          <ExternalLink className="ml-2 h-4 w-4" />
        </a>
      </Button>
      <p className="text-sm text-muted-foreground max-w-md">
        Opens in a new tab. Keep this tab open &mdash; rewards are credited to your
        balance here once a task is completed.
      </p>
    </div>
  );
}

interface OfferwallSetting {
  network: string;
  isEnabled: boolean;
}

export default function OfferwallsPage() {
  const { user } = useAuth();

  const { data: offerwalls = [], isLoading } = useQuery<OfferwallSetting[]>({
    queryKey: ["/api/offerwalls"],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Offerwalls</h1>
        <p className="text-muted-foreground mb-6">Please log in to access offerwalls.</p>
        <Link href="/sign-in">
          <Button data-testid="button-login">Log In</Button>
        </Link>
      </div>
    );
  }

  const enabledOfferwalls = offerwalls.filter(o => o.isEnabled);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/earn" className="text-primary hover:underline text-sm mb-2 inline-block">
          ← Back to Earn
        </Link>
        <h1 className="text-3xl font-bold mb-2">Offerwalls</h1>
        <p className="text-muted-foreground">Complete offers from our partner networks to earn USD rewards.</p>
      </div>

      <Card className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Important</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Your User ID for postback tracking is: <strong>{user.id}</strong>
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Rewards are automatically credited to your balance after completing an offer.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">Loading offerwalls...</div>
      ) : enabledOfferwalls.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ExternalLink className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Offerwalls Available</h3>
            <p className="text-muted-foreground">
              Offerwalls are currently disabled. Please check back later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs
          defaultValue={
            Object.keys(OFFERWALL_CONFIG).find(key =>
              enabledOfferwalls.some(o => o.network === key)
            )
          }
          className="space-y-6"
        >
          <TabsList className="w-auto">
            {Object.entries(OFFERWALL_CONFIG).map(([key, config]) => {
              const isEnabled = enabledOfferwalls.some(o => o.network === key);
              if (!isEnabled) return null;
              return (
                <TabsTrigger key={key} value={key} data-testid={`tab-offerwall-${key}`}>
                  <div className={`w-2 h-2 rounded-full ${config.color} mr-2`} />
                  {config.name}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(OFFERWALL_CONFIG).map(([key, config]) => {
            const isEnabled = enabledOfferwalls.some(o => o.network === key);
            if (!isEnabled) return null;

            return (
              <TabsContent key={key} value={key} className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <CardTitle className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${config.color}`} />
                        {config.name}
                      </CardTitle>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <CardDescription>{config.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Complete offers from {config.name} to earn USD. Rewards are credited automatically.
                    </p>
                    {config.type === "newtab" ? (
                      <OfferwallLink network={key} name={config.name} />
                    ) : (
                      <OfferwallOffers userId={user.id} network={key as "adbluemedia"} />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Click on an offerwall above to view available offers</li>
            <li>Complete the offer requirements (surveys, app installs, etc.)</li>
            <li>Your reward is automatically credited to your balance</li>
            <li>Withdraw your earnings via FaucetPay once you reach the minimum</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
