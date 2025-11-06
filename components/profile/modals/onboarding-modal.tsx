"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BookCard } from "../book-card";
import { useTranslations } from "next-intl";

interface BookBase {
  id: string;
  title: string;
  author?: string;
  image?: string;
  createdAt: string;
}

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  genres: string[];
  selectedGenres: string[];
  selectedBooks: BookBase[];
  onGenreChange: (genre: string, checked: boolean) => void;
  onAddBook: () => void;
  onSubmit: () => void;
  onSkip: () => void;
}

export function OnboardingModal({
  open,
  onOpenChange,
  genres,
  selectedGenres,
  selectedBooks,
  onGenreChange,
  onAddBook,
  onSubmit,
  onSkip,
}: OnboardingModalProps) {
  const t = useTranslations("profile");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("onBoardingTitle")}</DialogTitle>
          <DialogDescription>{t("onBoardingSubtitle")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("favouriteGenres")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {genres.map((genre) => (
                  <div key={genre} className="flex items-center space-x-2">
                    <Checkbox
                      id={genre}
                      checked={selectedGenres.includes(genre)}
                      onCheckedChange={(checked) =>
                        onGenreChange(genre, checked as boolean)
                      }
                    />
                    <Label htmlFor={genre}>{genre}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("booksYouWantToReceive")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={onAddBook}>Dodaj książkę</Button>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {selectedBooks.map((book) => (
                  <BookCard key={book.id} book={book} isReadOnly={true} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <DialogFooter>
          <Button variant="link" onClick={onSkip}>
            {t("skipButton")}
          </Button>
          <Button onClick={onSubmit} disabled={selectedGenres.length === 0}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
