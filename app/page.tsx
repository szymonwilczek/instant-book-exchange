"use client";
import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { SearchBar } from "@/components/home/search-bar";
import { Filters } from "@/components/home/filters";
import { MatchSection } from "@/components/home/match-section";
import { Listings } from "@/components/home/listings";
import { mockBooks } from "@/lib/data/mockData";

export default function HomePage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    genres: [],
    status: [],
    location: [],
    dateRange: "",
  });
  const [sortBy, setSortBy] = useState("date"); // 'date' | 'popularity'
  const [currentPage, setCurrentPage] = useState(1);
  const [matches, setMatches] = useState([]);
  const [now] = useState(() => Date.now());

  const itemsPerPage = 5;

  useEffect(() => {
    if (session) {
      fetch("/api/matches")
        .then((res) => res.json())
        .then(setMatches)
        .catch(console.error);
    }
  }, [session]);

  const filteredBooks = useMemo(() => {
    const books = mockBooks.filter((book) => {
      if (filters.dateRange) {
        const days = parseInt(filters.dateRange);
        const cutoff = new Date(now - days * 86400000);
        if (new Date(book.createdAt) < cutoff) return false;
      }
      return true;
    });

    return books;
  }, [searchQuery, filters, sortBy, now]);

  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="container mx-auto p-4">
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        <div className="lg:col-span-1">
          <Filters filters={filters} setFilters={setFilters} />
        </div>
        <div className="lg:col-span-3">
          {session && <MatchSection matches={matches} />}
          <Listings
            books={paginatedBooks}
            sortBy={sortBy}
            setSortBy={setSortBy}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={Math.ceil(filteredBooks.length / itemsPerPage)}
          />
        </div>
      </div>
    </div>
  );
}
