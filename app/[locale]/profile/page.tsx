"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { ProfileDashboard } from "@/components/profile/profile-dashboard";
import { useTranslations } from "next-intl";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState(null);
  const [promotedBooks, setPromotedBooks] = useState([]);
  const t = useTranslations("profile");

  const updateProfile = async () => {
    const res = await fetch("/api/user/profile");
    const data = await res.json();
    setUserData(data);

    const promotedRes = await fetch("/api/user/promoted-books");
    const promotedData = await promotedRes.json();
    setPromotedBooks(promotedData.active || []);
  };

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

  if (status === "loading") return <div>{t("loading")}</div>;

  return (
    <div>
      <div className="min-h-screen bg-background">
        <ProfileDashboard
          userData={userData}
          promotedBooks={promotedBooks}
          onUpdate={updateProfile}
        />
      </div>
    </div>
  );
}
