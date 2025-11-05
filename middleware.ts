import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // wszystkie sciezki OPROCZ tych ktore zaczynaja sie od:
  matcher: [
    // wszystkie pathname OPROCZ
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
