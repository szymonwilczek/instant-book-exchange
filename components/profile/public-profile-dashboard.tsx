"use client";

import { useState } from "react";
import { ProfileInfoSection } from "./sections/profile-info-section";
import { StatsSection } from "./sections/stats-section";
import { OfferedBooksSection } from "./sections/offered-books-section";
import { WishlistSection } from "./sections/wishlist-section";
import { ReviewsSection } from "./sections/reviews-section";
import { TrendingUp, User, Star } from "lucide-react";
import { StartConversationModal } from "@/components/messages/start-conversation-modal";
import { IBook } from "@/lib/models/Book";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface PublicProfileDashboardProps {
  profileData: {
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
    offeredBooks: IBook[];
    wishlist: IBook[];
    reviews: unknown[];
    stats: {
      completedTransactions: number;
      offeredBooksCount: number;
      wishlistCount: number;
      reviewsCount: number;
      joinedDaysAgo: number;
    };
    isOwnProfile: boolean;
  };
  currentUserId?: string;
}

export function PublicProfileDashboard({
  profileData,
  currentUserId,
}: PublicProfileDashboardProps) {
  const router = useRouter();
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const t = useTranslations("profile");

  const { user, offeredBooks, wishlist, reviews, stats } = profileData;

  const mappedOfferedBooks = offeredBooks.map((book: IBook) => ({
    _id: book._id,
    title: book.title,
    author: book.author,
    imageUrl: book.imageUrl,
    createdAt:
      book.createdAt instanceof Date
        ? book.createdAt.toISOString()
        : book.createdAt,
    status: (book.status === "available" ? "active" : "inactive") as
      | "active"
      | "inactive",
    condition: book.condition,
    promotedUntil:
      book.promotedUntil instanceof Date
        ? book.promotedUntil.toISOString()
        : book.promotedUntil,
    promotedAt:
      book.promotedAt instanceof Date
        ? book.promotedAt.toISOString()
        : book.promotedAt,
  }));

  const mappedWishlist = wishlist.map((book: IBook) => ({
    id: book._id,
    title: book.title,
    author: book.author,
    image: book.imageUrl,
    createdAt:
      book.createdAt instanceof Date
        ? book.createdAt.toISOString()
        : book.createdAt,
  }));

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {t("usersProfile", { username: user.username })}
          </h1>
          <p className="text-muted-foreground">Public profile view</p>
        </div>
      </div>

      <ProfileInfoSection
        profileData={{
          username: user.username,
          email: user.email || t("emailHidden"),
          phone: "",
          location: user.location || "",
          avatar: user.profileImage || "",
          bio: user.bio || "",
          github: user.github,
          twitter: user.twitter,
          website: user.website,
        }}
        onEditProfile={() => {}}
        isPublicView={true}
        userId={user._id}
      />

      <StatsSection
        platformStats={[
          {
            title: t("userPoints"),
            value: user.points,
            icon: TrendingUp,
          },
          {
            title: t("userMemberSince"),
            value: `${stats.joinedDaysAgo} ${t("userMemberDays")}`,
            icon: User,
          },
        ]}
        userStats={[
          {
            title: t("userCompletedExchanges"),
            value: stats.completedTransactions,
            icon: TrendingUp,
          },
          {
            title: t("userAverageRating"),
            value: user.averageRating.toFixed(1),
            icon: Star,
          },
        ]}
        activityStats={[
          {
            title: t("userBooksOffered"),
            value: stats.offeredBooksCount,
            icon: User,
          },
          {
            title: t("userWishlistItems"),
            value: stats.wishlistCount,
            icon: Star,
          },
          {
            title: t("userReviews"),
            value: stats.reviewsCount,
            icon: Star,
          },
        ]}
      />

      <OfferedBooksSection
        books={mappedOfferedBooks}
        onAddBook={() => {}}
        onEditBook={() => {}}
        onDeleteBook={() => {}}
        isPublicView={true}
      />

      {mappedWishlist.length > 0 && (
        <WishlistSection
          wishlist={mappedWishlist}
          onAddToWishlist={() => {}}
          onRemoveFromWishlist={() => {}}
          isPublicView={true}
        />
      )}

      <ReviewsSection reviews={reviews as never[]} />

      {offeredBooks.length > 0 && (
        <StartConversationModal
          open={messageModalOpen}
          onOpenChange={setMessageModalOpen}
          book={{
            _id: (offeredBooks[0] as { _id: string })._id,
            title: (offeredBooks[0] as { title: string }).title,
            author: (offeredBooks[0] as { author?: string }).author || "",
            coverImage:
              (offeredBooks[0] as { imageUrl?: string }).imageUrl || "",
          }}
          recipientId={user._id}
          recipientName={user.username}
        />
      )}
    </div>
  );
}
