'use client';
import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button'; // Z shadcn
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const {data: session} = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferences, setPreferences] = useState({ genres: [] });
  const router = useRouter();

  useEffect(() => {
    if (session) {

      router.push('/');
    }
  }, [session, router]);

  const handleGoogleSignIn = () => signIn('google');
  const handleEmailSignUp = async () => {
    // API call do rejestracji email/haslo TODO
    alert('Rejestracja email/hasło - dodamy API route');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl mb-4">Zarejestruj się w Instant Book Exchange</h1>
      <Button onClick={handleGoogleSignIn} className="mb-4">Zaloguj przez Google</Button>
      <p>Lub</p>
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
      <Button onClick={handleEmailSignUp}>Zarejestruj przez Email</Button>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="mt-4">Dodaj preferencje (opcjonalne)</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Twoje preferencje</DialogTitle>
          <h2>Twoje preferencje</h2>
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
