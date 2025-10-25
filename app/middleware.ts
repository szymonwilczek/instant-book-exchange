import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // TODO
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = { matcher: ['/profile', '/search'] };
