"use client";

import { Badge } from "@/components/ui/badge";
import { BookHeart } from "lucide-react";
import { ListingCard } from "./listing-card";
import { useTranslations } from "next-intl";

interface MatchSectionProps {
  matches: {
    offeredBook: {
      _id: string;
      title: string;
      author?: string;
      imageUrl?: string;
      condition: string;
      status: string;
      ownerNotes?: string;
      description?: string;
      viewCount: number;
      promotedUntil?: string;
    };
    owner: {
      _id: string;
      username: string;
      email: string;
      location?: string;
      profileImage?: string;
    };
    matchScore: number;
    ownerTier?: string;
    ownerRank?: number;
  }[];
}

export function MatchSection({ matches }: MatchSectionProps) {
  const t = useTranslations("listings.match");
  if (matches.length === 0) return null;

  // Platinum+ matches
  const premiumMatches = matches.filter((m) => {
    const tier = m.ownerTier;
    return tier === "platinum" || tier === "diamond" || tier === "legendary";
  }).length;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <BookHeart className="h-5 w-5 text-orange-500" />
        <h2 className="text-xl font-bold">{t("title")}</h2>
        <Badge variant="secondary">{matches.length}</Badge>
        {premiumMatches > 0 && (
          <Badge variant="default" className="bg-cyan-500">
            {premiumMatches} Premium
          </Badge>
        )}
      </div>
      <div className="flex flex-col gap-4">
        {matches.slice(0, 5).map((match, idx) => {
          const book = {
            ...match.offeredBook,
            author: match.offeredBook.author || "Unknown Author",
            condition: match.offeredBook.condition as "new" | "used" | "damaged",
          };
          const owner = match.owner;

          return (
            <div key={`match-${match.offeredBook._id}-${idx}`} className="relative">
              <ListingCard book={book} owner={owner} isMatch={true} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
