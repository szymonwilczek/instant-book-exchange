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

interface SearchBook {
  id: string;
  title: string;
  author?: string;
  description?: string;
  image?: string;
  isbn?: string;
  source: "local" | "google";
}

interface AddBookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void; // tylko odswiezenie = bez parametrow
}

interface BookBase {
  id: string;
  title: string;
  author?: string;
  description?: string;
  image?: string;
  isbn?: string;
}

export function AddBookModal({
  open,
  onOpenChange,
  onSave,
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
  });
  const [searchType, setSearchType] = useState<"general" | "title" | "author">(
    "general"
  );
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // wyszukiwanie ksiazek (local kolekcja + Google Books)
   useEffect(() => {
    const updateResults = async () => {
      if (debouncedQuery.length <= 2) {
        setSearchResults([]);
        return;
      }

      try {
        // priorytet: local kolekcja (Book)
        const localResponse = await fetch(
          `/api/books/search?q=${encodeURIComponent(debouncedQuery)}`
        );
        const localBooks = localResponse.ok ? await localResponse.json() : [];

        // potem Google Books
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

        // polaczenie wynikow
        const combined = [
          ...localBooks.map((b: BookBase) => ({ ...b, source: "local" as const })),
          ...googleBooks.map((b: BookBase) => ({ ...b, source: "google" as const })),
        ];
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
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isCreating || (selectedBook && selectedBook.source === "google")) {
        await fetch("/api/user/offered-books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            author: formData.author,
            description: formData.description,
            imageUrl: formData.image,
            isbn: formData.isbn,
          }),
        });
      } else if (selectedBook && selectedBook.source === "local") {
        await fetch("/api/user/offered-books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId: selectedBook.id }),
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
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? "Create New Book" : "Add Book"}
          </DialogTitle>
          <DialogDescription>
            {isCreating
              ? "Create a new book entry that will be added to our database."
              : "Search for a book to add to your offered list."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {!isCreating ? (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="searchType" className="text-right">
                    Search by
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
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="author">Author</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="search" className="text-right">
                    Search Book
                  </Label>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="col-span-3 justify-between"
                      >
                        {selectedBook ? selectedBook.title : "Select book..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search books..."
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />
                        <CommandList>
                          <CommandEmpty>No books found.</CommandEmpty>
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
                                  <img
                                    src={book.image || "/placeholder.svg"}
                                    alt={book.title}
                                    className="w-8 h-8 object-cover"
                                  />
                                  <div>
                                    <p className="font-medium">{book.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {book.author} •{" "}
                                      {book.source === "local"
                                        ? "Our Collection"
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
                    I don&apos;t see my book here
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
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
                    Author
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
                    Description
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
                    Image URL
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
          </div>
          <DialogFooter>
            {isCreating && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreating(false)}
              >
                Back to Search
              </Button>
            )}
            <Button type="submit" disabled={!selectedBook && !isCreating}>
              {isCreating ? "Create & Add Book" : "Add Book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
