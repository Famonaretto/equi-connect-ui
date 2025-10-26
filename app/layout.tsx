// ❌ NIE używamy `use client` tutaj!
import './globals.css';
import { UserProvider } from '@/contexts/UserContext';
import { DialogProvider } from './components/DialogProvider';
import Header from '../components/Header';
 
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
            <Header /> {/* ← komponent z hamburgerem i przyciskiem logowania */}
            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
              {children}
            </main>
          </UserProvider>
        </DialogProvider>
      </body>
    </html>
  );
}
