'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import ReviewForm from '@/components/ReviewForm';

export default function TransactionPage() {
  const { id } = useParams();
  const [transaction, setTransaction] = useState(null);

  useEffect(() => {
    fetch(`/api/transactions/${id}`).then(res => res.json()).then(setTransaction);
  }, [id]);

  const updateStatus = async (newStatus) => {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    const updated = await res.json();
    setTransaction(updated);
  };

  if (!transaction) return <div>Loading...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto p-4">
      <h1 className="text-2xl mb-4">Transakcja</h1>
      <p>Status: {transaction.status}</p>
      <p>Oferowana książka: {transaction.offeredBook?.title}</p>
      <p>Żądana książka: {transaction.wishedBook?.title || 'Brak'}</p>

      {transaction.status === 'pending' && (
        <Button onClick={() => updateStatus('accepted')}>Akceptuj</Button>
      )}
      {transaction.status === 'accepted' && (
        <Button onClick={() => updateStatus('completed')}>Zakończ Wymianę</Button>
      )}
      {transaction.status === 'completed' && <ReviewForm transactionId={id} />}
    </motion.div>
  );
}
