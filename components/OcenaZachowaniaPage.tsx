'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  sendEmailVerification,signInWithEmailAndPassword} from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs,  setDoc,
  doc, addDoc,  serverTimestamp, orderBy, limit, 
  getDoc} from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useUser } from '@/contexts/UserContext';
import { Timestamp } from 'firebase/firestore';
import { useDialog } from '@/app/components/DialogProvider';
import { db } from "@/lib/firebase";
import Link from 'next/link';

const prefixToCategory: Record<string, string> = {
  karmienie: 'Sytuacje codzienne',
  narowy: 'Sytuacje codzienne',
  odejscie: 'Sytuacje codzienne',
  uwiaz: 'Sytuacje codzienne',

  vaa: 'Przed treningiem',
  fha: 'Przed treningiem',
  czyszczenie: 'Przed treningiem',
  ubieranie: 'Przed treningiem',

  pysk: 'Podczas treningu',
  glowa: 'Podczas treningu',
  ogon: 'Podczas treningu',
  chod: 'Podczas treningu',
  opor: 'Podczas treningu',

  oddech: 'Po treningu',
  spocenie: 'Po treningu',
  otoczenie: 'Po treningu',
  interakcja: 'Po treningu',
  apetyt: 'Po treningu',

  transport: 'Sytuacje dodatkowe',
  kowal: 'Sytuacje dodatkowe',
  zawody: 'Sytuacje dodatkowe',
};

const categoryOrder = [
  'Sytuacje codzienne',
  'Przed treningiem',
  'Podczas treningu',
  'Po treningu',
  'Sytuacje dodatkowe'
];

// Definicje sugerowanych specjalistów dla poszczególnych kategorii
const specialistSuggestions: Record<string, { type: string; label: string; condition?: (answers: string[]) => boolean }[]> = {
  'Podczas karmienia': [
    { type: 'behawiorysta', label: 'Behawiorysta' }
  ],
  'Narowy': [
    { type: 'behawiorysta', label: 'Behawiorysta' }
  ],
  'Odejście od koni': [
    { type: 'behawiorysta', label: 'Behawiorysta' },
    { type: 'trener naturalny', label: 'Trener metod naturalnych' }
  ],
  'Prowadzenie na uwiązie': [
    { type: 'behawiorysta', label: 'Behawiorysta' },
    { type: 'trener naturalny', label: 'Trener metod naturalnych' }
  ],
  'Podczas czyszczenia': [
    { type: 'behawiorysta', label: 'Behawiorysta' },
    { type: 'weterynarz-wrzody', label: 'Weterynarz – wrzody' }
  ],
  'Podczas ubierania': [
    { type: 'behawiorysta', label: 'Behawiorysta' },
    { type: 'weterynarz-wrzody', label: 'Weterynarz – wrzody' },
    { type: 'dopasowanie', label: 'Dopasowanie siodła/ogłowia/wędzidła' }
  ],
  'Zachowania pyska': [
    { type: 'dopasowanie', label: 'Dopasowanie wędzidła' },
    { type: 'weterynarz-oczy', label: 'Weterynarz – oczy' }
  ],
  'Głowa i szyja': [
    { type: 'dopasowanie', label: 'Dopasowanie siodła/ogłowia' },
    { type: 'trener dyscypliny', label: 'Trener dyscypliny' }
  ],
  'Ogon': [
    { type: 'behawiorysta', label: 'Behawiorysta' }
  ],
  'Chód': [
    { type: 'trener dyscypliny', label: 'Trener dyscypliny' },
    { type: 'fizjoterapeuta', label: 'Fizjoterapeuta' }
  ],
  'Opór': [
    { type: 'trener dyscypliny', label: 'Trener dyscypliny' },
    { type: 'weterynarz-oczy', label: 'Weterynarz – oczy', condition: (answers) => answers.includes('Zmiana kierunku / płoszenie się / ponoszenie') },
    { type: 'dopasowanie', label: 'Dopasowanie siodła/ogłowia/wędzidła' }
  ],
  'Oddech': [
    { type: 'weterynarz-oddechowy', label: 'Weterynarz – układ oddechowy' },
    { type: 'weterynarz-wydolnosc', label: 'Weterynarz – wydolność / testy' }
  ],
  'Spocenie': [
    { type: 'weterynarz-oddechowy', label: 'Weterynarz – układ oddechowy' },
    { type: 'weterynarz-wydolnosc', label: 'Weterynarz – wydolność / testy' }
  ],
  'Reakcja na otoczenie': [
    { type: 'behawiorysta', label: 'Behawiorysta' }
  ],
  'Interakcja z człowiekiem': [
    { type: 'behawiorysta', label: 'Behawiorysta' },
    { type: 'trener naturalny', label: 'Trener metod naturalnych' }
  ],
  'Apetyt': [
    { type: 'weterynarz-wrzody', label: 'Weterynarz – wrzody' }
  ],
  'Transport': [
    { type: 'behawiorysta', label: 'Behawiorysta' },
    { type: 'trener naturalny', label: 'Trener metod naturalnych' }
  ],
  'Wizyta kowala': [
    { type: 'behawiorysta', label: 'Behawiorysta' },
    { type: 'dopasowanie', label: 'Dopasowanie siodła/ogłowia/wędzidła' }
  ],
  'Stajnia domowa a zawody zewnętrzne': [
    { type: 'behawiorysta', label: 'Behawiorysta' },
    { type: 'trener dyscypliny', label: 'Trener dyscypliny' },
    { type: 'weterynarz-wydolnosc', label: 'Weterynarz – wydolność / testy' }
  ]
};

