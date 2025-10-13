'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function UserPanelLink() {
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error('Błąd parsowania usera:', e);
      }
    }
  }, []);

  if (!user) return null;

  const href = user.role === 'wlasciciel' ? '/wlasciciele' : '/specjalista';

  return (
    <Link
      href={href}
      style={{
        color: '#0D1F40',
        fontWeight: 'bold',
        textDecoration: 'none',
        marginRight: '1rem',
        fontSize: '1rem',
      }}
    >
      Mój panel
    </Link>
  );
}
