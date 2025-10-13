import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { query, where, getDocs } from 'firebase/firestore';
import { sendCustomEmailLink } from '../../lib/sendCustomEmailLink';


// ✅ Konfiguracja Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY!,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.FIREBASE_PROJECT_ID!,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.FIREBASE_APP_ID!,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ Endpoint POST
export async function POST(req: NextRequest) {
  try {
    console.log('🔄 Rozpoczęto zapis oceny...');

    const data = await req.json();
    const { formData, email, userRole } = data;

    console.log('📥 Odebrano dane:', { email, userRole });

    // 🔐 Walidacja danych
    if (!formData || typeof formData !== 'object') {
      console.warn('⚠️ Brak danych formularza');
      return NextResponse.json({ error: 'Brak danych formularza' }, { status: 400 });
    }

    if (
      !formData ||
      !email ||
      typeof email !== 'string' ||
      !email.includes('@') ||
      userRole === undefined
    ) {
      console.warn('⚠️ Brakuje poprawnego emaila lub roli');
      return NextResponse.json({ error: 'Brakuje poprawnego emaila lub roli' }, { status: 400 });
    }

    const isTemporary = userRole === 'tymczasowy';

    // 🧹 Filtrowanie danych
    const cleanedFormData: Record<string, number> = {};
    Object.entries(formData).forEach(([key, val]) => {
      if (typeof val === 'number') {
        cleanedFormData[key] = val;
      }
    });

    const docData: Record<string, any> = {
      email: String(email),
      userRole: String(userRole),
      temporary: isTemporary,
      formData: cleanedFormData,
      createdAt: serverTimestamp(),
    };

    if (isTemporary) {
      docData.expiresAt = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    }

    // 🔎 Sprawdzenie konta tymczasowego
    let alreadyTemporary = false;

    if (isTemporary) {
      console.log('🔎 Sprawdzam, czy użytkownik ma już konto tymczasowe...');
      const q = query(
        collection(db, 'oceny_zachowania'),
        where('email', '==', email),
        where('userRole', '==', 'tymczasowy')
      );
      const snapshot = await getDocs(q);
      alreadyTemporary = !snapshot.empty;
      console.log('📊 Konto tymczasowe już istnieje:', alreadyTemporary);
    }

    console.log('📝 Dokument do zapisu:', JSON.stringify(docData, null, 2));

    const ref = await addDoc(collection(db, 'oceny_zachowania'), docData);
    console.log('✅ Zapisano dokument z ID:', ref.id);

    // 📧 Wysyłka e-maila jeśli pierwszy raz
if (isTemporary && !alreadyTemporary) {
    console.log('📧 Wysyłanie e-maila rejestracyjnego do:', email);
    const registerLink = `https://eki360.pl/rejestracja?email=${encodeURIComponent(email)}`;
const subject = 'Dokończ rejestrację konta właściciela';
const message = `
  <p>Dziękujemy za ocenę!</p>
  <p>Twoje konto tymczasowe zostało utworzone. Kliknij poniżej, aby dokończyć rejestrację:</p>
  <a href="${registerLink}" target="_blank">Dokończ rejestrację</a>
`;

await sendCustomEmailLink(email, registerLink, subject, message);
    console.log('📨 Link rejestracyjny wysłany przez sendCustomEmailLink');
    console.log('📨 E-mail wysłany do:', email);
    }

    console.log('🟢 Sukces — zwracam odpowiedź');
    return NextResponse.json({ success: true, alreadyTemporary });
  } catch (err) {
    console.error('❌ Błąd podczas zapisu:', err);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
