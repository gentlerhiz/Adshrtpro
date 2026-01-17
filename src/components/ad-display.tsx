"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { CustomAd } from "@shared/schema";
import { adSizeRecommendations } from "@shared/schema";

interface AdDisplayProps {
  placement: "header" | "footer" | "sidebar" | "in-content";
  className?: string;
  showAdSense?: boolean;
  showCustomAds?: boolean;
}

export function AdDisplay({ 
  placement, 
  className = "",
  showAdSense = true,
  showCustomAds = true,
}: AdDisplayProps) {
  const adsenseRef = useRef<HTMLDivElement>(null);
  const customAdRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { data: adsSettings } = useQuery<{
    adsEnabled: boolean;
    adsenseCode: string;
    rewardedAdCode: string;
  }>({
    queryKey: ["/api/settings/ads"],
  });

  const { data: customAds } = useQuery<CustomAd[]>({
    queryKey: ["/api/custom-ads", placement],
    queryFn: async () => {
      const res = await fetch(`/api/custom-ads?placement=${placement}`);
      if (!res.ok) throw new Error("Failed to fetch ads");
      return res.json();
    },
    enabled: adsSettings?.adsEnabled !== false && showCustomAds,
  });

  const filteredAds = customAds?.filter((ad) => {
    if (ad.deviceType === "both") return true;
    if (ad.deviceType === "mobile" && isMobile) return true;
    if (ad.deviceType === "desktop" && !isMobile) return true;
    return false;
  });

  const customAd = filteredAds?.[0];
  const hasAdSense = showAdSense && adsSettings?.adsenseCode;
  const hasCustomAd = showCustomAds && customAd;

  useEffect(() => {
    if (!adsenseRef.current || !adsSettings?.adsenseCode || !showAdSense) return;

    adsenseRef.current.innerHTML = "";

    try {
      const range = document.createRange();
      range.selectNode(adsenseRef.current);
      const fragment = range.createContextualFragment(adsSettings.adsenseCode);
      adsenseRef.current.appendChild(fragment);
    } catch (error) {
      const fallback = document.createElement("div");
      fallback.innerHTML = adsSettings.adsenseCode;
      adsenseRef.current.appendChild(fallback);
    }
  }, [adsSettings?.adsenseCode, showAdSense]);

  useEffect(() => {
    if (!customAdRef.current || !customAd?.adCode || !showCustomAds) return;

    customAdRef.current.innerHTML = "";

    try {
      const range = document.createRange();
      range.selectNode(customAdRef.current);
      const fragment = range.createContextualFragment(customAd.adCode);
      customAdRef.current.appendChild(fragment);
    } catch (error) {
      const fallback = document.createElement("div");
      fallback.innerHTML = customAd.adCode;
      customAdRef.current.appendChild(fallback);
    }
  }, [customAd?.adCode, showCustomAds]);

  if (!adsSettings?.adsEnabled) {
    return null;
  }

  if (!hasAdSense && !hasCustomAd) {
    return null;
  }

  const sizeInfo = customAd?.adSize 
    ? adSizeRecommendations[customAd.adSize as keyof typeof adSizeRecommendations]
    : null;
  
  const getResponsiveHeight = () => {
    if (!sizeInfo) return 90;
    if (isMobile) {
      if (sizeInfo.height > 100) return 100;
      return sizeInfo.height;
    }
    return sizeInfo.height;
  };

  const getResponsiveWidth = () => {
    if (!sizeInfo) return "100%";
    if (isMobile) return "100%";
    return Math.min(sizeInfo.width, 728);
  };

  return (
    <div
      className={`flex flex-col items-center justify-center w-full gap-4 ${className}`}
      data-testid={`ad-container-${placement}`}
    >
      {hasAdSense && (
        <div
          ref={adsenseRef}
          className="adsense-container flex items-center justify-center w-full"
          style={{
            minHeight: isMobile ? 50 : 90,
            maxWidth: "100%",
          }}
          data-testid={`adsense-display-${placement}`}
        />
      )}
      
      {hasCustomAd && (
        <div
          className="flex items-center justify-center w-full overflow-hidden"
          style={{
            minHeight: getResponsiveHeight(),
          }}
        >
          <div
            ref={customAdRef}
            className="custom-ad-container flex items-center justify-center"
            style={{
              width: getResponsiveWidth(),
              maxWidth: "100%",
              height: getResponsiveHeight(),
              overflow: "hidden",
            }}
            data-testid={`custom-ad-display-${placement}`}
          />
        </div>
      )}
    </div>
  );
}
