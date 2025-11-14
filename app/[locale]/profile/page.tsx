"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { ProfileDashboard } from "@/components/profile/profile-dashboard";
import { useTranslations } from "next-intl";

interface BookBase {
  id: string;
  title: string;
  author?: string;
  image?: string;
  createdAt: string;
  status?: "active" | "inactive";
}

interface OfferedBook {
  _id: string;
  title: string;
  author?: string;
  imageUrl?: string;
  createdAt: string;
  status: string;
}

interface UserData {
  username?: string;
  email?: string;
  phone?: string;
  location?: string;
  profileImage?: string;
  bio?: string;
  averageRating?: number;
  hasCompletedOnboarding?: boolean;
  preferences?: {
    genres?: string[];
  };
  wishlist?: BookBase[];
  offeredBooks?: OfferedBook[];
  github?: string;
  twitter?: string;
  linkedin?: string;
  points?: number;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [promotedBooks, setPromotedBooks] = useState([]);
  const t = useTranslations("profile");

  useEffect(() => {
    if (session) {
      const fetchData = async () => {
        const res = await fetch("/api/user/profile");
        const data = await res.json();
        setUserData(data);

        const promotedRes = await fetch("/api/user/promoted-books");
        const promotedData = await promotedRes.json();
        setPromotedBooks(promotedData.active || []);
      };
      fetchData();
    }
  }, [session]);

  const handleProfileUpdate = async () => { await update(); };

  if (status === "loading") return <div>{t("loading")}</div>;

  return (
    <div>
      <div className="min-h-screen bg-background">
        <ProfileDashboard userData={userData} promotedBooks={promotedBooks} onProfileUpdate={handleProfileUpdate} />
      </div>
    </div>
  );
}
