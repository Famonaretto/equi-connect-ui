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

  if (loading) {
    return (
      <div className="account-box">
        <div className="account-status loading">Ładowanie...</div>
      </div>
    );
  }

  return (
    <div className="account-box">
      <div className={`account-status ${user?.isLoggedIn ? 'logged' : 'guest'}`}>
        {user?.isLoggedIn ? (
          <>
            <span className="account-status-prefix">
              Zalogowano jako {roleLabels[user.role] || user.role}
            </span>
            <span className="account-status-email"> ({user.email})</span>
          </>
        ) : (
          'Nie jesteś zalogowany'
        )}
      </div>

      {user?.isLoggedIn ? (
        <div className="account-actions">
          <UserPanelLink />
          <LogoutButton />
        </div>
      ) : (
        <div className="account-actions">
          <Link href="/zaloguj" className="account-login-link">
            Zaloguj / Zarejestruj
          </Link>
        </div>
      )}
    </div>
  );
}