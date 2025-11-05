'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import OfferCard from '@/components/OfferCard';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const searchOffers = async () => {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data);
  };

  const handlePropose = (offer) => {
    alert(`Zaproponowano wymianę dla ${offer.offeredBook.title}`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl mb-4">Wyszukaj Oferty</h1>
      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tytuł, autor..." />
      <Button onClick={searchOffers} className="ml-2">Szukaj</Button>
      <div className="mt-4">
        {results.map((offer, index) => (
          <OfferCard key={index} offer={offer} onPropose={handlePropose} />
        ))}
      </div>
    </div>
  );
}
