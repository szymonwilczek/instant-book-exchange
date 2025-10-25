'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import MatchList from '@/components/MatchList';
import Link from 'next/link';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/register');
  }, [status, router]);

  if (status === 'loading') return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl mb-4">Witaj w Instant Book Exchange, {session?.user?.name}!</h1>
      <Link href="/profile" className="text-blue-500">Zarządzaj Profilem</Link> | <Link href="/search" className="text-blue-500">Wyszukaj Książki</Link>
      <MatchList />
    </div>
  );
}
