import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Coins } from "lucide-react";

interface BookBase {
  id: string;
  title: string;
  author?: string;
  image?: string;
  createdAt?: string;
  status?: "active" | "inactive";
  promotedUntil?: string;
  promotedAt?: string;
}

interface BookCardProps {
  book: BookBase;
  isReadOnly?: boolean;
  onEdit?: (book: BookBase) => void;
  onDelete?: (bookId: string) => void;
  onPromote?: (bookId: string) => void;
  onExtend?: (bookId: string) => void;
  onCancel?: (bookId: string) => void;
  userPoints?: number;
  showPromoteActions?: boolean;
}

export function BookCard({
  book,
  isReadOnly,
  onEdit,
  onDelete,
  onPromote,
  onExtend,
  onCancel,
  userPoints,
  showPromoteActions,
}: BookCardProps) {
  const formatDate = (date: string) => new Date(date).toLocaleDateString();
  const t = useTranslations("profile");

  const isPromoted =
    book.promotedUntil && new Date(book.promotedUntil) > new Date();
  const canPromote = userPoints && userPoints >= 100;
  const promotedSameDay =
    book.promotedAt &&
    new Date(book.promotedAt).toDateString() === new Date().toDateString();

  const daysRemaining = book.promotedUntil
    ? Math.ceil(
        (new Date(book.promotedUntil).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  console.log("BookCard book:", book);
  console.log(
    "BookCard status:",
    book.status,
    typeof book.status,
    book.status === "active"
  );

  return (
    <Card className="overflow-hidden min-w-[200px] h-full">
      <div className="aspect-square relative max-h-36">
        <Image
          width={200}
          height={200}
          src={book.image || "/placeholder-book.png"}
          alt={book.title}
          className="object-contain w-full h-full"
        />
        {book.status && (
          <div
            className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium text-white ${
              book.status === "active" ? "bg-green-500" : "bg-gray-500"
            }`}
          >
            {t(book.status === "active" ? "bookActive" : "bookInactive")}
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-center">
          {book.title}
        </CardTitle>
        <div className="flex justify-center">
          <p className="text-xs text-muted-foreground font-normal">
            {t("bookBy")}
          </p>
          <p className="ml-1 text-xs font-semibold">
            {book.author || "Unknown"}
          </p>
        </div>
        <br />
        {book.createdAt && (
          <div className="flex justify-center">
            <p className="text-xs text-muted-foreground font-normal">
              {t("bookAdded")}:
            </p>
            <p className="ml-1 text-xs font-semibold">
              {formatDate(book.createdAt)}
            </p>
          </div>
        )}
      </CardHeader>
      {!isReadOnly && (
        <CardContent className="pt-0">
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                onClick={() => onEdit(book)}
              >
                {t("bookEdit")}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 cursor-pointer hover:bg-red-500"
                onClick={() => onDelete(book.id)}
              >
                {t("bookDelete")}
              </Button>
            )}
          </div>

          {showPromoteActions && !isReadOnly && (
            <div className="flex w-full mt-2">
              {!isPromoted && onPromote && (
                <Button
                  variant="default"
                  size="sm"
                  className="w-full cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  onClick={() => onPromote(book.id)}
                  disabled={!canPromote}
                >
                  <Coins className="mr-2 h-4 w-4" />
                  Promote (100 pts)
                </Button>
              )}

              {isPromoted && (
                <div className="flex flex-col justify-center items-center space-y-2 w-full">
                  <div className="text-xs text-center text-muted-foreground w-full">
                    ⭐ Promoted for {daysRemaining} more days
                  </div>

                  {onExtend && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => onExtend(book.id)}
                      disabled={!canPromote}
                    >
                      Extend (100 pts)
                    </Button>
                  )}

                  {onCancel && promotedSameDay && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-red-600 hover:text-red-700"
                      onClick={() => onCancel(book.id)}
                    >
                      Cancel (refund 100 pts)
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
