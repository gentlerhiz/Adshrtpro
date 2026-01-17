import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { SiTelegram, SiFacebook, SiX, SiInstagram, SiYoutube, SiDiscord, SiTiktok } from "react-icons/si";

interface SocialAccount {
  platform: string;
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  description: string;
  url: string;
  color: string;
}

const socialAccounts: SocialAccount[] = [
  {
    platform: "Telegram",
    icon: SiTelegram,
    name: "@AdShrtPro",
    description: "Join our Telegram channel for updates, support, and community discussions.",
    url: "https://t.me/AdShrtPro",
    color: "bg-[#0088cc]",
  },
  {
    platform: "Facebook",
    icon: SiFacebook,
    name: "AdShrtPro Official",
    description: "Follow us on Facebook for news, tips, and promotional offers.",
    url: "https://facebook.com/AdShrtPro",
    color: "bg-[#1877f2]",
  },
  {
    platform: "X (Twitter)",
    icon: SiX,
    name: "@AdShrtPro",
    description: "Get the latest updates and announcements on X.",
    url: "https://x.com/AdShrtPro",
    color: "bg-black dark:bg-white",
  },
  {
    platform: "Instagram",
    icon: SiInstagram,
    name: "@adshrtpro",
    description: "Follow our Instagram for visual content and behind-the-scenes.",
    url: "https://instagram.com/adshrtpro",
    color: "bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045]",
  },
  {
    platform: "YouTube",
    icon: SiYoutube,
    name: "AdShrtPro",
    description: "Watch tutorials, guides, and earnings tips on our YouTube channel.",
    url: "https://youtube.com/@AdShrtPro",
    color: "bg-[#ff0000]",
  },
  {
    platform: "Discord",
    icon: SiDiscord,
    name: "AdShrtPro Community",
    description: "Join our Discord server for real-time support and community chat.",
    url: "https://discord.gg/AdShrtPro",
    color: "bg-[#5865f2]",
  },
  {
    platform: "TikTok",
    icon: SiTiktok,
    name: "@adshrtpro",
    description: "Check out our TikTok for quick tips and entertaining content.",
    url: "https://tiktok.com/@adshrtpro",
    color: "bg-black dark:bg-white dark:text-black",
  },
];

export default function SocialsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Community & Socials</h1>
          <p className="text-muted-foreground">
            Connect with us on our official social media channels.
          </p>
        </div>

        <Card className="mb-8 border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-400">
                  Security Notice
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-500">
                  These are our only official social media accounts. Beware of impersonators.
                  We will never ask for your password or payment outside of our platform.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {socialAccounts.map((social) => (
            <Card key={social.platform} className="hover-elevate">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${social.color}`}>
                    <social.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{social.platform}</CardTitle>
                    <CardDescription>{social.name}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {social.description}
                </p>
                <a
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="w-full" data-testid={`button-social-${social.platform.toLowerCase()}`}>
                    <span>Follow on {social.platform}</span>
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            Have questions? Reach out to us on any of our official channels above
            or visit our <a href="/contact" className="text-primary hover:underline">Contact page</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
