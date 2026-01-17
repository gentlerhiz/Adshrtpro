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
  cpagrip: {
    name: "CPAGrip",
    description: "Complete surveys and offers to earn rewards",
    color: "bg-blue-500",
  },
  adbluemedia: {
    name: "AdBlueMedia",
    description: "High-paying offers and downloads",
    color: "bg-purple-500",
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

function OfferwallOffers({ userId, network }: { userId: string; network: "cpagrip" | "adbluemedia" }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/offerwalls/${network}/offers?userId=${userId}`);
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
                  {parseFloat(offerPayout).toFixed(2)}
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
        <Link href="/login">
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
        <Tabs defaultValue="cpagrip" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
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
                    
                    {(key === "cpagrip" || key === "adbluemedia") && (
                      <OfferwallOffers userId={user.id} network={key as "cpagrip" | "adbluemedia"} />
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
