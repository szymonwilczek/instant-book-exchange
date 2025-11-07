"use client";

import { useDailyLogin } from "@/lib/hooks/useDailyLogin";

export function DailyLoginTracker() {
  useDailyLogin();
  return null;
}
