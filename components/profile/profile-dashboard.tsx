"use client";

import { useState, useEffect, useMemo } from "react";
import { EditProfileModal } from "@/components/profile/modals/edit-profile-modal";
import { AddBookModal } from "@/components/profile/modals/add-book-modal";
import { EditBookModal } from "./modals/edit-book-modal";
import { OnboardingBookSearch } from "@/components/profile/onboarding-book-search";
import { StatsSection } from "./sections/stats-section";
import { ProfileInfoSection } from "./sections/profile-info-section";
import { TransactionHistory } from "./sections/transactions-history";
import { OfferedBooksSection } from "./sections/offered-books-section";
import { WishlistSection } from "./sections/wishlist-section";
import { OnboardingModal } from "./modals/onboarding-modal";
import { DeleteConfirmModal } from "./modals/delete-confirm-modal";
import { useProfileData } from "./hooks/useProfileData";
import { useOnboarding } from "./hooks/useOnboarding";
import { Package, DollarSign, User, TrendingUp, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { useTranslations } from "next-intl";
import { PromotedBooksSection } from "./sections/promoted-books-section";
import { PointsHistorySection } from "./sections/points-history-section";
import { HistorySection } from "./sections/history-section";

interface BookBase {
  id: string;
  title: string;
  author?: string;
  image?: string;
  createdAt: string;
  status?: "active" | "inactive";
}

interface Book extends BookBase {
  status: "active" | "inactive";
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
  offeredBooks?: {
    _id: string;
    title: string;
    author?: string;
    imageUrl?: string;
    createdAt: string;
    status: string;
  }[];
  github?: string;
  twitter?: string;
  linkedin?: string;
  points?: number;
}

interface UserProfile {
  username: string;
  email: string;
  phone: string;
  location: string;
  avatar: string;
  bio: string;
  github?: string;
  twitter?: string;
  website?: string;
}

interface Transaction {
  id: string;
  product: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "cancelled";
  buyer: string;
}

interface PromotedBook {
  _id: string;
  title: string;
  author?: string;
  imageUrl?: string;
  condition: string;
  owner: {
    username: string;
    email: string;
    location?: string;
    profileImage?: string;
  };
  promotedUntil: string;
}

interface TransactionFromAPI {
  _id: string;
  initiator: {
    email: string;
    username?: string;
  };
  receiver: {
    email: string;
    username?: string;
  };
  requestedBook?: {
    title: string;
  };
  offeredBooks?: unknown[];
  createdAt: string;
  status: string;
}

interface ProfileDashboardProps {
  userData: UserData | null;
  promotedBooks: PromotedBook[];
}

export function ProfileDashboard({
  userData,
  promotedBooks,
}: ProfileDashboardProps) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [isEditBookModalOpen, setIsEditBookModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedBookToDelete, setSelectedBookToDelete] = useState<Book | null>(
    null
  );
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [modalType, setModalType] = useState<"offered" | "wishlist">("offered");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const t = useTranslations("profile");

  const {
    userData: fetchedUserData,
    books,
    wishlistBooks,
    onUpdate: fetchData,
  } = useProfileData();
  const {
    selectedGenres,
    selectedBooks,
    handleGenreChange,
    handleAddBook,
    handleOnboardingSubmit,
    handleOnboardingSkip,
  } = useOnboarding(fetchedUserData, fetchData);

  const currentUserData = fetchedUserData || userData;
  const userPoints = currentUserData?.points || 0;

  const genres = [
    "Fantasy",
    "Science Fiction",
    t("crime"),
    "Thriller",
    "Horror",
    t("romance"),
    t("contemporaryFiction"),
    t("historicalFiction"),
    t("adventure"),
    t("biography"),
    t("nonFiction"),
    t("essay"),
    t("memoir"),
    t("youngAdult"),
    t("journalism"),
  ];

  const profile = useMemo(
    () => ({
      username: currentUserData?.username || "",
      email: currentUserData?.email || "",
      phone: currentUserData?.phone || "",
      location: currentUserData?.location || "",
      avatar: currentUserData?.profileImage || "",
      bio: currentUserData?.bio || "",
      github: currentUserData?.github || "",
      twitter: currentUserData?.twitter || "",
      website: currentUserData?.website || "",
    }),
    [currentUserData]
  );

  const isOnboardingOpen = useMemo(
    () => !!(currentUserData && !currentUserData.hasCompletedOnboarding),
    [currentUserData]
  );

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch("/api/transactions/user");
        const data: TransactionFromAPI[] = await res.json();

        // mapowanie transakcji z API na uzywany format
        const mappedTransactions = data.map((transaction) => {
          const isInitiator =
            transaction.initiator.email === currentUserData?.email;
          const otherUser = isInitiator
            ? transaction.receiver
            : transaction.initiator;

          return {
            id: transaction._id,
            product: transaction.requestedBook?.title || t("unknownBook"),
            amount: transaction.offeredBooks?.length || 0,
            date: new Date(transaction.createdAt).toLocaleDateString("pl-PL"),
            status: transaction.status,
            buyer: otherUser.username || otherUser.email,
          };
        });

        setTransactions(mappedTransactions);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };

    if (currentUserData?.email) {
      fetchTransactions();
    }
  }, [currentUserData?.email]);

  useEffect(() => {
    const fetchPromotedBooks = async () => {
      try {
        const res = await fetch("/api/user/promoted-books");
        const data = await res.json();
        if (data.active) {
        }
      } catch (error) {
        console.error("Error fetching promoted books:", error);
      }
    };

    if (currentUserData?.email) {
      fetchPromotedBooks();
    }
  }, [currentUserData?.email]);

  const totalBooksOffered = books.length;
  const totalExchanges = transactions.filter(
    (t) => t.status === "completed"
  ).length;
  const newUsersThisMonth = 12;
  const booksExchangedUser = books.length;
  const averageRatingUser = currentUserData?.averageRating || 0;
  const booksInWishlistUser = wishlistBooks.length;
  const pendingExchanges = transactions.filter(
    (t) => t.status === "pending"
  ).length;
  const averageExchangeTime = "2.5 days";
  const wishlistMatches = 8;

  const platformStats = [
    { title: t("totalBooksOffered"), value: totalBooksOffered, icon: Package },
    { title: t("totalExchanges"), value: totalExchanges, icon: DollarSign },
    { title: t("newUsersThisMonth"), value: newUsersThisMonth, icon: User },
  ];

  const userStats = [
    { title: t("booksExchanged"), value: booksExchangedUser, icon: Package },
    {
      title: t("averageRating"),
      value: `${averageRatingUser}/5`,
      icon: TrendingUp,
    },
    { title: t("booksInWishlist"), value: booksInWishlistUser, icon: Edit },
  ];

  const activityStats = [
    { title: t("pendingExchanges"), value: pendingExchanges, icon: DollarSign },
    {
      title: t("averageExchangeTime"),
      value: averageExchangeTime,
      icon: TrendingUp,
    },
    { title: t("wishlistMatches"), value: wishlistMatches, icon: Edit },
  ];

  const handleProfileUpdate = async (updatedProfile: UserProfile) => {
    const formData = new FormData();
    formData.append("username", updatedProfile.username);
    formData.append("email", updatedProfile.email);
    formData.append("phone", updatedProfile.phone);
    formData.append("location", updatedProfile.location);
    formData.append("bio", updatedProfile.bio);
    formData.append("github", updatedProfile.github || "");
    formData.append("twitter", updatedProfile.twitter || "");
    formData.append("website", updatedProfile.website || "");
    if (updatedProfile.avatar instanceof File) {
      formData.append("avatar", updatedProfile.avatar);
    } else {
      formData.append("avatar", updatedProfile.avatar);
    }

    await fetch("/api/user/profile", {
      method: "PUT",
      body: formData,
    });
    fetchData();
  };

  const handleEditBook = (book: Book) => {
    setSelectedBook(book);
    setIsEditBookModalOpen(true);
  };

  const handleDeleteBook = (bookId: string) => {
    const book = books.find((b) => b.id === bookId);
    if (book) {
      setSelectedBookToDelete(book);
      setIsDeleteConfirmOpen(true);
    }
  };

  const handleUpdateBook = async () => {
    fetchData();
  };

  const handleDeleteWishlistBook = (bookId: string) => {
    const book = wishlistBooks.find((b) => b.id === bookId);
    if (book) {
      setSelectedBookToDelete(book);
      setIsDeleteConfirmOpen(true);
    }
  };

  const confirmDeleteBook = async () => {
    if (selectedBookToDelete) {
      const isOffered = books.some((b) => b.id === selectedBookToDelete.id);
      const endpoint = isOffered
        ? "/api/user/offered-books"
        : "/api/user/wishlist";

      try {
        const response = await fetch(endpoint, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId: selectedBookToDelete.id }),
        });

        const data = await response.json();

        if (!response.ok) {
          setErrorMessage(data.error || t("failedToDeleteBook"));
          setIsDeleteConfirmOpen(false);
          setSelectedBookToDelete(null);
          return;
        }

        fetchData();
        setIsDeleteConfirmOpen(false);
        setSelectedBookToDelete(null);
      } catch (error) {
        console.error("Error deleting book:", error);
        setErrorMessage(t("unexpectedErrorOccurred"));
        setIsDeleteConfirmOpen(false);
        setSelectedBookToDelete(null);
      }
    }
  };

  const handlePromoteBook = async (bookId: string) => {
    try {
      const res = await fetch("/api/books/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to promote book");
        return;
      }

      alert("Book promoted successfully!");
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error("Error promoting book:", error);
      alert("Failed to promote book");
    }
  };

  const handleExtendPromotion = async (bookId: string) => {
    try {
      const res = await fetch("/api/books/extend-promotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to extend promotion");
        return;
      }

      alert("Promotion extended successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error extending promotion:", error);
      alert("Failed to extend promotion");
    }
  };

  const handleCancelPromotion = async (bookId: string) => {
    if (
      !confirm("Cancel promotion? You'll get a refund only if cancelled today.")
    ) {
      return;
    }

    try {
      const res = await fetch("/api/books/cancel-promotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to cancel promotion");
        return;
      }

      alert(`Promotion cancelled! Refunded ${data.refundedPoints} points.`);
      window.location.reload();
    } catch (error) {
      console.error("Error cancelling promotion:", error);
      alert("Failed to cancel promotion");
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">
          {t("hello")}, {currentUserData?.username || t("you")}!
        </h1>
        <p className="text-muted-foreground text-pretty">{t("subtitle")}</p>
      </div>

      <StatsSection
        platformStats={platformStats}
        userStats={userStats}
        activityStats={activityStats}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <ProfileInfoSection
          profileData={profile}
          onEditProfile={() => setIsProfileModalOpen(true)}
          isPublicView={false}
        />

        <HistorySection userEmail={currentUserData?.email} />
      </div>

      <OfferedBooksSection
        books={books as never[]}
        onAddBook={() => {
          setModalType("offered");
          setIsAddBookModalOpen(true);
        }}
        onEditBook={handleEditBook}
        onDeleteBook={handleDeleteBook}
        onPromote={handlePromoteBook}
        userPoints={userPoints}
      />

      <PromotedBooksSection
        books={promotedBooks as never[]}
        userPoints={userPoints}
        onExtend={handleExtendPromotion}
        onCancel={handleCancelPromotion}
      />

      <WishlistSection
        wishlist={wishlistBooks}
        onRemoveFromWishlist={handleDeleteWishlistBook}
        onAddToWishlist={() => {
          setModalType("wishlist");
          setIsAddBookModalOpen(true);
        }}
        isPublicView={false}
      />

      <EditProfileModal
        profile={profile}
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
        onSave={handleProfileUpdate}
      />
      <AddBookModal
        open={isAddBookModalOpen}
        onOpenChange={setIsAddBookModalOpen}
        onSave={fetchData}
        type={modalType}
      />
      <EditBookModal
        book={selectedBook}
        open={isEditBookModalOpen}
        onOpenChange={setIsEditBookModalOpen}
        onSave={handleUpdateBook}
      />

      <DeleteConfirmModal
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        bookTitle={selectedBookToDelete?.title || ""}
        onConfirm={confirmDeleteBook}
      />

      <OnboardingModal
        open={isOnboardingOpen}
        onOpenChange={() => {}}
        genres={genres}
        selectedGenres={selectedGenres}
        selectedBooks={selectedBooks}
        onGenreChange={handleGenreChange}
        onAddBook={() => setIsAddBookOpen(true)}
        onSubmit={handleOnboardingSubmit}
        onSkip={handleOnboardingSkip}
      />

      <OnboardingBookSearch
        open={isAddBookOpen}
        onOpenChange={setIsAddBookOpen}
        onSelectBook={handleAddBook}
      />

      {errorMessage && (
        <Dialog
          open={!!errorMessage}
          onOpenChange={() => setErrorMessage(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("cannotDeleteBook")}</DialogTitle>
              <DialogDescription className="text-destructive">
                {errorMessage}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setErrorMessage(null)}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
