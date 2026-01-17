"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Megaphone, Gift, Bell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Announcement {
  id: string;
  message: string;
  type: "info" | "success" | "promo";
  isActive: boolean;
  priority: number;
}

const typeIcons = {
  info: Bell,
  success: Gift,
  promo: Sparkles,
};

const typeStyles = {
  info: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
  success: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
  promo: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200",
};

const defaultAnnouncements: Announcement[] = [
  {
    id: "default-updates",
    message: "Stay updated! Check notifications for new features and maintenance schedules.",
    type: "info",
    isActive: true,
    priority: 0,
  },
  {
    id: "default-rewards",
    message: "Earn rewards! Complete tasks, refer friends, and withdraw via FaucetPay.",
    type: "success",
    isActive: true,
    priority: 0,
  },
  {
    id: "default-promo",
    message: "New: Bulk link shortening now available! Import up to 50 URLs at once.",
    type: "promo",
    isActive: true,
    priority: 0,
  },
];

interface AnnouncementBannerProps {
  rotateInterval?: number;
}

export function AnnouncementBanner({ rotateInterval = 5000 }: AnnouncementBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const { data: fetchedAnnouncements } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    staleTime: 60000,
  });

  const announcements = fetchedAnnouncements && fetchedAnnouncements.length > 0 
    ? fetchedAnnouncements 
    : defaultAnnouncements;

  useEffect(() => {
    if (isPaused || announcements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, rotateInterval);

    return () => clearInterval(interval);
  }, [announcements.length, rotateInterval, isPaused]);

  useEffect(() => {
    if (currentIndex >= announcements.length) {
      setCurrentIndex(0);
    }
  }, [announcements.length, currentIndex]);

  if (!isVisible || announcements.length === 0) return null;

  const current = announcements[currentIndex];
  if (!current) return null;

  const Icon = typeIcons[current.type] || Bell;

  return (
    <div 
      className={`relative border-b transition-all duration-300 ${typeStyles[current.type]}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      data-testid="announcement-banner"
    >
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-3">
          <Icon className="w-4 h-4 shrink-0" />
          <p className="text-sm font-medium text-center" data-testid="announcement-message">
            {current.message}
          </p>
          {announcements.length > 1 && (
            <div className="flex items-center gap-1 ml-2">
              {announcements.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentIndex ? "bg-current opacity-100" : "bg-current opacity-30"
                  }`}
                  aria-label={`Go to announcement ${idx + 1}`}
                />
              ))}
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 ml-2 opacity-60 hover:opacity-100"
            onClick={() => setIsVisible(false)}
            data-testid="button-close-announcement"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
