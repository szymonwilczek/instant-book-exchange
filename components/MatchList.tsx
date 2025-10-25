'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import OfferCard from './OfferCard';

export default function MatchList() {
  const { data: session } = useSession();
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    if (session) {
      fetch('/api/matches').then(res => res.json()).then(setMatches);
    }
  }, [session]);

  const handlePropose = (offer) => {
    // API call do transakcji TODO 
    alert(`Zaproponowano wymianę dla ${offer.offeredBook.title}`);
  };

  return (
    <div>
      <h2 className="text-2xl mb-4">Pasujące Oferty</h2>
      {matches.map((match, index) => (
        <OfferCard key={index} offer={match} onPropose={handlePropose} />
      ))}
    </div>
  );
}
