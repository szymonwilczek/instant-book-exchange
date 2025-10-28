"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import { EditProductModal } from "@/components/profile/edit-product-modal";
import { AddBookModal } from "@/components/profile/add-book-modal";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  DollarSign,
  TrendingUp,
  Edit,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { BookCard } from "@/components/profile/book-card";
import { EditBookModal } from "./edit-book-modal";

interface BookBase {
  id: string;
  title: string;
  author?: string;
  image?: string;
  createdAt: string;
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
  wishlist?: BookBase[];
  offeredBooks?: {
    _id: string;
    title: string;
    author?: string;
    imageUrl?: string;
    createdAt: string;
    status: string;
  }[];
}

interface UserProfile {
  username: string;
  email: string;
  phone: string;
  location: string;
  avatar: string;
  bio: string;
}

interface Transaction {
  id: string;
  product: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "cancelled";
  buyer: string;
}

interface Book {
  id: string;
  title: string;
  author?: string;
  image?: string;
  createdAt: string;
  status: "active" | "inactive";
}

interface ProfileDashboardProps {
  userData: UserData;
  onUpdate: () => void;
}

export function ProfileDashboard({
  userData,
  onUpdate,
}: ProfileDashboardProps) {
  const [profile, setProfile] = useState<UserProfile>({
    username: "",
    email: "",
    phone: "",
    location: "",
    avatar: "",
    bio: "",
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [isEditBookModalOpen, setIsEditBookModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedBookToDelete, setSelectedBookToDelete] = useState<Book | null>(
    null
  );

  useEffect(() => {
    if (userData) {
      setProfile({
        username: userData.username || "",
        email: userData.email || "",
        phone: userData.phone || "",
        location: userData.location || "",
        avatar: userData.profileImage || "",
        bio: userData.bio || "",
      });
    }
  }, [userData]);

  const [transactions] = useState<Transaction[]>([
    {
      id: "TXN001",
      product: "Wireless Headphones Pro",
      amount: 299.99,
      date: "2025-10-25",
      status: "completed",
      buyer: "John Smith",
    },
    {
      id: "TXN002",
      product: "Smart Watch Series 5",
      amount: 449.99,
      date: "2025-10-24",
      status: "completed",
      buyer: "Sarah Williams",
    },
    {
      id: "TXN003",
      product: "USB-C Hub Adapter",
      amount: 79.99,
      date: "2025-10-23",
      status: "pending",
      buyer: "Mike Davis",
    },
    {
      id: "TXN004",
      product: "Mechanical Keyboard",
      amount: 159.99,
      date: "2025-10-22",
      status: "completed",
      buyer: "Emma Brown",
    },
    {
      id: "TXN005",
      product: "Laptop Stand",
      amount: 49.99,
      date: "2025-10-21",
      status: "cancelled",
      buyer: "David Wilson",
    },
  ]);

  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    if (userData?.offeredBooks) {
      setBooks(
        userData.offeredBooks?.map((book) => ({
          id: book._id,
          title: book.title,
          author: book.author,
          image: book.imageUrl,
          createdAt: new Date(book.createdAt).toISOString(),
          status: book.status === "available" ? "active" : "inactive",
        })) || []
      );
    }
  }, [userData]);

  const totalBooksOffered = books.length; // mock: suma wszystkich offeredBooks (potem zmienic na query do bazy)
  const totalExchanges = transactions.filter(
    (t) => t.status === "completed"
  ).length;
  const newUsersThisMonth = 12; // mock: uzytkownicy z createdAt w tym miesiacu (query do bazy)
  const booksExchangedUser = books.length;
  const averageRatingUser = userData?.averageRating || 0;
  const booksInWishlistUser = userData?.wishlist?.length || 0;
  const pendingExchanges = transactions.filter(
    (t) => t.status === "pending"
  ).length;
  const averageExchangeTime = "2.5 days"; // mock: sredni czas wymiany (obliczenie z transakcji)
  const wishlistMatches = 8; // mock: dopasowania zyczen (query do bazy)

  const [currentPlatformIndex, setCurrentPlatformIndex] = useState(0);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);

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
    if (updatedProfile.avatar instanceof File) {
      formData.append("avatar", updatedProfile.avatar);
    } else {
      formData.append("avatar", updatedProfile.avatar);
    }

    await fetch("/api/user/profile", {
      method: "PUT",
      body: formData,
    });
    onUpdate();
  };

  const handleProductUpdate = (updatedProduct: Product) => {
    setProducts(
      products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
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

  const handleUpdateBook = async (updatedBook: Book) => {
    // TODO: dodac API do aktualizacji statusu ksiazki PUT /api/user/offered-books
    // na razie symulacja
    setBooks(books.map((b) => (b.id === updatedBook.id ? updatedBook : b)));
    onUpdate();
  };

  const confirmDeleteBook = async () => {
    if (selectedBookToDelete) {
      await fetch("/api/user/offered-books", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: selectedBookToDelete.id }),
      });
      onUpdate();
      setIsDeleteConfirmOpen(false);
      setSelectedBookToDelete(null);
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
          Hello, {userData?.username || "You!"}!
        </h1>
        <p className="text-muted-foreground text-pretty">
          Manage your profile, track transactions, and monitor your products
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Platform Stats
            </CardTitle>
            {(() => {
              const IconComponent = platformStats[currentPlatformIndex].icon;
              return (
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              );
            })()}
          </CardHeader>
          <CardContent>
            <Carousel
              className="w-full"
              opts={{ loop: true }}
              plugins={[Autoplay({ delay: 7500 })]}
              setApi={setPlatformApi}
            >
              <CarouselContent>
                {platformStats.map((stat, index) => (
                  <CarouselItem key={index}>
                    <div className="flex flex-col items-center justify-center p-4">
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground text-center">
                        {stat.title}
                      </p>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Stats</CardTitle>
            {(() => {
              const IconComponent = userStats[currentUserIndex].icon;
              return (
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              );
            })()}
          </CardHeader>
          <CardContent>
            <Carousel
              className="w-full"
              opts={{ loop: true }}
              plugins={[Autoplay({ delay: 7500 })]}
              setApi={setUserApi}
            >
              <CarouselContent>
                {userStats.map((stat, index) => (
                  <CarouselItem key={index}>
                    <div className="flex flex-col items-center justify-center p-4">
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground text-center">
                        {stat.title}
                      </p>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Activity Stats
            </CardTitle>
            {(() => {
              const IconComponent = activityStats[currentActivityIndex].icon;
              return (
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              );
            })()}
          </CardHeader>
          <CardContent>
            <Carousel
              className="w-full"
              opts={{ loop: true }}
              plugins={[Autoplay({ delay: 7500 })]}
              setApi={setActivityApi}
            >
              <CarouselContent>
                {activityStats.map((stat, index) => (
                  <CarouselItem key={index}>
                    <div className="flex flex-col items-center justify-center p-4">
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground text-center">
                        {stat.title}
                      </p>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsProfileModalOpen(true)}
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit profile</span>
              </Button>
            </div>
            <CardDescription>Your seller account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={profile.avatar || "/placeholder.svg"}
                  alt={profile.username}
                />
                <AvatarFallback>
                  {profile.username
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-xl font-semibold">{profile.username}</h3>
                <p className="text-sm text-muted-foreground">{profile.bio}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{profile.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{profile.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{profile.location}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Recent sales and order status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{transaction.product}</p>
                      <Badge
                        className={getStatusColor(transaction.status)}
                        variant="secondary"
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {transaction.buyer}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span>{transaction.date}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="text-foreground font-mono">
                        {transaction.id}
                      </span>
                    </div>
                  </div>
                  <div className="text-lg font-semibold">
                    ${transaction.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Offered Books</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddBookModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Book
            </Button>
          </div>
          <CardDescription>Manage your offered books</CardDescription>
        </CardHeader>
        <CardContent>
          <Carousel
            className="w-full"
            opts={{ loop: false }}
            plugins={[Autoplay({ delay: 7500 })]}
          >
            <CarouselContent>
              {books.map((book) => (
                <CarouselItem
                  key={book.id}
                  className="basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <BookCard
                    book={book}
                    onEdit={handleEditBook}
                    onDelete={handleDeleteBook}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        </CardContent>
      </Card>

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
        onSave={onUpdate}
      />
      <EditBookModal
        book={selectedBook}
        open={isEditBookModalOpen}
        onOpenChange={setIsEditBookModalOpen}
        onSave={handleUpdateBook}
      />

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;
              {selectedBookToDelete?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteBook}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
