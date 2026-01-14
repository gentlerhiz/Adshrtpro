import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Link } from "wouter";
import { useEffect, useRef } from "react";

const OFFERWALL_CONFIG = {
  cpagrip: {
    name: "CPAGrip",
    description: "Complete surveys and offers to earn rewards",
    color: "bg-blue-500",
    getUrl: (userId: string) => `https://www.cpagrip.com/common/offer_feed_json.php?user_id=621093&key=35b59eb1af2454f46fe63ad7d34f923b&tracking_id=${userId}&domain=singingfiles.com`,
    hasEmbed: true,
  },
  adbluemedia: {
    name: "AdBlueMedia",
    description: "High-paying offers and downloads",
    color: "bg-purple-500",
    getUrl: (userId: string) => `https://d2xohqmdyl2cj3.cloudfront.net/public/offers/feed.php?user_id=518705&api_key=f24063d0d801e4daa846e9da4454c467&s1=${userId}&s2=`,
    hasEmbed: false,
  },
};

function CPAGripEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const script1 = document.createElement("script");
    script1.type = "text/javascript";
    script1.textContent = "var lck = false;";
    containerRef.current.appendChild(script1);

    const script2 = document.createElement("script");
    script2.type = "text/javascript";
    script2.src = "https://singingfiles.com/script_include.php?id=1801017";
    script2.async = true;
    containerRef.current.appendChild(script2);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div className="min-h-[400px] bg-card rounded-lg border p-4">
      <div ref={containerRef} className="offerwall-container" />
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
                    
                    {key === "cpagrip" && config.hasEmbed ? (
                      <CPAGripEmbed />
                    ) : (
                      <a 
                        href={config.getUrl(user.id)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Button className="w-full" data-testid={`button-offerwall-${key}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Offers
                        </Button>
                      </a>
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
