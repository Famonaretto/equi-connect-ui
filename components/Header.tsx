'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import RootLayoutClient from '@/app/components/RootLayoutClient';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="main-header">
      <div className="top-bar">
        <Link href="/">
          <Image
            src="/images/logo.png"
            alt="EquiConnect logo"
            width={100}
            height={100}
            style={{ objectFit: 'contain' }}
          />
        </Link>

        <h1 className="site-title">Eki 360 – Łączymy się dla Koni</h1>

        <div className="user-panel">
          <RootLayoutClient />
        </div>

        <button className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          ☰
        </button>
      </div>

      <nav className={`main-nav ${isMenuOpen ? 'open mobile' : ''}`}>
        <Link href="/">Strona główna</Link>
        <Link href="/ankieta">Ocena zachowania konia</Link>
        <Link href="/znajdz">Znajdź specjalistę</Link>
        <Link href="/zgloszenia/lista">Zgłoszenia właścicieli koni</Link>
        <Link href="/wydarzenia">Wydarzenia</Link>
        <Link href="/blog">Blog</Link>
      </nav>
    </header>
  );
}
