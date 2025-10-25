'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
  if (status === 'unauthenticated') router.push('/login');
  if (session) {
    fetch('/api/transactions/user')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setTransactions)
      .catch(err => console.error('Fetch error:', err));
  }
}, [session, status, router]);

  if (status === 'loading') return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl mb-4">Moje Transakcje</h1>
      {transactions.map((t) => (
        <div key={t._id} className="border p-4 mb-2">
          <p>Status: {t.status}</p>
          <p>Oferowana: {t.offeredBook?.title}</p>
          <Link href={`/transaction/${t._id}`}>Zobacz szczegóły</Link>
        </div>
      ))}
    </div>
  );
}
