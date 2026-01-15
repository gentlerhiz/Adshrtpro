import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Link2, 
  BarChart3, 
  QrCode, 
  FileText, 
  Users, 
  DollarSign,
  Plus,
  ArrowRight
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type EmptyStateType = "links" | "analytics" | "qr-codes" | "blog" | "users" | "earnings" | "tasks" | "referrals" | "withdrawals";

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

const emptyStateConfig: Record<EmptyStateType, {
  icon: LucideIcon;
  defaultTitle: string;
  defaultDescription: string;
  defaultActionLabel?: string;
  defaultActionHref?: string;
}> = {
  links: {
    icon: Link2,
    defaultTitle: "No links yet",
    defaultDescription: "Create your first short link to get started. It's quick and easy!",
    defaultActionLabel: "Create Link",
  },
  analytics: {
    icon: BarChart3,
    defaultTitle: "No analytics data",
    defaultDescription: "Analytics will appear here once your links start getting clicks.",
    defaultActionLabel: "View Links",
    defaultActionHref: "/dashboard",
  },
  "qr-codes": {
    icon: QrCode,
    defaultTitle: "No QR codes yet",
    defaultDescription: "Generate QR codes for your shortened links to share them easily.",
    defaultActionLabel: "Create Link First",
    defaultActionHref: "/dashboard",
  },
  blog: {
    icon: FileText,
    defaultTitle: "No blog posts yet",
    defaultDescription: "Check back soon for helpful articles and updates.",
  },
  users: {
    icon: Users,
    defaultTitle: "No users found",
    defaultDescription: "Users will appear here once they register on the platform.",
  },
  earnings: {
    icon: DollarSign,
    defaultTitle: "No earnings yet",
    defaultDescription: "Complete tasks, offerwalls, and refer friends to start earning!",
    defaultActionLabel: "Start Earning",
    defaultActionHref: "/earn",
  },
  tasks: {
    icon: FileText,
    defaultTitle: "No tasks available",
    defaultDescription: "Check back later for new tasks to complete and earn rewards.",
  },
  referrals: {
    icon: Users,
    defaultTitle: "No referrals yet",
    defaultDescription: "Share your referral link with friends to earn bonus rewards!",
  },
  withdrawals: {
    icon: DollarSign,
    defaultTitle: "No withdrawals yet",
    defaultDescription: "Once you earn enough, you can withdraw your balance here.",
    defaultActionLabel: "Start Earning",
    defaultActionHref: "/earn",
  },
};

export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.icon;
  
  const displayTitle = title || config.defaultTitle;
  const displayDescription = description || config.defaultDescription;
  const displayActionLabel = actionLabel || config.defaultActionLabel;
  const displayActionHref = actionHref || config.defaultActionHref;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="font-heading text-xl font-semibold mb-2">{displayTitle}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{displayDescription}</p>
      
      {(displayActionLabel && (displayActionHref || onAction)) && (
        <>
          {displayActionHref ? (
            <Link href={displayActionHref}>
              <Button data-testid={`button-empty-${type}-action`}>
                {type === "links" ? <Plus className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                {displayActionLabel}
              </Button>
            </Link>
          ) : (
            <Button onClick={onAction} data-testid={`button-empty-${type}-action`}>
              <Plus className="w-4 h-4 mr-2" />
              {displayActionLabel}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
