import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ListingCard } from "./listing-card";
import { Badge } from "../ui/badge";
import { useTranslations } from "next-intl";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ListingsProps {
  books: any[];
  sortBy: string;
  setSortBy: (sort: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
}

export function Listings({
  books,
  sortBy,
  setSortBy,
  currentPage,
  setCurrentPage,
  totalPages,
}: ListingsProps) {
  const t = useTranslations("listings");
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          {t("title")}
          <Badge variant="secondary">{books.length}</Badge>
        </h2>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">{t("date")}</SelectItem>
            <SelectItem value="popularity">{t("popularity")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("noBooksAvailable")}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {books.map((book) => (
              <ListingCard key={book._id} book={book} owner={book.owner} />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      currentPage > 1 && setCurrentPage(currentPage - 1)
                    }
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      currentPage < totalPages &&
                      setCurrentPage(currentPage + 1)
                    }
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
