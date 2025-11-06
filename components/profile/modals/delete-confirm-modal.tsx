"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookTitle: string;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  bookTitle,
  onConfirm,
}: DeleteConfirmModalProps) {
  const t = useTranslations("profile");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("confirmDeletion")}</DialogTitle>
          <DialogDescription>{t("confirmDeletionSubtitle")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancelButton")}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {t("bookDelete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
