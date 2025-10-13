'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';

type UserData = {
  email: string;
  role: string;
  isLoggedIn: boolean;
};

type UserContextType = {
  user: UserData;
  logout: () => Promise<void>;
  loading: boolean;
};

const defaultUser: UserData = {
  email: '',
  role: '',
  isLoggedIn: false,
};

const UserContext = createContext<UserContextType>({
  user: defaultUser,
  logout: async () => {},
  loading: true,
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData>(defaultUser);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const auth = getAuth(app);
  let resolved = false;

  const loadUser = async () => {
    const firebaseUser = auth.currentUser;

    if (firebaseUser && firebaseUser.email) {
      try {
        const localUser = localStorage.getItem('user');
        const parsed = localUser ? JSON.parse(localUser) : null;

        if (!parsed?.role) {
          console.warn('⚠️ Nie znaleziono roli w localStorage!');
          setUser(defaultUser);
          setLoading(false);
          return;
        }

        setUser({
          email: firebaseUser.email,
          role: parsed.role,
          isLoggedIn: true,
        });
      } catch (err) {
        console.error('❌ Błąd przy odczycie z localStorage:', err);
        setUser(defaultUser);
      }
    } else {
      console.log('ℹ️ Brak użytkownika – wylogowany');
      setUser(defaultUser);
    }

    setLoading(false);
  };

  const unsubscribe = onAuthStateChanged(auth, () => {
    resolved = true;
    loadUser();
  });

  const timeout = setTimeout(() => {
    if (!resolved) {
      console.warn('⏰ Timeout 5s – nie otrzymano odpowiedzi od Firebase');
      setLoading(false);
    }
  }, 5000);

  // 🔁 obsługa zdarzenia, gdy localStorage zostanie nadpisane po logowaniu
  const handleUserChanged = () => {
    loadUser();
  };

  window.addEventListener('userChanged', handleUserChanged);

  return () => {
    clearTimeout(timeout);
    unsubscribe();
    window.removeEventListener('userChanged', handleUserChanged);
  };
}, []);


  const logout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      console.log('👋 Wylogowano użytkownika');
    } catch (err) {
      console.error('❌ Błąd podczas wylogowywania:', err);
    }

    setUser(defaultUser);
    setLoading(false);
    window.dispatchEvent(new Event('userChanged'));
  };

  return (
    <UserContext.Provider value={{ user, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
