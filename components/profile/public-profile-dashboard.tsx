"use client";

import { useState } from "react";
import { ProfileInfoSection } from "./sections/profile-info-section";
import { StatsSection } from "./sections/stats-section";
import { OfferedBooksSection } from "./sections/offered-books-section";
import { WishlistSection } from "./sections/wishlist-section";
import { ReviewsSection } from "./sections/reviews-section";
import { Button } from "@/components/ui/button";
import { MessageCircle, Ban, TrendingUp, User, Star } from "lucide-react";
import { StartConversationModal } from "@/components/messages/start-conversation-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

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
  };
  currentUserId?: string;
}

export function PublicProfileDashboard({
  profileData,
  currentUserId,
}: PublicProfileDashboardProps) {
  const router = useRouter();
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const { user, offeredBooks, wishlist, reviews, stats } = profileData;

  const handleBlockUser = async () => {
    setBlocking(true);
    try {
      const res = await fetch("/api/user/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id }),
      });

      if (!res.ok) {
        throw new Error("Failed to block user");
      }

      alert("User blocked successfully");
      router.push("/");
    } catch (error) {
      console.error("Error blocking user:", error);
      alert("Failed to block user");
    } finally {
      setBlocking(false);
      setBlockModalOpen(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{user.username}&apos;s Profile</h1>
          <p className="text-muted-foreground">Public profile view</p>
        </div>

        {currentUserId && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBlockModalOpen(true)}>
              <Ban className="mr-2 h-4 w-4" />
              Block
            </Button>
          </div>
        )}
      </div>

      <ProfileInfoSection
        profileData={{
          username: user.username,
          email: user.email || "Hidden",
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
            title: "Points",
            value: user.points,
            icon: TrendingUp,
          },
          {
            title: "Member Since",
            value: `${stats.joinedDaysAgo} days`,
            icon: User,
          },
        ]}
        userStats={[
          {
            title: "Completed Exchanges",
            value: stats.completedTransactions,
            icon: TrendingUp,
          },
          {
            title: "Average Rating",
            value: user.averageRating.toFixed(1),
            icon: Star,
          },
        ]}
        activityStats={[
          {
            title: "Books Offered",
            value: stats.offeredBooksCount,
            icon: User,
          },
          {
            title: "Wishlist Items",
            value: stats.wishlistCount,
            icon: Star,
          },
          {
            title: "Reviews",
            value: stats.reviewsCount,
            icon: Star,
          },
        ]}
      />

      <OfferedBooksSection
        books={offeredBooks as never[]}
        onAddBook={() => {}}
        onEditBook={() => {}}
        onDeleteBook={() => {}}
        isPublicView={true}
      />

      {wishlist.length > 0 && (
        <WishlistSection
          wishlist={wishlist as never[]}
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

      <Dialog open={blockModalOpen} onOpenChange={setBlockModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block {user.username}?</DialogTitle>
            <DialogDescription>
              You won&apos;t be able to see their books or send messages. They
              won&apos;t be notified that you blocked them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBlockModalOpen(false)}
              disabled={blocking}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlockUser}
              disabled={blocking}
            >
              {blocking ? "Blocking..." : "Block User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
