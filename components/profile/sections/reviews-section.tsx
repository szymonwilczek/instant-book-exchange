import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useTranslations } from "next-intl";

interface Review {
  _id: string;
  reviewer: {
    _id: string;
    username: string;
    profileImage?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
  transactionId?: {
    createdAt: string;
  };
}

interface ReviewsSectionProps {
  reviews: Review[];
}

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  const t = useTranslations("reviews");
  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("reviewsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {t("noReviews")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t("reviewsTitle")} ({reviews.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review._id}
            className="border-b last:border-0 pb-4 last:pb-0"
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={review.reviewer.profileImage} />
                <AvatarFallback>
                  {review.reviewer.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{review.reviewer.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(review.createdAt), "d MMM yyyy", {
                        locale: pl,
                      })}
                    </p>
                  </div>

                  <Badge variant="outline" className="gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {review.rating.toFixed(1)}
                  </Badge>
                </div>

                {review.comment && <p className="text-sm">{review.comment}</p>}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
