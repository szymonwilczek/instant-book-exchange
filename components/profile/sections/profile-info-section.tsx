"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AchievementBadge } from "@/components/achievements/achievement-badge";
import {
  Edit,
  MapPin,
  Phone,
  Github,
  Twitter,
  Globe,
  Trophy,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface UserProfile {
  username: string;
  email: string;
  phone?: string;
  location?: string;
  avatar?: string;
  bio?: string;
  github?: string;
  twitter?: string;
  website?: string;
}

interface ProfileInfoSectionProps {
  profileData?: UserProfile;
  onEditProfile: () => void;
  isPublicView?: boolean;
  userId?: string;
}

interface Achievement {
  _id: string;
  icon: string;
  name: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  points: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export function ProfileInfoSection({
  profileData,
  onEditProfile,
  isPublicView = false,
  userId,
}: ProfileInfoSectionProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const [mongoUserId, setMongoUserId] = useState<string | null>(null);
  const t = useTranslations("profile");

  // MongoDB user ID
  useEffect(() => {
    const fetchUserId = async () => {
      if (userId) {
        setMongoUserId(userId);
        return;
      }

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

    fetchUserId();
  }, [session?.user?.email, userId]);

  // pobieranie achievements
  useEffect(() => {
    const fetchAchievements = async () => {
      if (!mongoUserId) return;

      try {
        setLoadingAchievements(true);
        const res = await fetch(`/api/achievements/user/${mongoUserId}`);
        if (!res.ok) throw new Error("Failed to fetch achievements");
        const data = await res.json();

        const allAchievements: Achievement[] = [];
        data.series?.forEach((serie: { tiers: Achievement[] }) => {
          allAchievements.push(...serie.tiers);
        });

        // tylko odblokowane osiagniecia posortowane po dacie
        const unlocked = allAchievements
          .filter((a) => a.unlocked)
          .sort(
            (a, b) =>
              new Date(b.unlockedAt || 0).getTime() -
              new Date(a.unlockedAt || 0).getTime()
          )
          .slice(0, 5); // top 5

        setAchievements(unlocked);
      } catch (error) {
        console.error("Error fetching achievements:", error);
      } finally {
        setLoadingAchievements(false);
      }
    };

    fetchAchievements();
  }, [mongoUserId]);

  if (!profileData) {
    return (
      <Card className="lg:col-span-1">
        <CardContent className="p-6">
          <p className="text-muted-foreground">{t("loading")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("informations")}</CardTitle>
          {!isPublicView && (
            <Button variant="ghost" size="icon" onClick={onEditProfile}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">{t("editProfile")}</span>
            </Button>
          )}
        </div>
        <CardDescription>
          {isPublicView ? t("publicProfile") : t("accountDetails")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-24 w-24">
            <AvatarImage
              src={profileData.avatar || "/placeholder.svg"}
              alt={profileData.username}
            />
            <AvatarFallback>
              {profileData.username
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h3 className="text-lg font-semibold">{profileData.username}</h3>
            <p className="text-sm text-muted-foreground">{profileData.email}</p>
          </div>
        </div>

        {!loadingAchievements && achievements.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                {t("achievements")} ({achievements.length})
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/achievements")}
              >
                {t("showAll")}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {achievements.map((achievement) => (
                <AchievementBadge
                  key={achievement._id}
                  achievement={achievement}
                  size="md"
                />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3 pt-4 border-t">
          {profileData.bio && (
            <div>
              <p className="text-sm text-muted-foreground">{t("bio")}</p>
              <p className="text-sm">{profileData.bio}</p>
            </div>
          )}

          {profileData.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{profileData.location}</span>
            </div>
          )}

          {profileData.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{profileData.phone}</span>
            </div>
          )}

          {(profileData.github ||
            profileData.twitter ||
            profileData.website) && (
            <div className="flex gap-2 pt-2">
              {profileData.github && (
                <a
                  href={profileData.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Github className="h-5 w-5" />
                </a>
              )}
              {profileData.twitter && (
                <a
                  href={profileData.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {profileData.website && (
                <a
                  href={profileData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Globe className="h-5 w-5" />
                </a>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
