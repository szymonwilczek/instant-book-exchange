"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/context/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ExchangeSection } from "@/components/checkout/exchange-section";

interface BookData {
  _id: string;
  title: string;
  author: string;
  imageUrl?: string;
  owner: {
    _id: string;
    username: string;
    email: string;
  };
}

interface ExchangeData {
  requestedBook: BookData;
  requestedBookId: string;
  offeredBooks: BookData[];
  offeredBookIds?: string[];
  exchangeLocation: string;
  deliveryMethod: string;
}

export default function CheckoutPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const [userBooks, setUserBooks] = useState<BookData[]>([]);
  const [exchanges, setExchanges] = useState<ExchangeData[]>([]);
  const [globalLocation, setGlobalLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState("");

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }

    if (cart.length === 0) {
      router.push("/");
      return;
    }

    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data: { offeredBooks?: BookData[]; location?: string }) => {
        setUserBooks(data.offeredBooks || []);
        setUserLocation(data.location || "");
        setGlobalLocation(data.location || "");
      });

    const initialExchanges: ExchangeData[] = cart.map((item) => ({
      requestedBook: item.book,
      requestedBookId: item.book._id,
      offeredBooks: [],
      exchangeLocation: "",
      deliveryMethod: "personal",
    }));
    setExchanges(initialExchanges);
  }, [session, cart, router]);

  const handleOfferedBooksChange = (index: number, books: BookData[]) => {
    const updated = [...exchanges];
    updated[index].offeredBooks = books;
    updated[index].offeredBookIds = books.map((b) => b._id);
    setExchanges(updated);
  };

  const handleLocationChange = (index: number, location: string) => {
    const updated = [...exchanges];
    updated[index].exchangeLocation = location;
    setExchanges(updated);
  };

  const handleDeliveryMethodChange = (index: number, method: string) => {
    const updated = [...exchanges];
    updated[index].deliveryMethod = method;
    setExchanges(updated);
  };

  const applyGlobalLocation = () => {
    const updated = exchanges.map((ex) => ({
      ...ex,
      exchangeLocation: globalLocation,
    }));
    setExchanges(updated);
  };

  const handleSubmit = async () => {
    const invalid = exchanges.find((ex) => !ex.exchangeLocation);
    if (invalid) {
      alert("Please fill in the exchange location for all books");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exchanges }),
      });

      if (!res.ok) {
        throw new Error("Failed to create transactions");
      }

      clearCart();
      router.push("/transactions?success=true");
    } catch (error) {
      console.error("Checkout error:", error);
      alert("An error occurred while submitting offers");
    } finally {
      setLoading(false);
    }
  };

  if (!session || cart.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mb-2">Books Exchange</h1>
        <p className="text-muted-foreground">
          Drag your books to the exchange area or leave it blank if you
          don&apos;t want to offer books in exchange.
        </p>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="globalLocation" className="mb-1">
              Exchange location (apply to all)
            </Label>
            <Input
              id="globalLocation"
              value={globalLocation}
              onChange={(e) => setGlobalLocation(e.target.value)}
              placeholder={userLocation || "np. Warszawa, Kraków..."}
              className="mt-1"
            />
          </div>
          <Button onClick={applyGlobalLocation} variant="outline">
            Apply to all
          </Button>
        </div>
      </Card>

      <div className="space-y-6">
        {exchanges.map((exchange, index) => (
          <ExchangeSection
            key={index}
            requestedBook={exchange.requestedBook}
            userBooks={userBooks}
            offeredBooks={exchange.offeredBooks}
            exchangeLocation={exchange.exchangeLocation}
            deliveryMethod={exchange.deliveryMethod}
            onOfferedBooksChange={(books) =>
              handleOfferedBooksChange(index, books)
            }
            onLocationChange={(location) =>
              handleLocationChange(index, location)
            }
            onDeliveryMethodChange={(method) =>
              handleDeliveryMethodChange(index, method)
            }
          />
        ))}
      </div>

      <Card className="p-6 mt-6 sticky bottom-4 bg-background/95 backdrop-blur">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">Summary</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Exchange offers: {exchanges.length}</p>
              <p>
                Offered books:{" "}
                {exchanges.reduce((acc, ex) => acc + ex.offeredBooks.length, 0)}
              </p>
            </div>
          </div>
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full md:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting offers...
              </>
            ) : (
              "Submit offers"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
