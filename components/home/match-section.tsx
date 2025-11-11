"use client";

import { Badge } from "@/components/ui/badge";
import { BookHeart } from "lucide-react";
import { ListingCard } from "./listing-card";
import { useTranslations } from "next-intl";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface MatchSectionProps {
  matches: any[];
}

export function MatchSection({ matches }: MatchSectionProps) {
  const t = useTranslations("listings.match");
  if (matches.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <BookHeart className="h-5 w-5 text-orange-500" />
        <h2 className="text-xl font-bold">{t("title")}</h2>
        <Badge variant="secondary">{matches.length}</Badge>
      </div>
      <div className="flex flex-col gap-4">
        {matches.slice(0, 5).map((match, idx) => {
          const book = match.offeredBook;
          const owner = match.owner;

          return (
            <div key={idx}>
              <ListingCard book={book} owner={owner} isMatch={true} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
