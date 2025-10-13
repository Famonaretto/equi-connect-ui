// app/listaSpec/specjalisciLista.ts
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export type Specialist = {
  uid: string; // 👈 teraz zawsze dostępny
  id?: string; // id dokumentu w "profile"
  name: string;
  location: string;
  specialization: string | string[];
  contact: string[];
  rating: number;
  reviews: number;
  price: number; // najniższa cena
  photo: string;
};

export async function getSpecialistsFromFirestore(): Promise<Specialist[]> {
  const db = getFirestore(app);

  // pobieramy profile specjalistów
  const snapshot = await getDocs(collection(db, 'profile'));

  const specialists: Specialist[] = [];

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    const cenaOnline = parseInt(data.cenaOnline) || null;
    const cenaStacjonarna = parseInt(data.cenaStacjonarna) || null;

    const najnizszaCena = [cenaOnline, cenaStacjonarna]
      .filter((c) => c !== null)
      .reduce((min, curr) => (curr! < min! ? curr : min), Number.MAX_SAFE_INTEGER);

    // 👇 pobierz dane użytkownika powiązanego z profilem
    let uid = '';
    if (data.userId) {
      const userDoc = await getDoc(doc(db, 'users', data.userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        uid = userData.uid || data.userId; // zawsze mamy uid
      }
    }

    specialists.push({
      uid,
      id: docSnap.id,
      name: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
      photo: data.avatarUrl || '/images/default-profile.jpg',
      specialization: data.specialization || [],
      reviews: data.reviews || 0,
      price: najnizszaCena === Number.MAX_SAFE_INTEGER ? 0 : najnizszaCena,
      location: data.wojewodztwo || 'Nieznana',
      contact: data.contactTypes || [],
      rating: data.rating || 0,
    });
  }

  return specialists;
}
