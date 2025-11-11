import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { AchievementCard } from "./achievement-card";

interface AchievementSeries {
  seriesId: string;
  seriesName: string;
  category: string;
  tiers: Array<{
    _id: string;
    id: string;
    name: string;
    description: string;
    icon: string;
    tier: "bronze" | "silver" | "gold" | "platinum";
    points: number;
    requirement: Record<string, number>;
    progress: number;
    unlocked: boolean;
    unlockedAt?: Date;
  }>;
  currentTierIndex: number;
  nextTierIndex: number;
}

export function AchievementCarousel({ series }: { series: AchievementSeries }) {
  return (
    <div className="relative px-12">
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
      >
        <CarouselContent>
          {series.tiers.map((tier, index) => (
            <CarouselItem key={tier._id}>
              <AchievementCard
                achievement={tier}
                isCurrentTier={index === series.currentTierIndex}
                isNextTier={index === series.nextTierIndex}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <div className="mt-2 text-center text-sm text-muted-foreground">
        {series.tiers.filter((t) => t.unlocked).length}/{series.tiers.length}{" "}
        odblokowane
      </div>
    </div>
  );
}
