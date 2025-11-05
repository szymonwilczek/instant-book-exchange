"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { SearchBar } from "@/components/home/search-bar";
import { Filters } from "@/components/home/filters";
import { MatchSection } from "@/components/home/match-section";
import { Listings } from "@/components/home/listings";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    genres: [],
    conditions: [],
    locations: [],
    dateRange: "",
  });
  const [sortBy, setSortBy] = useState("date");
  const [currentPage, setCurrentPage] = useState(1);
  const [matches, setMatches] = useState([]);
  const [books, setBooks] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const t = useTranslations();

  const itemsPerPage = 10;

  // pobieranie matches (wishlista)
  useEffect(() => {
    if (session) {
      fetch("/api/matches")
        .then((res) => res.json())
        .then(setMatches)
        .catch(console.error);
    }
  }, [session]);

  // pobieranie ksiazek z api
  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          sortBy,
        });

        if (searchQuery) params.append("search", searchQuery);
        if (filters.genres.length > 0)
          params.append("genres", filters.genres.join(","));
        if (filters.conditions.length > 0)
          params.append("conditions", filters.conditions.join(","));
        if (filters.locations.length > 0)
          params.append("locations", filters.locations.join(","));
        if (filters.dateRange) params.append("dateRange", filters.dateRange);

        const res = await fetch(`/api/books/available?${params}`);
        const data = await res.json();

        setBooks(data.books || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [searchQuery, filters, sortBy, currentPage]);

  return (
    <div className="container mx-auto p-4">
      <p>{t("test")}</p>
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        <div className="lg:col-span-1">
          <Filters filters={filters} setFilters={setFilters} />
        </div>
        <div className="lg:col-span-3">
          {session && matches.length > 0 && <MatchSection matches={matches} />}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <p className="text-muted-foreground">Ładowanie...</p>
            </div>
          ) : (
            <Listings
              books={books}
              sortBy={sortBy}
              setSortBy={setSortBy}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
            />
          )}
        </div>
      </div>
    </div>
  );
}
