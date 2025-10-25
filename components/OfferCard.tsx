'use client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface Offer {
  offeredBook: { title: string; author: string };
  owner: { name: string };
  matchType: string;
}

interface OfferCardProps {
  offer: Offer;
  onPropose: (offer: Offer) => void;
}

export default function OfferCard({ offer, onPropose }: OfferCardProps) {
  const handlePropose = async () => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offeredBookId: offer.offeredBook._id,
        receiverEmail: offer.owner.email,
      }),
    });
    const data = await res.json();
    if (data.transactionId) {
      alert('Transakcja zaproponowana!');
      onPropose(offer);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      className="border p-4 mb-4 rounded-lg shadow"
    >
      <h3 className="text-lg font-bold">{offer.offeredBook.title}</h3>
      <p>Autor: {offer.offeredBook.author}</p>
      <p>Oferuje: {offer.owner.name}</p>
      <p>Dopasowanie: {offer.matchType}</p>
      <Button onClick={handlePropose}>Zaproponuj Wymianę</Button>
    </motion.div>
  );
}
