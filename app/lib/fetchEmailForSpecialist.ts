// app/lib/fetchEmailForSpecialist.ts
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export async function fetchEmailForSpecialist(name: string): Promise<string> {
  const db = getFirestore(app);
  const snapshot = await getDocs(collection(db, 'users'));

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const specialist = data.roles?.specjalista;

    if (specialist && specialist.enabled) {
      const fullName = `${specialist.firstName} ${specialist.lastName}`.trim();

      if (fullName.toLowerCase() === name.toLowerCase()) {
        return data.email;
      }
    }
  }

  throw new Error('Nie znaleziono e-maila dla podanego specjalisty');
}