const behaviorColorMap: Record<string, 'red' | 'yellow' | 'green'> = {
  // Podczas karmienia
  'Agresywny tylko do ludzi (atakuje lub straszy osobę karmiącą)': 'red',
  'Agresywny do ludzi i koni (straszy lub próbuje ugryźć)': 'red',
  'Agresywny tylko do koni (atakuje inne konie)': 'red',
  'Niecierpliwy (kopie przednią nogą, wierci się po boksie)': 'yellow',
  'Dopomina się delikatnie (rży i wypatruje osoby karmiącej)': 'green',
  'Spokojnie czeka na karmienie (nie denerwuje się)': 'green',

  // Narowy
  'Łykanie (połykanie powietrza)': 'yellow',
  'Tkanie (bujanie się)': 'yellow',
  'Heblowanie (tarcie zębami o powierzchnie)': 'yellow',
  'Krążenie po boksie': 'yellow',
  'Lizanie/gryzienie ścian': 'yellow',
  'Autoagresja (gryzienie się po piersiach, bokach)': 'red',
  'Inne narowy': 'yellow',
  'Koń nie ma narowów': 'green',

  // Odejście od koni
  'Koń łatwo odłącza się od innych koni': 'green',
  'Zaniepokojony, ale reaguje na polecenia osoby prowadzącej': 'yellow',
  'Niebezpieczny, nie reaguje na polecenia prowadzącego': 'red',

  // Prowadzenie na uwiązie
  'Chętnie podąża za człowiekiem i reaguje na polecenia': 'green',
  'Wymaga korekt co jakiś czas': 'yellow',
  'Skupiony na otoczeniu, nie reaguje na polecenia prowadzącego': 'red',

  // Test VAA
  'Koń podchodzi, chce powąchać rękę': 'green',
  'Koń nie podchodzi i nie nawiązuje kontaktu': 'yellow',
  'Unikanie lub agresja - koń odwraca się zadem lub straszy ugryzieniem': 'red',

  // Test FHA
  'Zachowania agresywno - obronne (straszenie, gryzienie, kopanie)': 'red',
  'Unikanie (odsuwanie się przy próbie dotyku)': 'yellow',
  'Chęć kontaktu (pozostaje spokojny, ciekawy, pozwala na dotyk)': 'green',

  // Podczas czyszczenia
  'Koń nie może być wiązany lub musi być wiązany na dwóch uwiązach': 'red',
  'Odsuwanie się od szczotki przy czyszczeniu grzbietu lub okolic popręgu (ugina plecy, unosi grzbiet)': 'red',
  'Nie pozwala dotknąć głowy lub uszu': 'yellow',
  'Nie podnosi wszystkich nóg': 'yellow',
  'Koń stoi spokojnie, przywiązany na pojedynczym uwiązie, podaje wszystkie kopyta': 'green',

  // Podczas ubierania
  'Intensywne gryzienie wędzidła': 'yellow',
  'Cofnięte uszy': 'yellow',
  'Intensywne wpatrywanie się z położonymi uszami': 'yellow',
  'Wiercenie się / nerwowość': 'yellow',
  'Machanie ogonem': 'yellow',
  'Obracanie głową w stronę popręgu': 'yellow',
  'Próby ugryzienia jeźdźca': 'red',
  'Pocieranie nosem jeźdźca': 'yellow',
  'Zadzieranie głowy przy zakładaniu ogłowia': 'yellow',
  'Wymagana pomoc drugiej osoby': 'yellow',
  'Koń stoi spokojnie podczas ubierania': 'green',

  // Zachowania pyska
  'Uszy cofnięte przez ≥5 sekund': 'yellow',
  'Zamknięte oczy przez 2-5 sekund': 'yellow',
  'Widoczna twardówka (białko oka)': 'yellow',
  'Pusty wzrok przez ≥5 sekund': 'yellow',
  'Otwieranie/zamykanie pyska ≥10 sekund': 'yellow',
  'Ruch języka, wysuwanie': 'yellow',
  'Przesunięcie wędzidła na jedną stronę, opieranie się na jednej wodzy': 'yellow',
  'Koń nie wykazuje nieprawidłowości w ustawieniu głowy i szyi': 'green',

  // Głowa i szyja
  'Unoszenie/opuszczanie głowy niesynchroniczne z ruchem kłusa': 'yellow',
  'Przechylanie głowy': 'yellow',
  'Głowa powyżej pionu ≥10s': 'yellow',
  'Głowa za pionem ≥10s': 'yellow',
  'Rzucanie, skręcanie głową, kręcenie głową na boki': 'yellow',
  'Koń nie wykazuje żadnego z powyższych zachowań': 'green',

  // Ogon
  'Ogon trzymany na bok': 'yellow',
  'Ogon wciśnięty między pośladkami': 'yellow',
  'Energiczne, nerwowe machanie ogonem': 'yellow',
  'Ogon bez napięcia, zwisający swobodnie': 'green',

  // Chód
  'Zbyt szybkie tempo (>40 kroków/15s)': 'yellow',
  'Zbyt wolne tempo (<35 kroków/15s)': 'yellow',
  'Trzyśladowy ruch': 'yellow',
  'Błędy galopu: zmiany nóg, galop krzyżowy': 'yellow',
  'Samoczynne zmiany chodu': 'yellow',
  'Potykanie się, ciągnięcie czubków kopyt': 'yellow',
  'Koń porusza się swobodnym, rytmicznym chodem': 'green',

  // Opór
  'Zmiana kierunku / płoszenie się / ponoszenie': 'red',
  'Opór przed ruchem, zatrzymywanie się / odmowa wykonania ruchu, np. skoków': 'red',
  'Stawanie dęba': 'red',
  'Brykanie': 'red',
  'Koń chętnie współpracuje i wykonuje polecenia': 'green',

  // Oddech
  'Koń oddycha intensywnie pracując bokami': 'red',
  'Koń nie pracuje intensywnie bokami, ale wykonuje 1 oddech w ciągu ok. 1-2 sekund': 'yellow',
  'Koń wykonuje 1 oddech na min. 3-4 sekundy': 'green',

  // Spocenie
  'Nie jest spocony': 'green',
  'Jest spocony u podstawy szyi i pod siodłem': 'green',
  'Jest intensywnie spocony na szyi, pod siodłem, w okolicach słabizny, ale nie widać skapujących strużek potu ani piany': 'yellow',
  'Pot skapuje z konia i jest miejscami spieniony': 'red',

  // Reakcja na otoczenie
  'Zainteresowany otoczeniem': 'green',
  'Obojętny na otoczenie': 'yellow',
  'Zaniepokojony otoczeniem': 'red',

  // Interakcja z człowiekiem
  'Koń chętnie podąża za człowiekiem, szuka kontaktu, chce powąchać dotknąć': 'green',
  'Koń obojętny wobec człowieka, nie szuka kontaktu': 'yellow',
  'Koń wykazujacy lęk lub agresję, reaguje nerwowo i przesadnie na gesty człowieka': 'red',

  // Apetyt
  'Koń jest zainteresowany jedzeniem, w drugiej kolejności napije się wody': 'green',
  'Koń spragniony, dopiero po napojeniu zainteresowany jedzeniem': 'yellow',
  'Koń niezainteresowany ani jedzeniem, ani wodą': 'red',

  // Transport
  'koń chętnie wchodzi do przyczepy/koniowozu': 'green',
  'są trudności z wejściem do przyczepy/koniowozu, ale zwykle nie zajmuje to dłużej niż 15 min': 'yellow',
  'koń stawia wyraźny opór przed wejściem do przyczepy/koniowozu - załadunek trwa min 30min a czasem dłużej lub w ogóle nie da się konia załadować': 'red',
  
  // Kowal
  'koń spokojnie stoi podczas całej wizyty kowala': 'green',
  'koń stoi spokojnie tylko na początku wizyty, z czasem zaczyna się kręcić i stawiać opór': 'yellow',
  'koń już na początku wizyty sprawia problemy, kowal nie może wykonać korekcji kopyt, bo koń wyrywa nogi lub w ogóle nie chce ich podać': 'red',
  'koń kopie przy próbie podniesienia kopyt przez kowala lub stwarza inne niebezpieczne sytuacje': 'red',

  // Zawody
  'w domu i na zawodach zewnętrznych koń przedstawia taki sam poziom umiejętności': 'green',
  'na zawodach zewnętrznych koń wykazuje gorszą dyspozycję fizyczną niż w domu, szybciej się męczy, jednak nie wynika to ze stresu psychicznego (przykład: więcej zrzutek na parkurze lub mniej energii podczas wykonywania parkuru lub czworoboku)': 'yellow',
  'koń emocjonalnie źle znosi udział w zawodach, reaguje poniżej umiejętności jakie przejawia w stajni domowej (przykład: przejawianie oporu w postaci wierzgania, stawanie dęba, odmowy skoku, płoszenie się, niechęć do ruchu NIE wynikająca ze zmęczenia fizycznego, ponoszenie)': 'red',
};

async function getLastTemporaryRecord(email: string) {
  const db = getFirestore(app);
  const q = query(
    collection(db, 'oceny_zachowania'),
    where('email', '==', email),
    where('userRole', '==', 'tymczasowy'),
    orderBy('createdAt', 'desc'),
    limit(1)
  );

  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return doc.data();
  }

  return null;
}

async function saveToOwnerAccount(formData: any, email: string, userRole: string) {
  console.log('Wysyłam:', { formData, email, userRole });
  
  const res = await fetch('/api/save-behavior', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      formData,
      email,
      userRole,
    }),
  });

  const data = await res.json();
  return data;
}

async function saveToTemporaryAccount(email: string, formData: any) {
  const response = await fetch(`${window.location.origin}/api/save-behavior`, {
    method: 'POST',
    body: JSON.stringify({
      formData,
      email,
      userRole: 'tymczasowy',
    }),
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Backend zwrócił błąd:", data?.error);
    throw new Error(data?.error || 'Nieznany błąd');
  }

  return data;
}

function getSubcategoryColor(
  subcategory: string,
  selectedLabels: string[]
): 'gray' | 'green' | 'yellow' | 'red' {
  if (selectedLabels.length === 0) return 'gray';

  const yellowThresholds: Record<string, number> = {
    'Narowy': 2,
    'Zachowania pyska': 3,
    'Głowa i szyja': 2,
    'Chód': 3,
    'Transport': 1,
    'Wizyta kowala': 1,
    'Stajnia domowa a zawody zewnętrzne': 1,
  };

  let hasRed = false;
  let yellowCount = 0;
  let hasGreen = false;

  for (const label of selectedLabels) {
    const color = behaviorColorMap[label];
    if (!color) continue;
    if (color === 'red') hasRed = true;
    else if (color === 'yellow') yellowCount++;
    else if (color === 'green') hasGreen = true;
  }

  if (hasRed) return 'red';

  const threshold = yellowThresholds[subcategory] ?? Infinity;
  if (yellowCount > threshold) return 'red';
  if (yellowCount > 0) return 'yellow';

  return hasGreen ? 'green' : 'gray';
}

type OcenaZachowaniaPageProps = {
  horseId?: string;
  onBack: () => void;
};

// Generowanie lat od 1900 do bieżącego roku
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= 1900; year--) {
    years.push(year);
  }
  return years;
};

