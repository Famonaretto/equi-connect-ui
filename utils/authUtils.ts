import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

export const getCurrentUserRole = async (): Promise<'specjalista' | 'wlasciciel' | null> => {
  const auth = getAuth(app);
  const user = auth.currentUser;
  if (!user) return null;

  const db = getFirestore(app);
  const docRef = doc(db, 'uzytkownicy', user.uid);
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    const data = snapshot.data();
    return data.rola || 'wlasciciel';
  }

  return null;
};
