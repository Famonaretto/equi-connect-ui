'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

export default function LogoutButton() {
  const router = useRouter();
  const { logout } = useUser();

  const handleLogout = async () => {
    try {
      await logout();

      localStorage.removeItem('role');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('userChanged'));

      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Błąd podczas wylogowania:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      type="button"
      style={{
        backgroundColor: '#0D1F40',
        color: 'white',
        padding: '0.6rem 1.2rem',
        borderRadius: '0.5rem',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        whiteSpace: 'nowrap',
        border: 'none',
        cursor: 'pointer',
        display: 'inline-block',
      }}
    >
      Wyloguj
    </button>
  );
}