export default function OcenaZachowaniaPage({ horseId, onBack }: OcenaZachowaniaPageProps) {
  const [horseName, setHorseName] = useState<string>("");
  const [horseBreed, setHorseBreed] = useState<string>("");
  const [horseBirthYear, setHorseBirthYear] = useState<string>('');
  const [horseSex, setHorseSex] = useState<string>("");

  useEffect(() => {
    if (horseId) {
      const fetchHorse = async () => {
        const snap = await getDoc(doc(db, "konie", horseId));
        if (snap.exists()) {
          setHorseName(snap.data().imie || "");
        }
      };
      fetchHorse();
    }
  }, [horseId]);

  const [formData, setFormData] = useState<{ [key: string]: boolean | string }>({});
  const [inneNarowy, setInneNarowy] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const summaryRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  const { email, isLoggedIn, role: userRole } = user;
  const [showLoginToSaveModal, setShowLoginToSaveModal] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const { showDialog, showDialogWithActions } = useDialog();

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [showConfirmRegisterModal, setShowConfirmRegisterModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [typedEmail, setTypedEmail] = useState('');
  const finalEmail = isLoggedIn ? email : typedEmail;

  const [showSkipModal, setShowSkipModal] = useState(false);
  const [pendingStep, setPendingStep] = useState<number | null>(null);
  const [missingCategories, setMissingCategories] = useState<string[]>([]);

  useEffect(() => {
    const checkUserExists = async () => {
      if (!finalEmail || !finalEmail.includes('@')) return;

      const db = getFirestore(app);
      const q = query(
        collection(db, 'users'),
        where('email', '==', finalEmail)
      );

      try {
        const querySnapshot = await getDocs(q);
        setUserExists(!querySnapshot.empty);
      } catch (error) {
        console.error('Błąd podczas sprawdzania użytkownika:', error);
        setUserExists(null);
      }
    };

    checkUserExists();
  }, [finalEmail]);

  useEffect(() => {
    if (!horseId) return;
    const fetchHorse = async () => {
      const snap = await getDoc(doc(db, "konie", horseId));
      if (snap.exists()) {
        setHorseName(snap.data().imie || "");
      }
    };
    fetchHorse();
  }, [horseId]);

  const handleSaveClick = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    const db = getFirestore(app);
    let ownerUid = null;

    if (user) {
      ownerUid = user.uid;
    } else {
      const q = query(
        collection(db, 'users'),
        where('email', '==', finalEmail),
        where('roles.wlasciciel.enabled', '==', true)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const ownerData = snapshot.docs[0].data();
        ownerUid = ownerData.uid;
      } else {
        const shouldCreateTemporaryAccount = await new Promise<string>((resolve) => {
          showDialogWithActions(
            'Ten e-mail nie należy do zarejestrowanego właściciela.\nCzy chcesz utworzyć konto tymczasowe?',
            [
              { label: 'Tak', value: 'yes' },
              { label: 'Nie', value: 'no' },
            ],
            (value) => resolve(value)
          );
        });

        if (shouldCreateTemporaryAccount !== 'yes') return;

        const password = prompt('Utwórz hasło do konta tymczasowego:');
        if (!password || password.length < 6) {
          await showDialog('Hasło musi mieć co najmniej 6 znaków.');
          return;
        }

        try {
          const auth = getAuth(app);
          const userCred = await createUserWithEmailAndPassword(auth, finalEmail, password);
          const user = userCred.user;

          await sendEmailVerification(user);

          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            createdAt: serverTimestamp(),
            role: 'tymczasowy',
          });

          await showDialog('📩 Konto tymczasowe zostało utworzone. Sprawdź maila, by je aktywować.');

          ownerUid = user.uid;
        } catch (err: any) {
          console.error(err);
          await showDialog(err.message || 'Błąd podczas tworzenia konta.');
          return;
        }
      }
    }

    let newHorseId = horseId;

    if (!newHorseId) {
      const newHorseRef = await addDoc(collection(db, "konie"), {
        imie: horseName.trim(),
        rasa: horseBreed || null,
        rokUrodzenia: horseBirthYear || null,
        plec: horseSex || null,
        status: "nowy",
        ownerUid: ownerUid,
        createdAt: serverTimestamp(),
      });

      newHorseId = newHorseRef.id;
      await showDialog("📌 Dodano nowego konia.");
    }

    try {
      await addDoc(collection(db, "konie", newHorseId, "oceny"), {
        formData,
        labelsByKey,
        ownerUid: ownerUid,
        createdAt: serverTimestamp(),
      });

      await showDialog("✅ Ocena została zapisana do historii konia.");
      if (typeof onBack === "function") {
        onBack();
      }
    } catch (err) {
      console.error("Błąd zapisu oceny:", err);
      await showDialog("❌ Nie udało się zapisać oceny.");
    }
  };

  const handleTemporarySave = async () => {
    if (!email) return await showDialog('Podaj poprawny e-mail.');

    await saveToTemporaryAccount(email, formData);
    await showDialog('📩 Ocena została zapisana. Konto tymczasowe ważne 7 dni.');

    const confirm = window.confirm('Czy chcesz założyć konto teraz?');
    if (confirm) {
      setShowConfirmRegisterModal(true);
    }
  };

  const handleConfirmRegistration = async () => {
    if (!finalEmail || !fullName || !password || password !== confirmPassword) {
      await showDialog('Uzupełnij wszystkie pola i upewnij się, że hasła są takie same.');
      return;
    }

    try {
      const auth = getAuth(app);
      const userCred = await createUserWithEmailAndPassword(auth, finalEmail, password);
      const user = userCred.user;

      await sendEmailVerification(user);

      const db = getFirestore(app);
      const [firstName = '', lastName = ''] = fullName.trim().split(' ');

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        role: 'wlasciciel',
        createdAt: serverTimestamp(),
        firstName,
        lastName,
        phone: '',
      });

      await showDialog('📩 Konto utworzone. Sprawdź maila, by je aktywować.');
      setShowConfirmRegisterModal(false);
    } catch (err: any) {
      console.error(err);
      await showDialog(err.message || 'Wystąpił błąd przy rejestracji.');
    }
  };

  // ➤ Podkategorie z pojedynczym wyborem
  const singleSelectSubcategories = new Set([
    'vaa', 'fha', 'karmienie', 'odejscie', 'uwiaz',
    'oddech', 'spocenie', 'otoczenie', 'interakcja', 'apetyt', 'ogon',
    'transport', 'zawody'
  ]);

  const allSubcategoryPrefixes = [
    'karmienie', 'narowy', 'odejscie', 'uwiaz',
    'vaa', 'fha', 'czyszczenie', 'ubieranie',
    'pysk', 'glowa', 'ogon', 'chod', 'opor',
    'oddech', 'spocenie', 'otoczenie', 'interakcja', 'apetyt',
    'transport', 'kowal', 'zawody',
  ];

  // ➤ Wykluczające się odpowiedzi
  const exclusiveBehaviors = new Set([
    'Koń nie ma narowów',
    'Koń stoi spokojnie, przywiązany na pojedynczym uwiązie, podaje wszystkie kopyta',
    'Koń stoi spokojnie podczas ubierania',
    'Ogon zwisający swobodnie',
    'Swobodny, rytmiczny chód',
    'Koń chętnie współpracuje',
    'Brak nieprawidłowości',
    'Koń chętnie współpracuje i wykonuje polecenia',
  ]);

  const getLabelForKey = (key: string): string => {
    const labelElement = document.querySelector(`input[name="${key}"]`)?.parentElement;
    return labelElement?.textContent?.trim() || key;
  };

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;

      if (state?.showSummary || window.location.hash === '#summary') {
        setShowSummary(true);
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 0);
        return;
      }

      if (typeof state?.step === 'number') {
        setShowSummary(false);
        setCurrentStep(state.step);
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 0);
        return;
      }

      setShowSummary(false);
      setCurrentStep((prev) => Math.max(0, prev - 1));
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 0);
    };

    window.addEventListener('popstate', handlePopState);

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    const [prefix] = name.split('_');
    const label = e.target.parentElement?.textContent?.trim() || '';

    if (type === 'text') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      return;
    }

    setFormData(prev => {
      const updated = { ...prev };

      const keysInGroup = Object.keys(prev).filter(k => k.startsWith(prefix + '_'));

      const alreadySelectedLabels = keysInGroup
        .filter(k => prev[k] === true)
        .map(k => getLabelForKey(k));

      const anyExclusiveSelected = alreadySelectedLabels.some(l => exclusiveBehaviors.has(l));
      const isExclusive = exclusiveBehaviors.has(label);
      const isSingleSelect = singleSelectSubcategories.has(prefix);

      if (isExclusive) {
        keysInGroup.forEach(k => {
          updated[k] = false;
        });
        updated[name] = checked;
        return updated;
      }

      if (!isExclusive && anyExclusiveSelected) {
        keysInGroup.forEach(k => {
          const l = getLabelForKey(k);
          if (exclusiveBehaviors.has(l)) {
            updated[k] = false;
          }
        });
      }

      if (isSingleSelect) {
        keysInGroup.forEach(k => {
          updated[k] = false;
        });
      }

      updated[name] = checked;
      return updated;
    });
  };

  const steps = ['Sytuacje codzienne', 'Przed treningiem', 'Podczas treningu', 'Po treningu', 'Sytuacje dodatkowe'];

  const btnStyle = {
    background: '#0D1F40',
    color: '#fff',
    padding: '0.5rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'background-color 0.3s ease',
  };

  const iconBtnStyle: React.CSSProperties = {
    backgroundColor: 'white',
    border: '1px solid #ccc',
    borderRadius: '1rem',
    padding: '1.5rem 1rem',
    textAlign: 'center',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '160px',
    flex: '1 1 160px',
    fontWeight: 600,
    color: '#0D1F40',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  };

  const svgIconStyle: React.CSSProperties = {
    filter: 'invert(11%) sepia(31%) saturate(1715%) hue-rotate(183deg) brightness(96%) contrast(102%)',
    width: '36px',
    height: '36px',
  };

  const subcategoryNames: Record<string, string> = {
    karmienie: 'Podczas karmienia',
    narowy: 'Narowy',
    odejscie: 'Odejście od koni',
    uwiaz: 'Prowadzenie na uwiązie',
    vaa: 'Test VAA',
    fha: 'Test FHA',
    czyszczenie: 'Podczas czyszczenia',
    ubieranie: 'Podczas ubierania',
    pysk: 'Zachowania pyska',
    glowa: 'Głowa i szyja',
    ogon: 'Ogon',
    chod: 'Chód',
    opor: 'Opór',
    oddech: 'Oddech',
    spocenie: 'Spocenie',
    otoczenie: 'Reakcja na otoczenie',
    interakcja: 'Interakcja z człowiekiem',
    apetyt: 'Apetyt',
    transport: 'Transport',
    kowal: 'Wizyta kowala',
    zawody: 'Stajnia domowa a zawody zewnętrzne',
  };

  const prefixToLabel: Record<string, string> = {
    karmienie: 'Podczas karmienia',
    narowy: 'Narowy',
    odejscie: 'Odejście od koni',
    uwiaz: 'Prowadzenie na uwiązie',
    vaa: 'Test VAA',
    fha: 'Test FHA',
    czyszczenie: 'Podczas czyszczenia',
    ubieranie: 'Podczas ubierania',
    pysk: 'Zachowania pyska',
    glowa: 'Głowa i szyja',
    ogon: 'Ogon',
    chod: 'Chód',
    opor: 'Opór',
    oddech: 'Oddech',
    spocenie: 'Spocenie',
    otoczenie: 'Reakcja na otoczenie',
    interakcja: 'Interakcja z człowiekiem',
    apetyt: 'Apetyt',
    transport: 'Transport',
    kowal: 'Wizyta kowala',
    zawody: 'Stajnia domowa a zawody zewnętrzne',
  };

  const [showModal, setShowModal] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const checkStepCompletion = (stepIndex: number): { completed: boolean; missing: string[] } => {
    const stepPrefixes = [
      ['karmienie', 'narowy', 'odejscie', 'uwiaz'],
      ['vaa', 'fha', 'czyszczenie', 'ubieranie'],
      ['pysk', 'glowa', 'ogon', 'chod', 'opor'],
      ['oddech', 'spocenie', 'otoczenie', 'interakcja', 'apetyt'],
      ['transport', 'kowal', 'zawody']
    ];

    const currentPrefixes = stepPrefixes[stepIndex];

    const missing = currentPrefixes.filter(prefix => {
      const hasAnswer = Object.entries(formData).some(([key, val]) => {
        const isNarowyInne = prefix === 'narowy' && key === 'narowy_inne' && val === true;
        return (key.startsWith(prefix + '_') && val === true) || isNarowyInne;
      });
      return !hasAnswer;
    });

    return {
      completed: missing.length === 0,
      missing: missing.map(m => subcategoryNames[m] || m)
    };
  };

  const handleNextStep = async (nextStep: number) => {
    const { completed, missing } = checkStepCompletion(currentStep);
    
    if (completed) {
      setCurrentStep(nextStep);
      setTimeout(() => {
        window.history.pushState({ step: nextStep }, '', window.location.pathname);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 0);
    } else {
      setMissingCategories(missing);
      setPendingStep(nextStep);
      setShowSkipModal(true);
    }
  };

  const handleSkipCategories = () => {
    if (pendingStep !== null) {
      setCurrentStep(pendingStep);
      setTimeout(() => {
        window.history.pushState({ step: pendingStep }, '', window.location.pathname);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 0);
      setShowSkipModal(false);
      setPendingStep(null);
      setMissingCategories([]);
    } else {
      handleContinueToSummary();
    }
  };

  const handleContinueToSummary = () => {
    setShowSkipModal(false);
    setPendingStep(null);
    setMissingCategories([]);
    
    window.history.pushState({ showSummary: true }, '', `${window.location.pathname}#summary`);
    setShowSummary(true);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);

    const selected = Object.entries(formData).filter(([_, val]) => val === true);
    const totalSelected = selected.length;

    let message = 'Dziękujemy za wypełnienie ankiety.';
    if (totalSelected > 20) {
      message += ' Uwaga: zaobserwowano wiele zachowań mogących wskazywać na stres lub dyskomfort.';
    } else if (totalSelected > 10) {
      message += ' Koń wykazuje umiarkowaną ilość zachowań wymagających obserwacji.';
    } else {
      message += ' Koń nie wykazuje znacznej liczby zachowań niepokojących.';
    }
    
    message += ' Brak odpowiedzi w niektórych kategoriach nie pozwala na pełną ocenę zachowania konia.';

    setSummaryText(message);
  };

  const handleGoBackToFill = () => {
    setShowSkipModal(false);
    setPendingStep(null);
    setMissingCategories([]);
  };

  const getCategorySpecialists = (category: string, answers: string[]): { type: string; label: string }[] => {
    const suggestions = specialistSuggestions[category] || [];
    return suggestions.filter(s => {
      if (s.condition) {
        return s.condition(answers);
      }
      return true;
    });
  };

  const getAllSpecialists = () => {
    const specialists = new Set<string>();
    const specialistsWithLabels: { type: string; label: string }[] = [];
    
    Object.entries(
      Object.entries(formData)
        .filter(([key, val]) => key !== 'narowy_inne_text' && val === true)
        .reduce((acc, [key]) => {
          const prefix = key.split('_')[0];
          const cat = prefixToLabel[prefix] || prefix;
          if (!acc[cat]) acc[cat] = [];
          
          const label = labelsByKey[key] || key;
          if (label) {
            acc[cat].push(label);
          }
          return acc;
        }, {} as Record<string, string[]>)
    ).forEach(([category, answers]) => {
      const categorySpecialists = getCategorySpecialists(category, answers);
      categorySpecialists.forEach(s => {
        if (!specialists.has(s.type)) {
          specialists.add(s.type);
          specialistsWithLabels.push(s);
        }
      });
    });
    
    return specialistsWithLabels;
  };

  const yearOptions = generateYearOptions();

  const handleFinalSubmit = () => {
    const finalStepPrefixes = ['transport', 'kowal', 'zawody'];
    
    const missing = finalStepPrefixes.filter(prefix => {
      const hasAnswer = Object.entries(formData).some(([key, val]) => {
        return key.startsWith(prefix + '_') && val === true;
      });
      return !hasAnswer;
    });

    if (missing.length > 0) {
      const subcategoryNamesMap: Record<string, string> = {
        transport: 'Transport',
        kowal: 'Wizyta kowala',
        zawody: 'Stajnia domowa a zawody zewnętrzne',
      };

      setMissingCategories(missing.map(m => subcategoryNamesMap[m]));
      setPendingStep(null);
      setShowSkipModal(true);
      return;
    }

    window.history.pushState({ showSummary: true }, '', `${window.location.pathname}#summary`);
    setShowSummary(true);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);

    const selected = Object.entries(formData).filter(([_, val]) => val === true);
    const totalSelected = selected.length;

    let message = 'Dziękujemy za wypełnienie ankiety.';
    if (totalSelected > 20) {
      message += ' Uwaga: zaobserwowano wiele zachowań mogących wskazywać na stres lub dyskomfort.';
    } else if (totalSelected > 10) {
      message += ' Koń wykazuje umiarkowaną ilość zachowań wymagających obserwacji.';
    } else {
      message += ' Koń nie wykazuje znacznej liczby zachowań niepokojących.';
    }
    
    message += ' Brak odpowiedzi w niektórych kategoriach nie pozwala na pełną ocenę zachowania konia.';

    setSummaryText(message);
  };

  const [labelsByKey, setLabelsByKey] = useState<Record<string, string>>({});

  const checkboxList = (items: string[], prefix: string) => {
    return items.map((label, i) => {
      const key = `${prefix}_${i}`;

      if (!labelsByKey[key]) {
        setLabelsByKey(prev => ({ ...prev, [key]: label }));
      }

      return (
        <label key={key} style={{ display: 'block', marginBottom: '0.4rem' }}>
          <input
            type="checkbox"
            name={key}
            checked={!!formData[key]}
            onChange={handleChange}
          />{' '}
          {label}
        </label>
      );
    });
  };

  const sections = [
    // === 1. Sytuacje codzienne ===
    <fieldset key="1" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
      <legend style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#0D1F40', padding: '0 0.5rem' }}>
        <strong>1. Sytuacje codzienne</strong>
      </legend>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#0D1F40', marginBottom: '0.5rem' }}>• Podczas karmienia (jednokrotny wybór)</h4>
        <div style={{ paddingLeft: '1rem' }}>
          {checkboxList([
            'Agresywny tylko do ludzi (atakuje lub straszy osobę karmiącą)',      
            'Agresywny do ludzi i koni (straszy lub próbuje ugryźć)',
            'Agresywny tylko do koni (atakuje inne konie)',
            'Niecierpliwy (kopie przednią nogą, wierci się po boksie)',
            'Dopomina się delikatnie (rży i wypatruje osoby karmiącej)',
            'Spokojnie czeka na karmienie (nie denerwuje się)',
          ], 'karmienie')}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#0D1F40', marginBottom: '0.5rem' }}>• Narowy (wielokrotny wybór)</h4>
        <div style={{ paddingLeft: '1rem' }}>
          {checkboxList([
            'Łykanie (połykanie powietrza)',
            'Tkanie (bujanie się)',
            'Heblowanie (tarcie zębami o powierzchnie)',
            'Krążenie po boksie',
            'Lizanie/gryzienie ścian',
            'Autoagresja (gryzienie się po piersiach, bokach)',
            'Inne narowy',
            'Koń nie ma narowów',
          ], 'narowy')}
        </div>

        <div style={{ paddingLeft: '1rem', marginTop: '0.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.4rem' }}>
            <input
              type="checkbox"
              name="narowy_inne"
              checked={!!formData['narowy_inne']}
              onChange={handleChange}
            />{' '}
            Inne narowy
          </label>

          {formData['narowy_inne'] === true && (
            <input
              type="text"
              name="narowy_inne_text"
              value={typeof formData['narowy_inne_text'] === 'string' ? formData['narowy_inne_text'] : ''}
              onChange={handleChange}
              placeholder="Wpisz inne narowy (opcjonalnie)"
              style={{ marginTop: '0.5rem', display: 'block', width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          )}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#0D1F40', marginBottom: '0.5rem' }}>• Odejście od koni (jednokrotny wybór)</h4>
        <div style={{ paddingLeft: '1rem' }}>
          {checkboxList([
            'Koń łatwo odłącza się od innych koni',
            'Zaniepokojony, ale reaguje na polecenia osoby prowadzącej',
            'Niebezpieczny, nie reaguje na polecenia prowadzącego',
          ], 'odejscie')}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#0D1F40', marginBottom: '0.5rem' }}>• Prowadzenie na uwiązie (jednokrotny wybór)</h4>
        <div style={{ paddingLeft: '1rem' }}>
          {checkboxList([
            'Chętnie podąża za człowiekiem i reaguje na polecenia',
            'Wymaga korekt co jakiś czas',
            'Skupiony na otoczeniu, nie reaguje na polecenia prowadzącego',
          ], 'uwiaz')}
        </div>
      </div>
    </fieldset>,

    // === 2. Przed treningiem ===
    <fieldset key="2" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
      <legend style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#0D1F40', padding: '0 0.5rem' }}>
        <strong>2. Przed treningiem</strong>
      </legend>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#0D1F40', marginBottom: '0.5rem' }}>• Test VAA – kontakt dobrowolny (jednokrotny wybór)</h4>
        <div style={{ paddingLeft: '1rem' }}>
          {checkboxList([
            'Koń podchodzi, chce powąchać rękę',
            'Koń nie podchodzi i nie nawiązuje kontaktu',
            'Unikanie lub agresja - koń odwraca się zadem lub straszy ugryzieniem',
          ], 'vaa')}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#0D1F40', marginBottom: '0.5rem' }}>• Test FHA – kontakt wymuszony (jednokrotny wybór)</h4>
        <div style={{ paddingLeft: '1rem' }}>
          {checkboxList([
            'Zachowania agresywno - obronne (straszenie, gryzienie, kopanie)',
            'Unikanie (odsuwanie się przy próbie dotyku)',
            'Chęć kontaktu (pozostaje spokojny, ciekawy, pozwala na dotyk)',
          ], 'fha')}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#0D1F40', marginBottom: '0.5rem' }}>• Podczas czyszczenia (wielokrotny wybór)</h4>
        <div style={{ paddingLeft: '1rem' }}>
          {checkboxList([
            'Koń nie może być wiązany lub musi być wiązany na dwóch uwiązach',
            'Odsuwanie się od szczotki przy czyszczeniu grzbietu lub okolic popręgu (ugina plecy, unosi grzbiet)',
            'Nie pozwala dotknąć głowy lub uszu',
            'Nie podnosi wszystkich nóg',
            'Koń stoi spokojnie, przywiązany na pojedynczym uwiązie, podaje wszystkie kopyta',
          ], 'czyszczenie')}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#0D1F40', marginBottom: '0.5rem' }}>• Podczas ubierania (wielokrotny wybór)</h4>
        <div style={{ paddingLeft: '1rem' }}>
          {checkboxList([
            'Intensywne gryzienie wędzidła',
            'Cofnięte uszy',
            'Intensywne wpatrywanie się z położonymi uszami',
            'Wiercenie się / nerwowość',
            'Machanie ogonem',
            'Obracanie głową w stronę popręgu',
            'Próby ugryzienia jeźdźca',
            'Pocieranie nosem jeźdźca',
            'Zadzieranie głowy przy zakładaniu ogłowia',
            'Wymagana pomoc drugiej osoby',
            'Koń stoi spokojnie podczas ubierania',
          ], 'ubieranie')}
        </div>
      </div>
    </fieldset>,

    // === 3. Podczas treningu ===
    <fieldset key="3" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
      <legend style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#0D1F40', padding: '0 0.5rem' }}>
        <strong>3. Podczas treningu</strong>
      </legend>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#0D1F40', marginBottom: '0.5rem' }}>• Zachowania pyska (wielokrotny wybór)</h4>
        <div style={{ paddingLeft: '1rem' }}>
          {checkboxList([
            'Uszy cofnięte przez ≥5 sekund',
            'Zamknięte oczy przez 2-5 sekund',
            'Widoczna twardówka (białko oka)',
            'Pusty wzrok przez ≥5 sekund',
            'Otwieranie/zamykanie pyska ≥10 sekund',
            'Ruch języka, wysuwanie',
            'Przesunięcie wędzidła na jedną stronę, opieranie się na jednej wodzy',
            'Koń nie wykazuje nieprawidłowości w ustawieniu głowy i szyi',
          ], 'pysk')}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#0D1F40', marginBottom: '0.5rem' }}>• Głowa i szyja (wielokrotny wybór)</h4>
        <div style={{ paddingLeft: '1rem' }}>
          {checkboxList([
            'Unoszenie/opuszczanie głowy niesynchroniczne z ruchem kłusa',
            'Przechylanie głowy',
            'Głowa powyżej pionu ≥10s',
            'Głowa za pionem ≥10s',
            'Rzucanie, skręcanie głową, kręcenie głową na boki',
            'Koń nie wykazuje żadnego z powyższych zachowań',
          ], 'glowa')}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#0D1F40', marginBottom: '0.5rem' }}>• Ogon (jednokrotny wybór)</h4>
        <div style={{ paddingLeft: '1rem' }}>
          {checkboxList([
            'Ogon trzymany na bok',
            'Ogon wciśnięty między pośladkami',
            'Energiczne, nerwowe machanie ogonem',
            'Ogon bez napięcia, zwisający swobodnie',
          ], 'ogon')}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#0D1F40', marginBottom: '0.5rem' }}>• Chód (wielokrotny wybór)</h4>
        <div style={{ paddingLeft: '1rem' }}>
          {checkboxList([
            'Zbyt szybkie tempo (>40 kroków/15s)',
            'Zbyt wolne tempo (<35 kroków/15s)',
            'Trzyśladowy ruch',
            'Błędy galopu: zmiany nóg, galop krzyżowy',
            'Samoczynne zmiany chodu',
            'Potykanie się, ciągnięcie czubków kopyt',
            'Koń porusza się swobodnym, rytmicznym chodem',
          ], 'chod')}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#0D1F40', marginBottom: '0.5rem' }}>• Opór (wielokrotny wybór)</h4>
        <div style={{ paddingLeft: '1rem' }}>
          {checkboxList([
            'Zmiana kierunku / płoszenie się / ponoszenie',
            'Opór przed ruchem, zatrzymywanie się / odmowa wykonania ruchu, np. skoków',
            'Stawanie dęba',
            'Brykanie',
            'Koń chętnie współpracuje i wykonuje polecenia',
          ], 'opor')}
        </div>
      </div>
    </fieldset>,

    // === 4. Po treningu ===
    <fieldset key="4" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
      <legend style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#0D1F40', padding: '0 0.5rem' }}>
        <strong>4. Po treningu</strong>
      </legend>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#0D1F40', marginBottom: '0.5rem' }}>• Oddech (jednokrotny wybór)</h4>
        <div style={{ paddingLeft: '1rem' }}>
          {checkboxList([
            'Koń oddycha intensywnie pracując bokami',
            'Koń nie pracuje intensywnie bokami, ale wykonuje 1 oddech w ciągu ok. 1-2 sekund',
            'Koń wykonuje 1 oddech na min. 3-4 sekundy',
          ], 'oddech')}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#0D1F40', marginBottom: '0.5rem' }}>• Spocenie (jednokrotny wybór)</h4>
        <div style={{ paddingLeft: '1rem' }}>
          {checkboxList([
            'Nie jest spocony',
            'Jest spocony u podstawy szyi i pod siodłem',
            'Jest intensywnie spocony na szyi, pod siodłem, w okolicach słabizny, ale nie widać skapujących strużek potu ani piany',
            'Pot skapuje z konia i jest miejscami spieniony',
          ], 'spocenie')}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#0D1F40', marginBottom: '0.5rem' }}>• Reakcja na otoczenie (jednokrotny wybór)</h4>
        <div style={{ paddingLeft: '1rem' }}>
          {checkboxList([
            'Zainteresowany otoczeniem',
            'Obojętny na otoczenie',
            'Zaniepokojony otoczeniem',
          ], 'otoczenie')}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#0D1F40', marginBottom: '0.5rem' }}>• Interakcja z człowiekiem (jednokrotny wybór)</h4>
        <div style={{ paddingLeft: '1rem' }}>
          {checkboxList([
            'Koń chętnie podąża za człowiekiem, szuka kontaktu, chce powąchać dotknąć',
            'Koń obojętny wobec człowieka, nie szuka kontaktu',
            'Koń wykazujacy lęk lub agresję, reaguje nerwowo i przesadnie na gesty człowieka',
          ], 'interakcja')}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#0D1F40', marginBottom: '0.5rem' }}>• Apetyt (jednokrotny wybór)</h4>
        <div style={{ paddingLeft: '1rem' }}>
          {checkboxList([
            'Koń jest zainteresowany jedzeniem, w drugiej kolejności napije się wody',
            'Koń spragniony, dopiero po napojeniu zainteresowany jedzeniem',
            'Koń niezainteresowany ani jedzeniem, ani wodą',
          ], 'apetyt')}
        </div>
      </div>
    </fieldset>,

    // === 5. Sytuacje dodatkowe ===
    <fieldset key="5" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
      <legend style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#0D1F40', padding: '0 0.5rem' }}>
        <strong>5. Sytuacje dodatkowe</strong>
      </legend>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#0D1F40', marginBottom: '0.5rem' }}>• Transport (jednokrotny wybór)</h4>
        <div style={{ paddingLeft: '1rem' }}>
          {checkboxList([
            'koń chętnie wchodzi do przyczepy/koniowozu',
            'są trudności z wejściem do przyczepy/koniowozu, ale zwykle nie zajmuje to dłużej niż 15 min',
            'koń stawia wyraźny opór przed wejściem do przyczepy/koniowozu - załadunek trwa min 30min a czasem dłużej lub w ogóle nie da się konia załadować',
          ], 'transport')}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#0D1F40', marginBottom: '0.5rem' }}>• Wizyta kowala (wielokrotny wybór)</h4>
        <div style={{ paddingLeft: '1rem' }}>
          {checkboxList([
            'koń spokojnie stoi podczas całej wizyty kowala',
            'koń stoi spokojnie tylko na początku wizyty, z czasem zaczyna się kręcić i stawiać opór',
            'koń już na początku wizyty sprawia problemy, kowal nie może wykonać korekcji kopyt bo koń wyrywa nogi lub w ogóle nie chce ich podać',
            'koń kopie przy próbie podniesienia kopyt przez kowala lub stwarza inne niebezpieczne sytuacje',
          ], 'kowal')}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#0D1F40', marginBottom: '0.5rem' }}>• Stajnia domowa a zawody zewnętrzne (jednokrotny wybór)</h4>
        <div style={{ paddingLeft: '1rem' }}>
          {checkboxList([
            'w domu i na zawodach zewnętrznych koń przedstawia taki sam poziom umiejętności',
            'na zawodach zewnętrznych koń wykazuje gorszą dyspozycję fizyczną niż w domu, szybciej się męczy, jednak nie wynika to ze stresu psychicznego (przykład: więcej zrzutek na parkurze lub mniej energii podczas wykonywania parkuru lub czworoboku)',
            'koń emocjonalnie źle znosi udział w zawodach, reaguje poniżej umiejętności jakie przejawia w stajni domowej (przykład: przejawianie oporu w postaci wierzgania, stawanie dęba, odmowy skoku, płoszenie się, niechęć do ruchu nie wynikająca ze zmęczenia fizycznego, ponoszenie)',
          ], 'zawody')}
        </div>
      </div>
    </fieldset>
  ];

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '2rem 1rem', 
      lineHeight: '1.6',
      fontFamily: 'Segoe UI, Roboto, sans-serif',
    }}>
      <h2 style={{ 
        fontSize: 'clamp(1.5rem, 5vw, 2rem)', 
        color: '#0D1F40', 
        marginBottom: '1.5rem',
        borderBottom: '2px solid #0D1F40',
        paddingBottom: '0.5rem'
      }}>
        Ocena zachowania konia
      </h2>

      {!showSummary ? (
        <form>
          {currentStep === 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ 
                background: '#f0f4ff', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                textAlign: 'justify',
                fontSize: '1rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                Wypełnienie wszystkich pól pomoże Ci uzyskać pełny obraz zachowań Twojego konia.
                Dowiesz się, które zachowania są prawidłowe, które wymagają obserwacji, a które
                sygnalizują potrzebę szybkiej reakcji. Dzięki temu uświadomisz sobie, na jakie
                objawy zwracasz uwagę, a które dotąd mogły Ci umknąć, rozwijając swoją umiejętność
                obserwacji zachowań konia. Jeśli w którymś obszarze pojawią się dla Ciebie
                nowe zachowania, znajdziesz na naszej stronie materiały szkoleniowe
                omawiające je w wybranych sytuacjach.
              </p>

              <p style={{ fontStyle: 'italic', color: '#666', marginBottom: '1rem' }}>
                <span style={{ color: 'red' }}>*</span> Pola obowiązkowe
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1.5rem',
                  maxWidth: '900px',
                }}
              >
                <label style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong>Imię konia <span style={{ color: 'red' }}>*</span></strong>
                  <input
                    type="text"
                    name="imie_konia"
                    value={horseName}
                    onChange={(e) => !horseId && setHorseName(e.target.value)}
                    readOnly={!!horseId}
                    required
                    style={{
                      marginTop: '0.4rem',
                      background: horseId ? "#f9f9f9" : "white",
                      border: "1px solid #ccc",
                      borderRadius: '6px',
                      padding: '0.6rem'
                    }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong>Rasa <span style={{ color: 'red' }}>*</span></strong>
                  <select
                    value={horseBreed}
                    onChange={(e) => setHorseBreed(e.target.value)}
                    required
                    style={{
                      marginTop: '0.4rem',
                      padding: '0.6rem',
                      border: '1px solid #ccc',
                      borderRadius: '6px',
                    }}
                  >
                    <option value="">-- wybierz rasę --</option>
                    <option value="SP">SP (szlachetna półkrew)</option>
                    <option value="xx">Thoroughbred (pełnej krwi)</option>
                    <option value="arab">Koń arabski</option>
                    <option value="haflinger">Haflinger</option>
                    <option value="ślązak">Ślązak</option>
                    <option value="inna">Inna</option>
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong>Rok urodzenia <span style={{ color: 'red' }}>*</span></strong>
                  <select
                    value={horseBirthYear}
                    onChange={(e) => setHorseBirthYear(e.target.value)}
                    required
                    style={{
                      marginTop: '0.4rem',
                      padding: '0.6rem',
                      border: '1px solid #ccc',
                      borderRadius: '6px',
                    }}
                  >
                    <option value="">-- wybierz rok --</option>
                    {yearOptions.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong>Płeć <span style={{ color: 'red' }}>*</span></strong>
                  <select
                    value={horseSex}
                    onChange={(e) => setHorseSex(e.target.value)}
                    required
                    style={{
                      marginTop: '0.4rem',
                      padding: '0.6rem',
                      border: '1px solid #ccc',
                      borderRadius: '6px',
                    }}
                  >
                    <option value="">-- wybierz --</option>
                    <option value="klacz">Klacz</option>
                    <option value="ogier">Ogier</option>
                    <option value="wałach">Wałach</option>
                  </select>
                </label>
              </div>
              <br />
            </div>
          )}

          {sections[currentStep]}

          <div style={{ 
            marginTop: '2rem', 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '1rem', 
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => {
                  const prevStep = currentStep - 1;
                  setCurrentStep(prevStep);
                  setTimeout(() => {
                    window.history.pushState({}, '', window.location.pathname);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }, 0);
                }}
                style={btnStyle}
              >
                ← Wstecz
              </button>
            )}

            <span style={{ fontWeight: 'bold', color: '#0D1F40' }}>
              {currentStep + 1} z {sections.length}
            </span>

            {currentStep < sections.length - 1 ? (
              <button
                type="button"
                onClick={async () => {
                  if (!horseName.trim() || !horseBreed || !horseBirthYear || !horseSex) {
                    await showDialog("⚠️ Uzupełnij obowiązkowe pola: imię, rasa, rok urodzenia i płeć.");
                    return;
                  }
                  await handleNextStep(currentStep + 1);
                }}
                style={btnStyle}
              >
                Dalej →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!horseName.trim() || !horseBreed || !horseBirthYear || !horseSex) {
                    setModalMessage("⚠️ Uzupełnij obowiązkowe pola: imię, rasa, rok urodzenia i płeć.");
                    setShowModal(true);
                    return;
                  }
                  handleFinalSubmit();
                }}
                style={btnStyle}
              >
                Zobacz wynik
              </button>
            )}
          </div>
        </form>
      ) : (
        <div ref={summaryRef} style={{ padding: '1.5rem', background: '#f9f9f9', borderRadius: '12px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.5rem', color: '#0D1F40', marginBottom: '1rem' }}>📋 Podsumowanie zachowania</h3>
            <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>{summaryText}</p>

            <div style={{ marginTop: '2rem' }}>
              <button
                onClick={() => setShowAnswers(prev => !prev)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0D1F40',
                  fontWeight: 600,
                  fontSize: '16px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  marginBottom: '1rem'
                }}
              >
                {showAnswers ? 'Ukryj zaznaczone odpowiedzi ⯅' : 'Pokaż zaznaczone odpowiedzi ⯆'}
              </button>

              {showAnswers && (
                <div>
                  {categoryOrder.map((category) => {
                    const categoryPrefixes = Object.entries(prefixToCategory)
                      .filter(([_, cat]) => cat === category)
                      .map(([prefix]) => prefix);
                    
                    const categoriesWithAnswers = Object.entries(
                      Object.entries(formData)
                        .filter(([key, val]) => key !== 'narowy_inne_text' && val === true)
                        .reduce((acc, [key]) => {
                          const prefix = key.split('_')[0];
                          const cat = prefixToCategory[prefix] || 'Inne';
                          if (cat === category) {
                            if (!acc[prefix]) acc[prefix] = [];
                            acc[prefix].push({ key, val: true });
                          }
                          return acc;
                        }, {} as Record<string, { key: string; val: boolean }[]>)
                    ).map(([prefix]) => prefix);
                    
                    const categoriesWithoutAnswers = categoryPrefixes.filter(
                      prefix => !categoriesWithAnswers.includes(prefix)
                    );

                    return (
                      <fieldset
                        key={category}
                        style={{
                          border: '1px solid #ccc',
                          borderRadius: '8px',
                          padding: '1.5rem',
                          marginBottom: '1.5rem',
                          background: 'white'
                        }}
                      >
                        <legend style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#0D1F40', padding: '0 0.5rem' }}>
                          {category}
                        </legend>

                        {Object.entries(
                          Object.entries(formData)
                            .filter(([key, val]) =>
                              key !== 'narowy_inne_text' &&
                              (val === true || (typeof val === 'string' && val.trim() !== ''))
                            )
                            .reduce((acc, [key, val]) => {
                              const prefix = key.split('_')[0];
                              const cat = prefixToCategory[prefix] || 'Inne';
                              if (cat === category) {
                                if (!acc[prefix]) acc[prefix] = [];
                                acc[prefix].push({ key, val });
                              }
                              return acc;
                            }, {} as Record<string, { key: string; val: boolean | string }[]>)
                        ).map(([prefix, items]) => (
                          <div key={prefix} style={{ marginBottom: '1.5rem', borderBottom: '1px dashed #eee', paddingBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <strong style={{ fontSize: '1rem' }}>{prefixToLabel[prefix] || prefix}</strong>
                              <span style={{
                                fontSize: '0.9rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                background: (() => {
                                  const color = getSubcategoryColor(prefixToLabel[prefix] || prefix, items.map(({ key }) => labelsByKey[key] || key));
                                  return color === 'red' ? '#ffebee' : color === 'yellow' ? '#fff8e1' : color === 'green' ? '#e8f5e9' : '#f5f5f5';
                                })(),
                                color: (() => {
                                  const color = getSubcategoryColor(prefixToLabel[prefix] || prefix, items.map(({ key }) => labelsByKey[key] || key));
                                  return color === 'red' ? '#c62828' : color === 'yellow' ? '#f57c00' : color === 'green' ? '#2e7d32' : '#757575';
                                })()
                              }}>
                                {(() => {
                                  const color = getSubcategoryColor(prefixToLabel[prefix] || prefix, items.map(({ key }) => labelsByKey[key] || key));
                                  const descriptions: Record<string, string> = {
                                    green: '● Zachowanie pożądane',
                                    yellow: '● Wymaga korekty',
                                    red: '● Wymaga pilnej korekty',
                                    gray: '● Brak odpowiedzi - nie oceniono'
                                  };
                                  return descriptions[color];
                                })()}
                              </span>
                            </div>

                            <ul style={{ marginTop: '0.3rem', marginBottom: '0.5rem', paddingLeft: '1.5rem' }}>
                              {items.map(({ key, val }) => {
                                const label = labelsByKey[key] || key.replace(/_/g, ' ');
                                return (
                                  <li key={key} style={{ marginBottom: '0.2rem' }}>
                                    {label}
                                    {typeof val === 'string' ? `: ${val}` : ''}
                                  </li>
                                );
                              })}
                              {prefix === 'narowy' &&
                                formData['narowy_inne'] === true &&
                                formData['narowy_inne_text'] && (
                                  <li style={{ marginBottom: '0.2rem' }}>
                                    <em>Inne narowy:</em> {(formData['narowy_inne_text'] as string).trim()}
                                  </li>
                              )}
                            </ul>
                          </div>
                        ))}
                        
                        {categoriesWithoutAnswers.length > 0 && (
                          <div style={{ marginTop: '1rem' }}>
                            <p style={{ fontWeight: 'bold', color: '#0D1F40', marginBottom: '0.5rem' }}>
                              Kategorie bez odpowiedzi:
                            </p>
                            {categoriesWithoutAnswers.map(prefix => (
                              <div key={prefix} style={{ 
                                marginBottom: '1rem', 
                                padding: '1rem', 
                                backgroundColor: '#f5f5f5',
                                borderRadius: '6px',
                                border: '1px dashed #ccc'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                  <strong style={{ fontSize: '1rem' }}>{prefixToLabel[prefix] || prefix}</strong>
                                  <span style={{
                                    fontSize: '0.9rem',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px',
                                    background: '#f5f5f5',
                                    color: '#757575'
                                  }}>
                                    ● Brak odpowiedzi - nie oceniono
                                  </span>
                                </div>
                                <p style={{ color: '#666', fontStyle: 'italic', marginLeft: '1rem' }}>
                                  Nie udzielono odpowiedzi w tej kategorii
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {categoriesWithAnswers.length === 0 && categoriesWithoutAnswers.length === 0 && (
                          <p style={{ color: '#757575', fontStyle: 'italic' }}>
                            Brak kategorii w tej sekcji
                          </p>
                        )}
                      </fieldset>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ 
              marginTop: '2rem', 
              padding: '1.5rem', 
              background: '#e8f0fe', 
              borderRadius: '8px',
              border: '1px solid #0D1F40'
            }}>
              <h4 style={{ color: '#0D1F40', marginBottom: '1rem' }}>👨‍⚕️ Sugerowani specjaliści</h4>
              <p style={{ marginBottom: '1rem' }}>
                Na podstawie Twoich odpowiedzi, poniżsi specjaliści mogą pomóc w rozwiązaniu problemów:
              </p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                {getAllSpecialists().map((spec, index) => (
                  <Link
                    key={index}
                    href={`/znajdz?specialization=${encodeURIComponent(spec.label)}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <span style={{
                      display: 'inline-block',
                      padding: '0.5rem 1rem',
                      background: 'white',
                      border: '2px solid #0D1F40',
                      borderRadius: '30px',
                      color: '#0D1F40',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#0D1F40';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = '#0D1F40';
                    }}>
                      {spec.label}
                    </span>
                  </Link>
                ))}
                {getAllSpecialists().length === 0 && (
                  <p style={{ color: '#666' }}>Brak sugerowanych specjalistów dla zaznaczonych odpowiedzi.</p>
                )}
              </div>
              
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                Kliknij na specjalistę, aby znaleźć odpowiedniego eksperta w swojej okolicy.
              </p>
            </div>

            <div style={{ 
              marginTop: '2rem', 
              display: 'flex', 
              justifyContent: 'center', 
              flexWrap: 'wrap', 
              gap: '1.5rem',
              alignItems: 'stretch'
            }}>
              <button
                onClick={() => {
                  setFormData({});
                  setInneNarowy('');
                  setCurrentStep(0);
                  setShowSummary(false);
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }, 0);
                }}
                style={iconBtnStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                <img
                  src="/images/repeat.svg"
                  alt="Wykonaj ponownie"
                  width={36}
                  height={36}
                  style={svgIconStyle}
                />
                <span style={{ marginTop: '0.5rem' }}>Wykonaj ocenę ponownie</span>
              </button>

              <div style={{ 
                ...iconBtnStyle,
                backgroundColor: userExists === null ? '#f5f5f5' : 'white',
                cursor: userExists === null ? 'not-allowed' : 'pointer',
                opacity: userExists === null ? 0.6 : 1,
                minWidth: '200px',
              }}>
                <div style={{ marginBottom: '1rem', width: '100%' }}>
                  <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                    Podaj swój e-mail:
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={finalEmail}
                    onChange={(e) => {
                      if (!isLoggedIn) setTypedEmail(e.target.value);
                    }}
                    readOnly={isLoggedIn}
                    placeholder="Twój adres e-mail"
                    style={{
                      padding: '0.5rem',
                      border: '1px solid #ccc',
                      borderRadius: '6px',
                      width: '100%',
                      fontSize: '0.9rem',
                    }}
                    required
                  />
                </div>

                <button
                  onClick={handleSaveClick}
                  disabled={userExists === null}
                  style={{
                    background: '#0D1F40',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
                    width: '100%',
                    cursor: userExists === null ? 'not-allowed' : 'pointer',
                    opacity: userExists === null ? 0.6 : 1,
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                  }}
                >
                  Zapisz wynik
                </button>
              </div>

              <button
                onClick={() => {
                  window.location.href = '/znajdz';
                }}
                style={iconBtnStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                <img
                  src="/images/magnifying-glass.svg"
                  alt="Znajdź specjalistę"
                  width={36}
                  height={36}
                  style={svgIconStyle}
                />
                <span style={{ marginTop: '0.5rem' }}>Znajdź specjalistę</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - brak odpowiedzi */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#0D1F40' }}>Uwaga</h3>
            <p style={{ whiteSpace: 'pre-wrap', fontSize: '14px', marginBottom: '1.5rem' }}>{modalMessage}</p>
            <button
              style={{ 
                padding: '0.5rem 1.5rem', 
                background: '#0D1F40', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontSize: '1rem'
              }}
              onClick={() => setShowModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Modal - pomijanie kategorii */}
      {showSkipModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '450px',
            width: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#0D1F40' }}>Brak odpowiedzi w kategoriach</h3>
            <p style={{ marginBottom: '1rem' }}>
              Nie udzieliłeś odpowiedzi w następujących kategoriach:
            </p>
            <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
              {missingCategories.map((cat, index) => (
                <li key={index} style={{ fontWeight: 'bold', color: '#0D1F40' }}>{cat}</li>
              ))}
            </ul>
            <p style={{ marginBottom: '1.5rem', fontStyle: 'italic', color: '#666' }}>
              Brak odpowiedzi nie pozwala na pełną ocenę zachowania konia. Możesz wrócić i uzupełnić odpowiedzi lub kontynuować bez nich.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={handleGoBackToFill}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#0D1F40',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                Wróć i uzupełnij
              </button>
              <button
                onClick={handleSkipCategories}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#ccc',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                Kontynuuj bez odpowiedzi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - logowanie */}
      {showLoginToSaveModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#fff', padding: '2rem', borderRadius: '12px',
            width: '100%', maxWidth: '400px', textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#0D1F40' }}>Zaloguj się, aby zapisać ocenę</h3>
            <p style={{ marginBottom: '1.5rem' }}>Ten adres e-mail jest już zarejestrowany. Wprowadź hasło, aby się zalogować i zapisać ocenę.</p>

            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Hasło"
              style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', borderRadius: '6px', border: '1px solid #ccc' }}
            />

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                style={{ padding: '0.5rem 1.5rem', background: '#0D1F40', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                onClick={async () => {
                  try {
                    const auth = getAuth(app);
                    const cred = await signInWithEmailAndPassword(auth, finalEmail, loginPassword);

                    if (cred.user) {
                      await saveToOwnerAccount(formData, finalEmail, 'wlasciciel');
                      await showDialog('✅ Ocena została zapisana i jest dostępna w panelu właściciela.');
                      setShowLoginToSaveModal(false);
                      setLoginPassword('');
                    }
                  } catch (err: any) {
                    console.error('❌ Błąd logowania:', err);
                    await showDialog('Błędne hasło lub brak konta. Spróbuj ponownie.');
                  }
                }}
              >
                Zaloguj i zapisz
              </button>

              <button
                onClick={() => {
                  setShowLoginToSaveModal(false);
                  setLoginPassword('');
                }}
                style={{ padding: '0.5rem 1.5rem', background: '#ccc', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - e-mail */}
      {showEmailModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#fff',
            padding: '2rem',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#0D1F40' }}>Zapisz wynik</h3>
            <p style={{ marginBottom: '1.5rem' }}>Podaj e-mail i wybierz, co chcesz zrobić:</p>

            <button
              onClick={async () => {
                if (!email) {
                  await showDialog('Podaj poprawny adres e-mail.');
                  return;
                }
                saveToTemporaryAccount(email, formData);
                await showDialog('📩 Wysłaliśmy link do tymczasowego konta. Masz 7 dni na rejestrację.');
                setShowEmailModal(false);
              }}
              style={{ marginBottom: '1rem', width: '100%', padding: '0.75rem', background: '#0D1F40', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Zapisz jako tymczasowy
            </button>

            <button
              onClick={() => {
                window.location.href = `/rejestracja?redirect=ankieta`;
              }}
              style={{ marginBottom: '0.5rem', width: '100%', padding: '0.75rem', background: '#0D1F40', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Załóż konto i zapisz
            </button>

            <button
              onClick={() => {
                window.location.href = `/logowanie?redirect=ankieta`;
              }}
              style={{ width: '100%', padding: '0.75rem', background: '#0D1F40', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Zaloguj się
            </button>
          </div>
        </div>
      )}

      {/* Modal - rejestracja */}
      {showConfirmRegisterModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#fff', padding: '2rem', borderRadius: '12px',
            width: '100%', maxWidth: '400px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#0D1F40' }}>Utwórz konto</h3>
            <p style={{ marginBottom: '1.5rem' }}>Uzupełnij dane, by zarejestrować konto właściciela:</p>

            <input
              type="text"
              placeholder="Imię i nazwisko"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}
            />
            <input
              type="password"
              placeholder="Hasło"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}
            />
            <input
              type="password"
              placeholder="Powtórz hasło"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}
            />

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={handleConfirmRegistration}
                style={{ padding: '0.75rem 1.5rem', background: '#0D1F40', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Potwierdź
              </button>

              <button
                onClick={() => setShowConfirmRegisterModal(false)}
                style={{ padding: '0.75rem 1.5rem', background: '#ccc', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}