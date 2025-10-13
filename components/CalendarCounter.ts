'use client';

import { useEffect, useState } from 'react';
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  updateDoc,
  DocumentData,
  doc,
  getDoc
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '@/lib/firebase';

/**
 * ✅ Hook: Licznik zdarzeń kalendarza
 * @param role 'owner' lub 'specialist' - ustalana w komponencie nadrzędnym
 */
export function useCalendarCounter(role: 'wlasciciel' | 'specjalista', refreshTrigger = 0)
 {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      // 📥 Pobranie maila z kolekcji `users`
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) return;

      const userData = userDocSnap.data();
      const userEmailFromDB = userData.email;
      if (!userEmailFromDB) return;

      // 📌 Dobranie pól zależnych od roli
      const emailField = role === 'wlasciciel' ? 'ownerEmail' : 'specialistEmail';
      const substatusField = role === 'wlasciciel' ? 'substatusW' : 'substatusS';
      const substatusValues = role === 'wlasciciel' ? ['NW', 'NOW'] : ['NS', 'NOS'];

      // 🔍 Subskrypcja Firestore
      const q = query(
  collection(db, 'konsultacje'),
  where(emailField, '==', userEmailFromDB),
  where('status', 'in', ['planowane', 'odwołane']), // ⬅️ zmiana tu
  where(substatusField, 'in', substatusValues)
);



      const unsubscribeSnap = onSnapshot(q, (snapshot) => {
        setCount(snapshot.size);
      });

      // 🧹 Sprzątanie po wylogowaniu / zmianie roli
      return () => unsubscribeSnap();
    });

    return () => unsubscribeAuth();
  }, [role, refreshTrigger]);


  return count;
}

/**
 * ✅ Funkcja: Resetowanie substatusów (po wejściu w kalendarz)
 * @param role 'owner' lub 'specialist'
 */
export async function resetCalendarSubstatuses(role: 'wlasciciel' | 'specjalista') {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const user = auth.currentUser;
  if (!user) return;

  // 📥 Pobranie maila z bazy
  const userDocRef = doc(db, 'users', user.uid);
  const userDocSnap = await getDoc(userDocRef);
  if (!userDocSnap.exists()) return;

  const userData = userDocSnap.data();
  const userEmailFromDB = userData.email;
  if (!userEmailFromDB) return;

  // 📌 Ustalenie pól i mapowania substatusów
  const emailField = role === 'wlasciciel' ? 'ownerEmail' : 'specialistEmail';
  const substatusField = role === 'wlasciciel' ? 'substatusW' : 'substatusS';

  const statusMap: Record<string, string> = {
    NW: 'SW',
    NOW: 'SOW',
    NS: 'SS',
    NOS: 'SOS',
  };

  const valuesToReset = role === 'wlasciciel'
    ? ['NW', 'NOW']
    : ['NS', 'NOS'];

  // 🔍 Pobranie dokumentów do zmiany
  const q = query(
    collection(db, 'konsultacje'),
    where(emailField, '==', userEmailFromDB),
    where(substatusField, 'in', valuesToReset)
  );

  const snap = await getDocs(q);

  // 🔄 Aktualizacja substatusów
  const updates = snap.docs.map((docSnap) => {
    const data = docSnap.data() as DocumentData;
    const oldValue = data[substatusField];
    const newValue = statusMap[oldValue];

    return updateDoc(docSnap.ref, { [substatusField]: newValue });
  });

  await Promise.all(updates);
}
