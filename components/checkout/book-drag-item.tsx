import { Card } from "@/components/ui/card";
import Image from "next/image";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function BookDragItem({ book }: { book: any }) {
  return (
    <Card className="p-3 opacity-80 shadow-lg rotate-3 cursor-grabbing">
      <div className="flex gap-3">
        <Image
          width={150}
          height={200}
          src={book.imageUrl || "/placeholder-book.png"}
          alt={book.title}
          className="w-12 h-16 object-cover rounded"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm line-clamp-2">{book.title}</h4>
          <p className="text-xs text-muted-foreground">{book.author}</p>
        </div>
      </div>
    </Card>
  );
}
