"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, ExternalLink, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OfferwallSetting {
  id: string;
  network: string;
  isEnabled: boolean;
  apiKey: string | null;
  secretKey: string | null;
  userId: string | null;
  postbackUrl: string | null;
  updatedAt: Date;
}

const OFFERWALL_INFO = {
  cpagrip: {
    name: "CPAGrip",
    description: "Content locking and offerwall platform",
    setupUrl: "https://www.cpagrip.com/",
    fields: {
      userId: "Your CPAGrip User ID (required for offers API)",
      apiKey: "API Key (optional, for advanced features)",
    },
  },
  adbluemedia: {
    name: "AdBlueMedia (AdGate Media)",
    description: "Offerwall and content monetization platform",
    setupUrl: "https://www.adbluemedia.com/",
    fields: {
      userId: "Wall ID (required)",
      apiKey: "API Key (required for offers feed)",
    },
  },
  bitcotasks: {
    name: "BitcoTasks",
    description: "Offerwall with offers, surveys, PTC and tasks",
    setupUrl: "https://bitcotasks.com/documentations",
    fields: {
      userId: "Not used (Sub ID is the AdShrtPro user ID)",
      apiKey: "API Key (required - used in the offerwall iframe URL)",
    },
  },
  faucetpay: {
    name: "FaucetPay",
    description: "Crypto micropayment processor with offerwalls",
    setupUrl: "https://faucetpay.io/",
    fields: {
      userId: "API Key",
      apiKey: "Not used",
    },
  },
};

export default function AdminOfferwallsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [settings, setSettings] = useState<Record<string, Partial<OfferwallSetting>>>({});

  const { data: offerwallSettings, isLoading } = useQuery<OfferwallSetting[]>({
    queryKey: ["/api/admin/offerwall-settings"],
    enabled: !!user?.isAdmin,
  });

  // Initialize settings state when data is loaded
  useEffect(() => {
    if (offerwallSettings) {
      const settingsMap: Record<string, Partial<OfferwallSetting>> = {};
      offerwallSettings.forEach((setting) => {
        settingsMap[setting.network] = setting;
      });
      setSettings(settingsMap);
    }
  }, [offerwallSettings]);

  const updateSettingMutation = useMutation({
    mutationFn: async ({ network, data }: { network: string; data: Partial<OfferwallSetting> }) => {
      await apiRequest("PATCH", `/api/admin/offerwall-settings/${network}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/offerwall-settings"] });
      toast({ title: "Settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  useEffect(() => {
    // Only redirect after auth has finished loading to avoid false negatives.
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (!user.isAdmin) {
      router.push("/dashboard");
      return;
    }
  }, [authLoading, user, router]);

  // While auth is loading or user is not authorized, render nothing.
  if (authLoading) return null;
  if (!user || !user.isAdmin) return null;

  const handleUpdateSetting = (network: string, field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [network]: {
        ...prev[network],
        [field]: value,
      },
    }));
  };

  const handleSaveSetting = (network: string) => {
    updateSettingMutation.mutate({
      network,
      data: settings[network] || {},
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/admin" className="text-primary hover:underline text-sm mb-2 inline-block">
            <ArrowLeft className="inline h-4 w-4 mr-1" />
            Back to Admin
          </Link>
          <h1 className="text-3xl font-bold mb-2">Offerwall Settings</h1>
          <p className="text-muted-foreground">
            Configure offerwall integrations for your platform.
          </p>
        </div>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> After enabling an offerwall, make sure to configure the postback URL 
            in your offerwall provider&apos;s dashboard to credit users automatically. The postback URL format will be:
            <code className="block mt-2 p-2 bg-muted rounded text-sm">
              https://yourdomain.com/api/postback/[network]?user_id=&#123;&#123;user_id&#125;&#125;&amp;amount=&#123;&#123;amount&#125;&#125;
            </code>
            <span className="block mt-2">
              BitcoTasks is the exception &mdash; it posts to its own webhook path and signs
              each callback, so set its Postback URL to:
            </span>
            <code className="block mt-2 p-2 bg-muted rounded text-sm">
              https://adshrtpro.com/wh/bitcotasks
            </code>
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(OFFERWALL_INFO).map(([network, info]) => {
              const setting = settings[network] || {};
              
              return (
                <Card key={network}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {info.name}
                          <a
                            href={info.setupUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                            title={`Visit ${info.name} website`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </CardTitle>
                        <CardDescription>{info.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={setting.isEnabled || false}
                          onCheckedChange={(checked) =>
                            handleUpdateSetting(network, "isEnabled", checked)
                          }
                        />
                        <Label>Enabled</Label>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor={`${network}-userId`}>
                          {info.fields.userId}
                        </Label>
                        <Input
                          id={`${network}-userId`}
                          value={setting.userId || ""}
                          onChange={(e) =>
                            handleUpdateSetting(network, "userId", e.target.value)
                          }
                          placeholder="Enter User ID / Wall ID"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${network}-apiKey`}>
                          {info.fields.apiKey}
                        </Label>
                        <Input
                          id={`${network}-apiKey`}
                          value={setting.apiKey || ""}
                          onChange={(e) =>
                            handleUpdateSetting(network, "apiKey", e.target.value)
                          }
                          placeholder="Enter API Key (if required)"
                          type="password"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`${network}-secretKey`}>Secret Key (Optional)</Label>
                      <Input
                        id={`${network}-secretKey`}
                        value={setting.secretKey || ""}
                        onChange={(e) =>
                          handleUpdateSetting(network, "secretKey", e.target.value)
                        }
                        placeholder="Enter Secret Key"
                        type="password"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${network}-postbackUrl`}>
                        Custom Postback URL (Optional)
                      </Label>
                      <Textarea
                        id={`${network}-postbackUrl`}
                        value={setting.postbackUrl || ""}
                        onChange={(e) =>
                          handleUpdateSetting(network, "postbackUrl", e.target.value)
                        }
                        placeholder={`Default: /api/postback/${network}`}
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Leave empty to use default postback endpoint
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleSaveSetting(network)}
                        disabled={updateSettingMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save {info.name} Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Testing Offerwalls</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              After configuring and enabling an offerwall:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Enable the offerwall using the switch above</li>
              <li>Add your API credentials</li>
              <li>Save the settings</li>
              <li>Visit the <Link href="/earn/offerwalls" className="text-primary hover:underline">Offerwalls page</Link> to see available offers</li>
              <li>Configure postback URLs in your offerwall provider dashboard</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
