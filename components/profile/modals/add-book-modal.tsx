"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface SearchBook {
  id: string;
  title: string;
  author?: string;
  description?: string;
  image?: string;
  isbn?: string;
  genres?: string[];
  source: "local" | "google";
}

interface AddBookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  type?: "offered" | "wishlist";
}

interface BookBase {
  id: string;
  title: string;
  author?: string;
  description?: string;
  image?: string;
  isbn?: string;
  genres?: string[];
}

export function AddBookModal({
  open,
  onOpenChange,
  onSave,
  type = "offered",
}: AddBookModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<SearchBook | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    image: "",
    isbn: "",
    condition: "used",
    ownerNote: "",
    genres: [] as string[],
  });
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
    const updateResults = async () => {
      if (debouncedQuery.length <= 2) {
        setSearchResults([]);
        return;
      }

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

        const seen = new Set<string>();
        const combined: SearchBook[] = [];

        googleBooks.forEach((b: BookBase) => {
          const id = b.isbn || `${b.title}-${b.author}`;
          if (!seen.has(id)) {
            seen.add(id);
            combined.push({
              ...b,
              source: "google" as const,
            });
          }
        });

        localBooks.forEach((b: BookBase) => {
          const id = b.isbn || `${b.title}-${b.author}`;
          if (!seen.has(id)) {
            seen.add(id);
            combined.push({
              ...b,
              source: "local" as const,
            });
          }
        });

        setSearchResults(combined);
      } catch (error) {
        console.error("Error fetching books:", error);
        setSearchResults([]);
      }
    };
    updateResults();
  }, [debouncedQuery, searchType]);

  const handleSelectBook = (book: SearchBook) => {
    setSelectedBook(book);
    setSearchQuery(book.title);
    setShowSearchResults(false);
    setFormData({
      title: book.title,
      author: book.author || "",
      description: book.description || "",
      image: book.image || "",
      isbn: book.isbn || "",
      condition: "used",
      ownerNote: "",
      genres: book.genres || [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint =
        type === "wishlist" ? "/api/user/wishlist" : "/api/user/offered-books";

      if (isCreating || (selectedBook && selectedBook.source === "google")) {
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            author: formData.author,
            description: formData.description,
            imageUrl: formData.image,
            isbn: formData.isbn,
            condition: formData.condition,
            ownerNote: formData.ownerNote,
            genres: formData.genres,
          }),
        });
      } else if (selectedBook && selectedBook.source === "local") {
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookId: selectedBook.id,
            condition: formData.condition,
            ownerNote: formData.ownerNote,
          }),
        });
      }
      onSave();
      resetModal();
    } catch (error) {
      console.error("Error adding book:", error);
    }
  };

  const resetModal = () => {
    setIsCreating(false);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedBook(null);
    setShowSearchResults(false);
    setFormData({
      title: "",
      author: "",
      description: "",
      image: "",
      isbn: "",
      condition: "used",
      ownerNote: "",
      genres: [],
    });
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[400px] max-sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? t("createNewBook") : t("addBook")}
            </DialogTitle>
            <DialogDescription>
              {isCreating ? t("creatingBookSubtitle") : t("addBookSubtitle")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {!isCreating ? (
                <>
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
                    <div className="col-span-3">
                      <Input
                        id="search"
                        placeholder={t("searchBook")}
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowSearchResults(true);
                        }}
                        onClick={() => setShowSearchResults(true)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setIsCreating(true)}
                    >
                      {t("dontSeeMyBook")}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                      {t("title")}
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="author" className="text-right">
                      {t("author")}
                    </Label>
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(e) =>
                        setFormData({ ...formData, author: e.target.value })
                      }
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="isbn" className="text-right">
                      ISBN
                    </Label>
                    <Input
                      id="isbn"
                      value={formData.isbn}
                      onChange={(e) =>
                        setFormData({ ...formData, isbn: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      {t("bookDescription")}
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="image" className="text-right">
                      {t("bookImageUrl")}
                    </Label>
                    <Input
                      id="image"
                      value={formData.image}
                      onChange={(e) =>
                        setFormData({ ...formData, image: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="condition" className="text-right">
                  {t("bookCondition")}
                </Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) =>
                    setFormData({ ...formData, condition: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">{t("new")}</SelectItem>
                    <SelectItem value="used">{t("used")}</SelectItem>
                    <SelectItem value="damaged">{t("damaged")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ownerNote" className="text-right">
                  {t("ownerNote")}
                </Label>
                <Textarea
                  id="ownerNote"
                  value={formData.ownerNote}
                  onChange={(e) =>
                    setFormData({ ...formData, ownerNote: e.target.value })
                  }
                  placeholder={t("ownerNotePlaceholder")}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              {isCreating && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                >
                  {t("backToSearch")}
                </Button>
              )}
              <Button type="submit" disabled={!selectedBook && !isCreating}>
                {isCreating ? t("createAndAddBook") : t("addBook")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showSearchResults} onOpenChange={setShowSearchResults}>
        <DialogContent className="max-w-md max-sm:max-w-xs max-h-[80vh]">
          <DialogHeader className="max-w-md max-sm:max-w-xs justify-center items-center">
            <DialogTitle className="max-w-md max-sm:max-w-xs justify-center items-center">
              {t("searchBook")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 max-h-[60vh] max-sm:max-w-[400px] sm:max-w-md max-sm:max-w-xs">
            <Input
              placeholder={t("searchBook")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="max-sm:max-w-[270px]"
            />
            <div className="overflow-y-auto flex-1">
              {searchResults.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t("noBooksFound")}
                </p>
              ) : (
                <div className="space-y-2 max-sm:max-w-[280px]">
                  {searchResults.map((book, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectBook(book)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                    >
                      <div className="flex-shrink-0">
                        <Image
                          width={50}
                          height={50}
                          src={book.image || "/placeholder.svg"}
                          alt={book.title}
                          className="w-12 h-12 max-sm:w-8 max-sm:h-8 object-cover rounded"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate max-sm:text-sm">
                          {book.title}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {book.author} •{" "}
                          {book.source === "local"
                            ? t("ourCollection")
                            : "Google Books"}
                        </p>
                      </div>
                      <Check className="h-5 w-5 flex-shrink-0 max-sm:hidden" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
