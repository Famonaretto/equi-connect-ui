import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export async function fetchEmailForSpecialist(name: string): Promise<string> {
  const db = getFirestore(app);
  const snapshot = await getDocs(collection(db, 'users'));

  const normalizedTarget = name.trim().toLowerCase();

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const specialist = data.roles?.specjalista;

    if (specialist && specialist.enabled) {
      const fullName = `${specialist.firstName || ''} ${specialist.lastName || ''}`.trim().toLowerCase();

      console.log('Szukam:', normalizedTarget, 'sprawdzam:', fullName);

      if (fullName === normalizedTarget) {
        if (data.email) return data.email;
        break;
      }
    }
  }

  throw new Error(`Nie znaleziono e-maila dla specjalisty: ${name}`);
}