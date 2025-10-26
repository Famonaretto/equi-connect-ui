'use client';

import './globals.css';
import Link from 'next/link';
import Image from 'next/image';
import RootLayoutClient from './components/RootLayoutClient';
import { UserProvider } from '@/contexts/UserContext';
import { DialogProvider } from './components/DialogProvider';
import { useState, useEffect } from 'react';

export const metadata = {
  title: 'EquiConnect – Zrozum swojego konia',
  description: 'Pomóż swojemu koniowi znaleźć wsparcie i opiekę.',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <html lang="pl">
      <head />
      <body>
        <DialogProvider>
          <UserProvider>
            <header className="main-header">
              <div className="top-bar">
                <Link href="/">
                  <Image
                    src="/images/logo.png"
                    alt="EquiConnect logo"
                    width={80}
                    height={80}
                    className="logo"
                  />
                </Link>

                <h1 className="site-title">Eki 360 – Łączymy się dla Koni</h1>

                <div className="user-panel">
                  <RootLayoutClient />
                </div>

                {isMobile && (
                  <button
                    className="hamburger"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                  >
                    ☰
                  </button>
                )}
              </div>

              <nav className={`main-nav ${isMobile ? 'mobile' : ''} ${isMenuOpen ? 'open' : ''}`}>
                <Link href="/">Strona główna</Link>
                <Link href="/ankieta">Ocena zachowania konia</Link>
                <Link href="/znajdz">Znajdź specjalistę</Link>
                <Link href="/zgloszenia/lista">Zgłoszenia właścicieli koni</Link>
                <Link href="/wydarzenia">Wydarzenia</Link>
                <Link href="/blog">Blog</Link>
              </nav>
            </header>

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
              {children}
            </main>

            <footer
              style={{
                backgroundColor: '#f1f1f1',
                padding: '2rem 1rem',
                color: '#0D1F40',
              }}
            >
              <div
                style={{
                  maxWidth: '1100px',
                  margin: '0 auto',
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '2rem',
                }}
              >
                <div style={{ minWidth: '200px' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Kontakt</h4>
                  <p><strong>Stowarzyszenie Eki 360</strong></p>
                  <p>Ul. Główna 75, 96-124 Maków</p>
                  <p>NIP: 123456789 • REGON: 987654321</p>
                  <p>Email: eki360.kontakt@gmail.com</p>
                  <p>Telefon: +48 123 456 789</p>
                </div>

                <div style={{ minWidth: '200px' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Informacje</h4>
                  <p><a href="#">Sponsorzy i reklamodawcy</a></p>
                  <p><a href="#">O nas</a></p>
                  <p><a href="#">Płatności</a></p>
                  <p><a href="#">FAQ</a></p>
                  <p><a href="/polityka-prywatnosci">Polityka prywatności i regulaminy</a></p>
                </div>

                <div style={{ minWidth: '200px' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Menu</h4>
                  <p><a href="#specjalisci">Dla specjalistów</a></p>
                  <p><a href="#wlasciciele">Dla właścicieli koni</a></p>
                  <p><a href="#wydarzenia">Wydarzenia</a></p>
                  <p><a href="#blog">Blog</a></p>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.85rem', color: '#555' }}>
                © {new Date().getFullYear()} Konspec. Wszelkie prawa zastrzeżone.
              </div>
            </footer>
          </UserProvider>
        </DialogProvider>
      </body>
    </html>
  );
}
