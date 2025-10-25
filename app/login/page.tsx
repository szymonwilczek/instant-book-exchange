'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailSignIn = async () => {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      alert('Błąd logowania: ' + result.error);
    } else {
      alert('Zalogowano!');
    }
  };

  const handleGoogleSignIn = () => signIn('google');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl mb-4">Zaloguj się do Instant Book Exchange</h1>
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
      <Button onClick={handleEmailSignIn} className="mb-4">Zaloguj przez Email</Button>
      <Button onClick={handleGoogleSignIn} className="mb-4">Zaloguj przez Google</Button>
      <p>Nie masz konta? <Link href="/register" className="text-blue-500">Zarejestruj się</Link></p>
    </div>
  );
}
