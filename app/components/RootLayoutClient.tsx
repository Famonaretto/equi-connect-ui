'use client';

import { useUser } from '@/contexts/UserContext';
import UserPanelLink from './UserPanelLink';
import LogoutButton from './LogoutButton';
import Link from 'next/link';

export default function RootLayoutClient() {
  const { user, loading } = useUser();

  const roleLabels: Record<string, string> = {
    specjalista: 'specjalista',
    wlasciciel: 'właściciel',
  };

  // ⏳ Nie pokazuj nic, dopóki Firebase nie odpowie
  if (loading) {
    return (
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: '0.85rem', color: '#666' }}>Ładowanie...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1.5rem',
        marginBottom: '1rem',
      }}
    >
      <div style={{ flexGrow: 1 }}></div>

      <div style={{ textAlign: 'right' }}>
        {/* ✅ ZAWSZE pokazujemy komunikat nad przyciskami */}
        <div
          style={{
            marginBottom: '1rem',
            fontSize: '0.9rem',
            color: user?.isLoggedIn ? '#0D1F40' : '#666',
          }}
        >
          {user?.isLoggedIn
            ? `Zalogowano jako ${roleLabels[user.role] || user.role} (${user.email})`
            : 'Nie jesteś zalogowany'}
        </div>

        {/* ✅ Przyciskowa część */}
        {user?.isLoggedIn ? (
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            <UserPanelLink />
            <LogoutButton />
          </div>
        ) : (
          <Link
            href="/zaloguj"
            style={{
              backgroundColor: '#0D1F40',
              color: 'white',
              padding: '0.7rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              textDecoration: 'none',
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
            }}
          >
            Zaloguj / Zarejestruj
          </Link>
        )}
      </div>
    </div>
  );
}
