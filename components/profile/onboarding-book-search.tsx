"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Image from "next/image";
import { useTranslations } from "next-intl";

export interface SearchBook {
  id: string;
  title: string;
  author?: string;
  description?: string;
  image?: string;
  isbn?: string;
  genres?: string[];
  source: "local" | "google";
}

interface ApiBook {
  id: string;
  title: string;
  author?: string;
  image?: string;
  isbn?: string;
  genres?: string[];
}

interface OnboardingBookSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectBook: (book: SearchBook) => void;
}

export function OnboardingBookSearch({
  open,
  onOpenChange,
  onSelectBook,
}: OnboardingBookSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<SearchBook | null>(null);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [searchType, setSearchType] = useState<"general" | "title" | "author">(
    "general"
  );
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const t = useTranslations("profile");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchResults([]);

    if (debouncedQuery.length > 2) {
      const fetchBooks = async () => {
        try {
          const localResponse = await fetch(
            `/api/books/search?q=${encodeURIComponent(debouncedQuery)}`
          );
          const localBooks = localResponse.ok ? await localResponse.json() : [];

          const buildQuery = (q: string, type: string) => {
            switch (type) {
              case "author":
                return `inauthor:${q}`;
              case "title":
                return `intitle:${q}`;
              default:
                return q;
            }
          };

          const googleQuery = buildQuery(debouncedQuery, searchType);
          const googleResponse = await fetch(
            `/api/books/google-search?q=${encodeURIComponent(googleQuery)}`
          );
          const googleBooks = googleResponse.ok
            ? await googleResponse.json()
            : [];

          const combined = [
            ...localBooks.map((b: ApiBook) => ({
              ...b,
              source: "local" as const,
            })),
            ...googleBooks.map((b: ApiBook) => ({
              ...b,
              source: "google" as const,
            })),
          ];
          setSearchResults(combined);
        } catch (error) {
          console.error("Error fetching books:", error);
          setSearchResults([]);
        }
      };
      fetchBooks();
    }
  }, [debouncedQuery, searchType]);

  const handleSelectBook = (book: SearchBook) => {
    setSelectedBook(book);
    setSearchQuery(book.title);
    setOpenCombobox(false);
    onSelectBook(book);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("addBookToWishlist")}</DialogTitle>
          <DialogDescription>
            {t("addBookToWishlistSubtitle")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="searchType" className="text-right">
              {t("searchBy")}
            </Label>
            <Select
              value={searchType}
              onValueChange={(value) =>
                setSearchType(value as "general" | "title" | "author")
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">{t("general")}</SelectItem>
                <SelectItem value="title">{t("title")}</SelectItem>
                <SelectItem value="author">{t("author")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="search" className="text-right">
              {t("searchBook")}
            </Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="col-span-3 justify-between"
                >
                  {selectedBook ? selectedBook.title : t("selectBook")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput
                    placeholder={t("searchBook")}
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>{t("noBooksFound")}</CommandEmpty>
                    <CommandGroup>
                      {searchResults.map((book) => (
                        <CommandItem
                          key={book.id}
                          value={book.title}
                          onSelect={() => handleSelectBook(book)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedBook?.id === book.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex items-center gap-2">
                            <Image
                              src={book.image || "/placeholder.svg"}
                              alt={book.title}
                              className="w-8 h-8 object-cover"
                              width={150}
                              height={150}
                            />
                            <div>
                              <p className="font-medium">{book.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {book.author} •{" "}
                                {book.source === "local"
                                  ? t("ourCollection")
                                  : "Google Books"}
                              </p>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            {t("cancelButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
