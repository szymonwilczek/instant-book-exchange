import { useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useTranslations } from "next-intl";

export function useAchievements(userId?: string) {
  const [checking, setChecking] = useState(false);
  const t = useTranslations();

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  const checkAchievements = async (event: string) => {
    if (checking) return;

    setChecking(true);
    try {
      const res = await fetch("/api/achievements/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, userId }),
      });

      if (!res.ok) throw new Error("Failed to check achievements");

      const data = await res.json();

      if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
        triggerConfetti();

        for (const achievement of data.newlyUnlocked) {
          toast(`🎉 ${t(achievement.nameKey)}`, {
            position: "top-center",
            description: `${achievement.icon} ${t(achievement.descriptionKey)} (+${achievement.points} points)`,
          });

          if (data.newlyUnlocked.length > 1) {
            await new Promise<void>((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      return data;
    } catch (error) {
      console.error("Error checking achievements:", error);
    } finally {
      setChecking(false);
    }
  };

  return { checkAchievements, checking };
}
