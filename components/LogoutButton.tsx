'use client';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('user');
    router.push('/zaloguj');
  };

  return (
    <button onClick={handleLogout} style={{ background: '#0D1F40', color: 'white', padding: '0.5rem 1rem', borderRadius: '5px' }}>
      Wyloguj
    </button>
  );
}
