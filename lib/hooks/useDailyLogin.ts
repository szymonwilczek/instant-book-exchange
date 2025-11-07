import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function useDailyLogin() {
  const { data: session } = useSession();
  const [loginRecorded, setLoginRecorded] = useState(false);

  useEffect(() => {
    if (session && !loginRecorded) {
      // localStorage czy juz sie logowal dzisiaj
      const lastLogin = localStorage.getItem("lastDailyLogin");
      const today = new Date().toDateString();

      if (lastLogin !== today) {
        // zapisanie codziennego logowania
        fetch("/api/user/daily-login", {
          method: "POST",
        })
          .then((res) => res.json())
          .then((data) => {
            if (!data.alreadyLogged) {
              localStorage.setItem("lastDailyLogin", today);
              setLoginRecorded(true);

              //TODO: toast z informacja zamiast console loga
              console.log(
                `+${data.pointsEarned} points! Streak: ${data.streak} days`
              );
            }
          })
          .catch(console.error);
      }
    }
  }, [session, loginRecorded]);

  return loginRecorded;
}
