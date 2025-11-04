"use client";

import { useState, useEffect, useMemo } from "react";
import { EditProfileModal } from "@/components/profile/modals/edit-profile-modal";
import { EditProductModal } from "@/components/profile/modals/edit-product-modal";
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
  userData: UserData;
  onUpdate: () => void;
}

export function ProfileDashboard({
  userData,
  onUpdate,
}: ProfileDashboardProps) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
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

  const genres = [
    "Fantasy",
    "Science Fiction",
    "Crime",
    "Thriller",
    "Horror",
    "Romance",
    "Contemporary Fiction",
    "Historical Fiction",
    "Adventure",
    "Biography",
    "Non-fiction",
    "Essay",
    "Memoir",
    "Young Adult",
    "Journalism",
  ];

  // Użyj useMemo dla derived state zamiast efektów
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
        const mappedTransactions = data.map((t) => {
          const isInitiator = t.initiator.email === currentUserData?.email;
          const otherUser = isInitiator ? t.receiver : t.initiator;

          return {
            id: t._id,
            product: t.requestedBook?.title || "Unknown Book",
            amount: t.offeredBooks?.length || 0,
            date: new Date(t.createdAt).toLocaleDateString("pl-PL"),
            status: t.status,
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
  const [currentPlatformIndex, setCurrentPlatformIndex] = useState(0);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const averageExchangeTime = "2.5 days";
  const wishlistMatches = 8;

  const platformStats = [
    { title: "Total Books Offered", value: totalBooksOffered, icon: Package },
    { title: "Total Exchanges", value: totalExchanges, icon: DollarSign },
    { title: "New Users This Month", value: newUsersThisMonth, icon: User },
  ];

  const userStats = [
    { title: "Books Exchanged", value: booksExchangedUser, icon: Package },
    {
      title: "Average Rating",
      value: `${averageRatingUser}/5`,
      icon: TrendingUp,
    },
    { title: "Books in Wishlist", value: booksInWishlistUser, icon: Edit },
  ];

  const activityStats = [
    { title: "Pending Exchanges", value: pendingExchanges, icon: DollarSign },
    {
      title: "Average Exchange Time",
      value: averageExchangeTime,
      icon: TrendingUp,
    },
    { title: "Wishlist Matches", value: wishlistMatches, icon: Edit },
  ];

  const [platformApi, setPlatformApi] = useState<CarouselApi>();
  const [userApi, setUserApi] = useState<CarouselApi>();
  const [activityApi, setActivityApi] = useState<CarouselApi>();

  useEffect(() => {
    if (platformApi) {
      const updateIndex = () =>
        setCurrentPlatformIndex(platformApi.selectedScrollSnap());
      updateIndex();
      platformApi.on("select", updateIndex);
      return () => platformApi.off("select", updateIndex);
    }
  }, [platformApi]);

  useEffect(() => {
    if (userApi) {
      const updateIndex = () =>
        setCurrentUserIndex(userApi.selectedScrollSnap());
      updateIndex();
      userApi.on("select", updateIndex);
      return () => userApi.off("select", updateIndex);
    }
  }, [userApi]);

  useEffect(() => {
    if (activityApi) {
      const updateIndex = () =>
        setCurrentActivityIndex(activityApi.selectedScrollSnap());
      updateIndex();
      activityApi.on("select", updateIndex);
      return () => activityApi.off("select", updateIndex);
    }
  }, [activityApi]);

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

  const handleProductUpdate = (updatedProduct: Book) => {};

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

  const handleUpdateBook = async (updatedBook: Book) => {
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
          setErrorMessage(data.error || "Failed to delete book");
          setIsDeleteConfirmOpen(false);
          setSelectedBookToDelete(null);
          return;
        }

        fetchData();
        setIsDeleteConfirmOpen(false);
        setSelectedBookToDelete(null);
      } catch (error) {
        console.error("Error deleting book:", error);
        setErrorMessage("An unexpected error occurred. Please try again.");
        setIsDeleteConfirmOpen(false);
        setSelectedBookToDelete(null);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "active":
        return "bg-accent text-accent-foreground";
      case "pending":
        return "bg-chart-5 text-primary-foreground";
      case "cancelled":
      case "inactive":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">
          Hello, {currentUserData?.username || "You!"}!
        </h1>
        <p className="text-muted-foreground text-pretty">
          Manage your profile, track transactions, and monitor your books
        </p>
      </div>

      <StatsSection
        platformStats={platformStats}
        userStats={userStats}
        activityStats={activityStats}
        onPlatformApiChange={setPlatformApi}
        onUserApiChange={setUserApi}
        onActivityApiChange={setActivityApi}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <ProfileInfoSection
          userData={currentUserData}
          profile={profile}
          onEditProfile={() => setIsProfileModalOpen(true)}
        />

        <TransactionHistory userEmail={currentUserData?.email} />
      </div>

      <OfferedBooksSection
        books={books}
        onAddBook={() => {
          setModalType("offered");
          setIsAddBookModalOpen(true);
        }}
        onEditBook={handleEditBook}
        onDeleteBook={handleDeleteBook}
      />

      <WishlistSection
        wishlistBooks={wishlistBooks}
        onDeleteWishlistBook={handleDeleteWishlistBook}
        onAddBook={() => {
          setModalType("wishlist");
          setIsAddBookModalOpen(true);
        }}
      />

      <EditProfileModal
        profile={profile}
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
        onSave={handleProfileUpdate}
      />
      {selectedBook && (
        <EditProductModal
          book={selectedBook}
          open={isProductModalOpen}
          onOpenChange={setIsProductModalOpen}
          onSave={handleProductUpdate}
        />
      )}
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
              <DialogTitle>Cannot Delete Book</DialogTitle>
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
