"use client";

import { useState, useEffect, useMemo } from "react";

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
    isActive?: boolean;
    condition?: "new" | "used" | "damaged";
    ownerNote?: string;
  }[];
}

interface BookBase {
  id: string;
  title: string;
  author?: string;
  image?: string;
  createdAt: string;
}

interface Book extends BookBase {
  status: "active" | "inactive";
  condition?: "new" | "used" | "damaged";
  ownerNote?: string;
}

export function useProfileData() {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchData();
  }, []);

  const books = useMemo(() => {
    if (userData?.offeredBooks) {
      return userData.offeredBooks.map((book) => ({
        id: book._id,
        _id: book._id,
        title: book.title,
        author: book.author,
        image: book.imageUrl,
        imageUrl: book.imageUrl,
        createdAt: new Date(book.createdAt).toISOString(),
        status: (book.isActive !== undefined
          ? book.isActive
            ? "active"
            : "inactive"
          : book.status === "available"
            ? "active"
            : "inactive") as "active" | "inactive",
        condition: book.condition,
        ownerNote: book.ownerNote,
      })) as Book[];
    }
    return [];
  }, [userData]);

  const wishlistBooks = useMemo(() => {
    if (userData?.wishlist) {
      return userData.wishlist.map((book) => ({
        id: book._id,
        title: book.title,
        author: book.author,
        image: book.imageUrl,
        createdAt: new Date(book.createdAt).toISOString(),
      })) as BookBase[];
    }
    return [];
  }, [userData]);

  const onUpdate = () => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchData();
  };

  return { userData, books, wishlistBooks, onUpdate };
}
