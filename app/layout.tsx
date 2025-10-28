import '../app/globals.css'; // Poprawiona ścieżka
import { UserProvider } from '@/contexts/UserContext';
import Header from '@/components/Header';
import { DialogProvider } from './components/DialogProvider';

export const metadata = {
  title: 'EquiConnect – Zrozum swojego konia',
  description: 'Pomóż swojemu koniowi znaleźć wsparcie i opiekę.',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <DialogProvider>
          <UserProvider>
            <Header />

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
              {children}
            </main>

            {/* === STOPKA === */}
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
                  <p style={{ margin: 0 }}>Sponsorzy i reklamodawcy</p>
                  <p style={{ margin: 0 }}>O nas</p>
                  <p style={{ margin: 0 }}>Płatności</p>
                  <p style={{ margin: 0 }}>FAQ</p>
                  <p style={{ margin: 0 }}>Polityka prywatności i regulaminy</p>
                </div>

                <div style={{ minWidth: '200px' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Menu</h4>
                  <p style={{ margin: 0 }}>Dla specjalistów</p>
                  <p style={{ margin: 0 }}>Dla właścicieli koni</p>
                  <p style={{ margin: 0 }}>Wydarzenia</p>
                  <p style={{ margin: 0 }}>Blog</p>
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
