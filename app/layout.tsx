import './globals.css';
import Link from 'next/link';
import Image from 'next/image';
import RootLayoutClient from './components/RootLayoutClient';
import { UserProvider } from '@/contexts/UserContext';
import { DialogProvider } from './components/DialogProvider';


export const metadata = {
  title: 'EquiConnect – Zrozum swojego konia',
  description: 'Pomóż swojemu koniowi znaleźć wsparcie i opiekę.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <head />
      <body>
        <DialogProvider>
        <UserProvider>
          {/* NAVBAR Z LOGO */}
          <header
            style={{
              backgroundColor: '#fff',
              borderBottom: '1px solid #eee',
              padding: '1rem 2rem',
            }}
          >
            {/* GÓRNY RZĄD: logo + tytuł + ZALOGUJ */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                marginBottom: '1rem',
              }}
            >
              <Link href="/" style={{ zIndex: 1 }}>
                <Image
                  src="/images/logo.png"
                  alt="EquiConnect logo"
                  width={150}
                  height={150}
                  style={{ objectFit: 'contain' }}
                />
              </Link>

              <span
                style={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontWeight: 'bold',
                  fontSize: '2.5rem',
                  color: '#0D1F40',
                  whiteSpace: 'nowrap',
                  marginTop: '2rem',
                }}
              >
                Eki 360 – Łączymy się dla Koni
              </span>

              <div
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '2rem',
                }}
              >
                <RootLayoutClient />
              </div>
            </div>

            {/* MENU GŁÓWNE */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '2rem',
                marginTop: '1rem',
              }}
            >
              <nav
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '2rem',
                  fontWeight: 500,
                  fontSize: '1.2rem',
                  color: '#0D1F40',
                  justifyContent: 'center',
                }}
              >
                <Link href="/" style={{ textDecoration: 'none', color: '#0D1F40' }}>Strona główna</Link>
                <Link href="/ankieta" style={{ textDecoration: 'none', color: '#0D1F40' }}>Ocena zachowania konia</Link>
                <Link href="/znajdz" style={{ textDecoration: 'none', color: '#0D1F40' }}>Znajdź specjalistę</Link>
                <Link href="/zgloszenia/lista" style={{ textDecoration: 'none', color: '#0D1F40' }}>Zgłoszenia właścicieli koni</Link>
                <Link href="/wydarzenia" style={{ textDecoration: 'none', color: '#0D1F40' }}>Wydarzenia</Link>
                <Link href="/blog" style={{ textDecoration: 'none', color: '#0D1F40' }}>Blog</Link>
              </nav>
            </div>
          </header>

          {/* ZAWARTOŚĆ STRONY */}
          <main>{children}</main>

          {/* STOPKA */}
          <footer
            style={{
              backgroundColor: '#f1f1f1',
              padding: '1rem 1rem 2rem',
              color: '#0D1F40',
            }}
          >
            <div style={{
              maxWidth: '1100px',
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '2rem',
            }}>
              <div>
                <h4 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Kontakt</h4>
                <p><strong>Stowarzyszenie Eki 360</strong></p>
                <p>Ul. Główna 75, 96-124 Maków</p>
                <p>NIP: 123456789 • REGON: 987654321</p>
                <p>Email: eki360.kontakt@gmail.com</p>
                <p>Telefon: +48 123 456 789</p>
              </div>

              <div>
                <h4 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Informacje</h4>
                <p><a href="#" style={{ color: '#0D1F40', textDecoration: 'none' }}>Sponsorzy i reklamodawcy</a></p>
                <p><a href="#" style={{ color: '#0D1F40', textDecoration: 'none' }}>O nas</a></p>
                <p><a href="#" style={{ color: '#0D1F40', textDecoration: 'none' }}>Płatności</a></p>
                <p><a href="#" style={{ color: '#0D1F40', textDecoration: 'none' }}>FAQ</a></p>
                <p><a href="/polityka-prywatnosci" style={{ color: '#0D1F40', textDecoration: 'none' }}>Polityka prywatności i regulaminy</a></p>
              </div>

              <div>
                <h4 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Menu</h4>
                <p><a href="#specjalisci" style={{ color: '#0D1F40', textDecoration: 'none' }}>Dla specjalistów</a></p>
                <p><a href="#wlasciciele" style={{ color: '#0D1F40', textDecoration: 'none' }}>Dla właścicieli koni</a></p>
                <p><a href="#wydarzenia" style={{ color: '#0D1F40', textDecoration: 'none' }}>Wydarzenia</a></p>
                <p><a href="#blog" style={{ color: '#0D1F40', textDecoration: 'none' }}>Blog</a></p>
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
