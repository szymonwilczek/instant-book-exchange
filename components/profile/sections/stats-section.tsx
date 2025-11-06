"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface Stat {
  title: string;
  value: string | number;
  icon: LucideIcon;
}

interface StatsSectionProps {
  platformStats: Stat[];
  userStats: Stat[];
  activityStats: Stat[];
  onPlatformApiChange?: (api: CarouselApi) => void;
  onUserApiChange?: (api: CarouselApi) => void;
  onActivityApiChange?: (api: CarouselApi) => void;
}

export function StatsSection({
  platformStats,
  userStats,
  activityStats,
  onPlatformApiChange,
  onUserApiChange,
  onActivityApiChange,
}: StatsSectionProps) {
  const t = useTranslations("profile");
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("platformStats")}
          </CardTitle>
          {(() => {
            const IconComponent = platformStats[0].icon;
            return <IconComponent className="h-4 w-4 text-muted-foreground" />;
          })()}
        </CardHeader>
        <CardContent>
          <Carousel
            className="w-full"
            opts={{ loop: true }}
            plugins={[Autoplay({ delay: 7500 })]}
            setApi={onPlatformApiChange}
          >
            <CarouselContent>
              {platformStats.map((stat, index) => (
                <CarouselItem key={index}>
                  <div className="flex flex-col items-center justify-center p-4">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground text-center">
                      {stat.title}
                    </p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("yourStats")}
          </CardTitle>
          {(() => {
            const IconComponent = userStats[0].icon;
            return <IconComponent className="h-4 w-4 text-muted-foreground" />;
          })()}
        </CardHeader>
        <CardContent>
          <Carousel
            className="w-full"
            opts={{ loop: true }}
            plugins={[Autoplay({ delay: 7500 })]}
            setApi={onUserApiChange}
          >
            <CarouselContent>
              {userStats.map((stat, index) => (
                <CarouselItem key={index}>
                  <div className="flex flex-col items-center justify-center p-4">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground text-center">
                      {stat.title}
                    </p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("activityStats")}
          </CardTitle>
          {(() => {
            const IconComponent = activityStats[0].icon;
            return <IconComponent className="h-4 w-4 text-muted-foreground" />;
          })()}
        </CardHeader>
        <CardContent>
          <Carousel
            className="w-full"
            opts={{ loop: true }}
            plugins={[Autoplay({ delay: 7500 })]}
            setApi={onActivityApiChange}
          >
            <CarouselContent>
              {activityStats.map((stat, index) => (
                <CarouselItem key={index}>
                  <div className="flex flex-col items-center justify-center p-4">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground text-center">
                      {stat.title}
                    </p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        </CardContent>
      </Card>
    </div>
  );
}
