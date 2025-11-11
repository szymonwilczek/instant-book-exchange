"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Package, Truck, User } from "lucide-react";
import { BookInventory } from "@/components/checkout/book-inventory";
import { BookInventoryMobile } from "@/components/checkout/book-inventory-mobile";
import { ExchangeZone } from "@/components/checkout/exchange-zone";
import { OwnerInfo } from "@/components/checkout/owner-info";
import { BookDragItem } from "@/components/checkout/book-drag-item";
import { BookSelectionModal } from "@/components/checkout/book-selection-modal";
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ExchangeSectionProps {
  requestedBook: any;
  userBooks: any[];
  offeredBooks: any[];
  exchangeLocation: string;
  deliveryMethod: string;
  onOfferedBooksChange: (books: any[]) => void;
  onLocationChange: (location: string) => void;
  onDeliveryMethodChange: (method: string) => void;
}

export function ExchangeSection({
  requestedBook,
  userBooks,
  offeredBooks,
  exchangeLocation,
  deliveryMethod,
  onOfferedBooksChange,
  onLocationChange,
  onDeliveryMethodChange,
}: ExchangeSectionProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectionModalOpen, setSelectionModalOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const t = useTranslations("checkout");

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    if (over.id === "exchange-zone") {
      const bookId = active.id as string;
      const book = userBooks.find((b) => b._id === bookId);

      if (book && !offeredBooks.find((b) => b._id === bookId)) {
        onOfferedBooksChange([...offeredBooks, book]);
      }
    } else if (over.id === "inventory") {
      const bookId = active.id as string;
      onOfferedBooksChange(offeredBooks.filter((b) => b._id !== bookId));
    }
  };

  const handleRemoveFromExchange = (bookId: string) => {
    onOfferedBooksChange(offeredBooks.filter((b) => b._id !== bookId));
  };

  const handleConfirmSelection = (selectedBooks: any[]) => {
    onOfferedBooksChange(selectedBooks);
    setSelectionModalOpen(false);
  };

  const activeDragBook = activeId
    ? userBooks.find((b) => b._id === activeId) ||
      offeredBooks.find((b) => b._id === activeId)
    : null;

  return (
    <>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Card className={cn("p-4 md:p-6")}>
          <div
            className={cn(
              "grid gap-4 md:gap-6",
              isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"
            )}
          >
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5" />
                <h3 className="font-semibold">{t("yourBooks")}</h3>
                <Badge variant="secondary">{userBooks.length}</Badge>
              </div>

              {isMobile ? (
                <BookInventoryMobile
                  books={userBooks}
                  offeredBooks={offeredBooks}
                  onOpenSelectionModal={() => setSelectionModalOpen(true)}
                />
              ) : (
                <BookInventory books={userBooks} offeredBooks={offeredBooks} />
              )}
            </div>

            <div className="lg:col-span-1">
              <h3 className="font-semibold mb-4 text-center">
                {t("exchange")}
              </h3>
              <ExchangeZone
                requestedBook={requestedBook}
                offeredBooks={offeredBooks}
                onRemoveBook={handleRemoveFromExchange}
              />

              <div className="mt-4">
                <Label>{t("deliveryMethod")}*</Label>
                <RadioGroup
                  value={deliveryMethod}
                  onValueChange={onDeliveryMethodChange}
                  className="mt-2 space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="personal"
                      id={`personal-${requestedBook._id}`}
                    />
                    <Label
                      htmlFor={`personal-${requestedBook._id}`}
                      className="font-normal cursor-pointer flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      {t("personalPickup")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="paczkomat"
                      id={`paczkomat-${requestedBook._id}`}
                    />
                    <Label
                      htmlFor={`paczkomat-${requestedBook._id}`}
                      className="font-normal cursor-pointer flex items-center gap-2"
                    >
                      <Package className="h-4 w-4" />
                      {t("parcelLocker")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="courier"
                      id={`courier-${requestedBook._id}`}
                    />
                    <Label
                      htmlFor={`courier-${requestedBook._id}`}
                      className="font-normal cursor-pointer flex items-center gap-2"
                    >
                      <Truck className="h-4 w-4" />
                      {t("courier")}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="mt-4">
                <Label htmlFor={`location-${requestedBook._id}`}>
                  {deliveryMethod === "personal"
                    ? t("pickupLocation")
                    : deliveryMethod === "paczkomat"
                      ? t("parcelNumber")
                      : t("deliveryAddress")}
                  *
                </Label>
                <Input
                  id={`location-${requestedBook._id}`}
                  value={exchangeLocation}
                  onChange={(e) => onLocationChange(e.target.value)}
                  placeholder={
                    deliveryMethod === "personal"
                      ? "Gliwice, Silesian University of Technology"
                      : deliveryMethod === "paczkomat"
                        ? "RADZ01M"
                        : "ul. Antka Rozpylacza 1, Warszawa"
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div className="lg:col-span-1">
              <h3 className="font-semibold mb-4">{t("offeringUser")}</h3>
              <OwnerInfo owner={requestedBook.owner} />
            </div>
          </div>
        </Card>

        <DragOverlay>
          {activeDragBook ? <BookDragItem book={activeDragBook} /> : null}
        </DragOverlay>
      </DndContext>

      <BookSelectionModal
        open={selectionModalOpen}
        onOpenChange={setSelectionModalOpen}
        books={userBooks}
        selectedBooks={offeredBooks}
        onConfirm={handleConfirmSelection}
      />
    </>
  );
}
