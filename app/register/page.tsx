'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [preferences, setPreferences] = useState({ genres: [] });

  const handleGoogleSignIn = () => signIn('google');
  
  const handleEmailSignUp = async () => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (res.ok) {
      alert('Zarejestrowano! Teraz zaloguj się.');
    } else {
      alert(data.error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl mb-4">Zarejestruj się w Instant Book Exchange</h1>
      <Input
        type="text"
        placeholder="Imię"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-2"
      />
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-2"
      />
      <Input
        type="password"
        placeholder="Hasło"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-4"
      />
      <Button onClick={handleEmailSignUp} className="mb-4">Zarejestruj przez Email</Button>
      <Button onClick={handleGoogleSignIn} className="mb-4">Zarejestruj przez Google</Button>
      <p>Masz konto? <Link href="/login" className="text-blue-500">Zaloguj się</Link></p>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="mt-4">Dodaj preferencje (opcjonalne)</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Twoje preferencje</DialogTitle>
          <Input
            placeholder="Ulubione gatunki (np. fantasy, sci-fi)"
            onChange={(e) => setPreferences({ genres: e.target.value.split(',') })}
          />
          <Button onClick={() => alert('Zapisano preferencje')}>Zapisz</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
