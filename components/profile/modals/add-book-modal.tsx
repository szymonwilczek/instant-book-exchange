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
  const [openCombobox, setOpenCombobox] = useState(false);
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
    setOpenCombobox(false);
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
    setOpenCombobox(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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
                            {searchResults.map((book, index) => (
                              <CommandItem
                                key={index}
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
                                    width={100}
                                    height={100}
                                    src={book.image || "/placeholder.svg"}
                                    alt={book.title}
                                    className="w-8 h-8 object-cover"
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
                      setFormData({ ...formData, description: e.target.value })
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
  );
}
