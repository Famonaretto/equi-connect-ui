import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { sendCustomEmailLink } from '@/app/lib/sendCustomEmailLink';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Brak adresu e-mail' });
  }

  try {
    const db = getFirestore(app);

    const q = query(
      collection(db, 'oceny_zachowania'),
      where('email', '==', email),
      where('userRole', '==', 'tymczasowy')
    );

    const snap = await getDocs(q);
    if (snap.empty) {
      return res.status(404).json({ error: 'Nie znaleziono tymczasowej oceny' });
    }

    // np. generuj token na podstawie e-maila
    const token = Buffer.from(email).toString('base64');

    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/aktywuj?email=${encodeURIComponent(email)}&token=${token}`;

    await sendCustomEmailLink(
  email,
  url,
  'Aktywacja konta',
  'Kliknij w link, aby aktywować swoje konto.'
);
 // helper do wysyłki linku

    return res.status(200).json({ message: '📩 Wysłano ponownie link aktywacyjny.' });
  } catch (err: any) {
    console.error('Błąd ponownego wysyłania:', err);
    return res.status(500).json({ error: 'Nie udało się wysłać e-maila.' });
  }
}
