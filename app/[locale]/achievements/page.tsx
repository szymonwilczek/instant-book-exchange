"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AchievementCarousel } from "@/components/achievements/achievement-carousel";
import { Progress } from "@/components/ui/progress";
import { Trophy, Lock, CheckCircle2, Loader2 } from "lucide-react";

interface AchievementTier {
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
}

interface AchievementSeries {
  seriesId: string;
  seriesName: string;
  category: string;
  tiers: AchievementTier[];
  currentTierIndex: number;
  nextTierIndex: number;
}

interface AchievementsData {
  series: AchievementSeries[];
  groupedByCategory: Record<string, AchievementSeries[]>;
  stats: {
    unlockedCount: number;
    totalCount: number;
    totalPoints: number;
    progress: string;
  };
}

const categoryLabels: Record<string, string> = {
  trading: "📚 Trading",
  reputation: "⭐ Reputacja",
  collection: "📖 Kolekcja",
  activity: "⚡ Aktywność",
  community: "💬 Społeczność",
  special: "🌟 Specjalne",
};

export default function AchievementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mongoUserId, setMongoUserId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    const fetchUserId = async () => {
      if (!session?.user?.email) return;

      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) throw new Error("Failed to fetch profile");
        const profile = await res.json();
        setMongoUserId(profile._id);
      } catch (error) {
        console.error("Error fetching user ID:", error);
      }
    };

    if (session?.user?.email) {
      fetchUserId();
    }
  }, [session, status, router]);

  // pobieranie osiagniec 
  useEffect(() => {
    const fetchAchievements = async () => {
      if (!mongoUserId) return;

      try {
        setLoading(true);
        const res = await fetch(`/api/achievements/user/${mongoUserId}`);
        if (!res.ok) throw new Error("Failed to fetch achievements");
        const achievementsData = await res.json();
        setData(achievementsData);
      } catch (error) {
        console.error("Error fetching achievements:", error);
      } finally {
        setLoading(false);
      }
    };

    if (mongoUserId) {
      fetchAchievements();
    }
  }, [mongoUserId]);

  if (loading || status === "loading") {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const seriesWithUnlocked = data.series.filter((s) =>
    s.tiers.some((t) => t.unlocked)
  );
  const seriesAllLocked = data.series.filter((s) =>
    s.tiers.every((t) => !t.unlocked)
  );

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Osiągnięcia
        </h1>
        <p className="text-muted-foreground">
          Śledź swój postęp i odblokowuj nagrody
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">Odblokowane</span>
          </div>
          <p className="text-2xl font-bold">
            {data.stats.unlockedCount}/{data.stats.totalCount}
          </p>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Zablokowane</span>
          </div>
          <p className="text-2xl font-bold">
            {data.stats.totalCount - data.stats.unlockedCount}
          </p>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-medium">
              Punkty zdobyte z osiągnięć
            </span>
          </div>
          <p className="text-2xl font-bold">{data.stats.totalPoints}</p>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Postęp</span>
          </div>
          <p className="text-2xl font-bold">{data.stats.progress}%</p>
          <Progress value={parseFloat(data.stats.progress)} className="mt-2" />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="all">Wszystkie</TabsTrigger>
          <TabsTrigger value="unlocked">Odblokowane</TabsTrigger>
          <TabsTrigger value="locked">Zablokowane</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-8">
          {Object.entries(data.groupedByCategory).map(([category, series]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold mb-4">
                {categoryLabels[category] || category}
              </h2>
              <div className="space-y-6">
                {series.map((s) => (
                  <AchievementCarousel key={s.seriesId} series={s} />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="unlocked" className="mt-6 space-y-6">
          {seriesWithUnlocked.map((s) => (
            <AchievementCarousel key={s.seriesId} series={s} />
          ))}
        </TabsContent>

        <TabsContent value="locked" className="mt-6 space-y-6">
          {seriesAllLocked.map((s) => (
            <AchievementCarousel key={s.seriesId} series={s} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
