import { Card, CardContent } from "@/components/ui/card";
import { ListingCard } from "./listing-card";
import { mockMatches } from "@/lib/data/mockData";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface MatchSectionProps {
  matches: any[];
}

export function MatchSection({ matches }: MatchSectionProps) {
  const displayMatches = matches.length > 0 ? matches : mockMatches;

  if (displayMatches.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6 text-center">
          <p>
            Przepraszamy, nie znaleźliśmy nic dla Ciebie w tej chwili. Sprawdź
            później!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-4">Twoje matche</h2>
      <div className="grid grid-cols-1 gap-4">
        {displayMatches.map((match, i) => (
          <div key={i} className="border-2 border-orange-500 rounded-xl ">
            <ListingCard book={match.offeredBook} owner={match.owner} />
          </div>
        ))}
      </div>
    </div>
  );
}
