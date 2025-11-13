export function formatExchangeTime(
  averageDays: number,
  averageHours: number,
  t: (key: string) => string,
  locale: string,
): string {
  if (averageDays < 1) {
    if (locale === "pl") {
      if (averageHours === 1) {
        return `${averageHours} ${t("hour")}`;
      } else if (averageHours >= 2 && averageHours <= 4) {
        return `${averageHours} ${t("hours")}`;
      } else {
        return `${averageHours} ${t("hoursMany")}`;
      }
    } else {
      return `${averageHours} ${averageHours === 1 ? t("hour") : t("hours")}`;
    }
  } else {
    const days = averageDays.toFixed(1);
    if (locale === "pl") {
      const numDays = Math.floor(averageDays);
      if (numDays === 1) {
        return `${days} ${t("day")}`;
      } else if (numDays >= 2 && numDays <= 4) {
        return `${days} ${t("days")}`;
      } else {
        return `${days} ${t("daysMany")}`;
      }
    } else {
      return `${days} ${averageDays === 1 ? t("day") : t("days")}`;
    }
  }
}
