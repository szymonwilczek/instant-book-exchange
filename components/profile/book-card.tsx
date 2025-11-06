import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface BookBase {
  id: string;
  title: string;
  author?: string;
  image?: string;
  createdAt?: string;
  status?: t | "inactive";
}

interface BookCardProps {
  book: BookBase;
  isReadOnly?: boolean;
  onEdit?: (book: BookBase) => void;
  onDelete?: (bookId: string) => void;
}

export function BookCard({
  book,
  isReadOnly,
  onEdit,
  onDelete,
}: BookCardProps) {
  const formatDate = (date: string) => new Date(date).toLocaleDateString();
  const t = useTranslations("profile");

  return (
    <Card className="overflow-hidden min-w-[200px] h-full">
      <div className="aspect-square relative max-h-36">
        <Image
          width={200}
          height={200}
          src={book.image || "/placeholder.svg"}
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
        </CardContent>
      )}
    </Card>
  );
}
