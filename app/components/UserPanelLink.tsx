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
        backgroundColor: '#0D1F40',
        color: 'white',
        padding: '0.6rem 1.2rem',
        borderRadius: '0.5rem',
        fontWeight: 'bold',
        textDecoration: 'none',
        fontSize: '0.9rem',
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      Mój panel
    </Link>
  );
}