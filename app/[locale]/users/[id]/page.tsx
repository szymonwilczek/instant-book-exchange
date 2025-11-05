"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PublicProfileDashboard } from "@/components/profile/public-profile-dashboard";
import { Loader2 } from "lucide-react";

interface ProfileData {
  user: {
    _id: string;
    username: string;
    email: string | null;
    location?: string;
    bio?: string;
    profileImage?: string;
    github?: string;
    twitter?: string;
    website?: string;
    points: number;
    averageRating: number;
    createdAt: string;
  };
  offeredBooks: unknown[];
  wishlist: unknown[];
  reviews: unknown[];
  stats: {
    completedTransactions: number;
    offeredBooksCount: number;
    wishlistCount: number;
    reviewsCount: number;
    joinedDaysAgo: number;
  };
  isOwnProfile: boolean;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/user/profile/${params.id}`);

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load profile");
        }

        const data = await res.json();
        setProfileData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProfile();
    }
  }, [params.id]);

  // jesli to wlasny profil to redirect do /profile
  useEffect(() => {
    if (profileData?.isOwnProfile && status === "authenticated") {
      router.push("/profile");
    }
  }, [profileData?.isOwnProfile, status, router]);

  if (loading || status === "loading") {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
          <h2 className="font-semibold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return null;
  }

  return (
    <PublicProfileDashboard
      profileData={profileData}
      currentUserId={session?.user?.id}
    />
  );
}
