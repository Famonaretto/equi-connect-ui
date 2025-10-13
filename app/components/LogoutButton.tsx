'use client';

import { useRouter } from 'next/navigation';
import { getAuth} from 'firebase/auth';
import { useUser } from '@/contexts/UserContext';


export default function LogoutButton() {
  const router = useRouter();

const { logout } = useUser();

const handleLogout = async () => {
  await logout();
   // 🧹 Czyścimy localStorage
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('userChanged'));
  router.push('/');
  router.refresh(); 
};


  return (
    <button
      onClick={handleLogout}
      style={{
        backgroundColor: '#0D1F40',
        color: 'white',
        padding: '0.7rem 1.5rem',
        borderRadius: '0.5rem',
        fontWeight: 'bold',
        fontSize: '0.8rem',
        whiteSpace: 'nowrap',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      Wyloguj
    </button>
  );
}
