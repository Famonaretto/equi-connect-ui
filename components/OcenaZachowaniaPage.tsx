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
};

const categoryOrder = [
  'Sytuacje codzienne',
  'Przed treningiem',
  'Podczas treningu',
  'Po treningu'
];


const behaviorColorMap: Record<string, 'red' | 'yellow' | 'green'> = {
  // Podczas karmienia
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
  
  console.log('Wysyłam:', { formData: formData, email: email, userRole: userRole });


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
  onBack: () => void;   // 👈 nowy props
};


export default function OcenaZachowaniaPage({ horseId, onBack }: OcenaZachowaniaPageProps) {
const [horseName, setHorseName] = useState<string>("");

useEffect(() => {
  if (horseId) {
    // tryb z profilu konia → pobieramy imię z bazy
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
console.log('Dane użytkownika:', user);

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

  // ✅ 1. Jeśli zalogowany – pobierz jego UID
  if (user) {
    ownerUid = user.uid;
  } else {
    // ✅ 2. Sprawdź, czy podany e-mail należy do właściciela
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
      // ⛔ Jeśli nie ma takiego właściciela – komunikat i return


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


if (!shouldCreateTemporaryAccount) return;

// 👉 poproś o hasło
const password = prompt('Utwórz hasło do konta tymczasowego:');
if (!password || password.length < 6) {
  await showDialog('Hasło musi mieć co najmniej 6 znaków.');
  return;
}

try {
  // 👉 1. Utwórz konto Firebase Auth
  const auth = getAuth(app);
  const userCred = await createUserWithEmailAndPassword(auth, finalEmail, password);
  const user = userCred.user;

  // 👉 2. Wyślij maila weryfikacyjnego
  await sendEmailVerification(user);

  // 👉 3. Dodaj użytkownika do kolekcji `users` jako tymczasowego
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    createdAt: serverTimestamp(),
    role: 'tymczasowy',
  });

  await showDialog('📩 Konto tymczasowe zostało utworzone. Sprawdź maila, by je aktywować.');

  // ✅ 4. Kontynuuj zapis oceny
  ownerUid = user.uid;
} catch (err: any) {
  console.error(err);
  await showDialog(err.message || 'Błąd podczas tworzenia konta.');
  return;
}

    }
  }

  // ✅ 3. Dodaj nowego konia jeśli nie ma horseId
  let newHorseId = horseId;

  if (!newHorseId) {
    const newHorseRef = await addDoc(collection(db, "konie"), {
      imie: horseName || "Koń bez imienia",
      status: "nowy",
      ownerUid: ownerUid,
      createdAt: serverTimestamp(),
    });

    newHorseId = newHorseRef.id;
    await showDialog("📌 Dodano nowego konia.");
  }

  // ✅ 4. Zapisz ocenę
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
  'oddech', 'spocenie', 'otoczenie', 'interakcja', 'apetyt', 'ogon'
]);

const allSubcategoryPrefixes = [
  // 1. Sytuacje codzienne
  'karmienie', 'narowy', 'odejscie', 'uwiaz',
  // 2. Przed treningiem
  'vaa', 'fha', 'czyszczenie', 'ubieranie',
  // 3. Podczas treningu
  'pysk', 'glowa', 'ogon', 'chod', 'opor',
  // 4. Po treningu
  'oddech', 'spocenie', 'otoczenie', 'interakcja', 'apetyt',
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

    // fallback – jeśli nic nie wiemy o stanie, cofamy krok
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

    // === Jeśli zaznaczasz odpowiedź wykluczającą ===
    if (isExclusive) {
      // Wyczyść wszystko z tej grupy
      keysInGroup.forEach(k => {
        updated[k] = false;
      });
      updated[name] = checked;
      return updated;
    }

    // === Jeśli zaznaczasz coś innego, a już jest zaznaczone exclusive ===
    if (!isExclusive && anyExclusiveSelected) {
      // Odznacz wykluczające
      keysInGroup.forEach(k => {
        const l = getLabelForKey(k);
        if (exclusiveBehaviors.has(l)) {
          updated[k] = false;
        }
      });
    }

    // === Jeśli to subkategoria z JEDNOKROTNYM wyborem ===
    if (isSingleSelect) {
      // Odznacz inne checkboxy z tej grupy
      keysInGroup.forEach(k => {
        updated[k] = false;
      });
    }

    // === W końcu zaznacz/odznacz aktualny checkbox ===
    updated[name] = checked;
    return updated;
  });
};



  // Pomocniczo: jeśli chcesz mapować nazwy inputów do labeli
  const formDataLabel = (key: string): string => {
    // Można zintegrować np. z obiektem mapującym inputy do labeli
    return key; // fallback – klucz jako label
  };

  const steps = ['Sytuacje codzienne', 'Przed treningiem', 'Podczas treningu', 'Po treningu'];

  const btnStyle = {
    background: '#0D1F40',
    color: '#fff',
    padding: '0.5rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
  };

  const iconBtnStyle: React.CSSProperties = {
    backgroundColor: 'white',
    border: '1px solid #ccc',
    borderRadius: '1rem',
    padding: '1rem',
    textAlign: 'center',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '160px',
    fontWeight: 600,
    color: '#0D1F40',
  };

  const svgIconStyle: React.CSSProperties = {
    filter: 'invert(11%) sepia(31%) saturate(1715%) hue-rotate(183deg) brightness(96%) contrast(102%)',
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
};

const prefixToLabel: Record<string, string> = {
  // 1. Sytuacje codzienne
  karmienie: 'Podczas karmienia',
  narowy: 'Narowy',
  odejscie: 'Odejście od koni',
  uwiaz: 'Prowadzenie na uwiązie',
  // 2. Przed treningiem
  vaa: 'Test VAA',
  fha: 'Test FHA',
  czyszczenie: 'Podczas czyszczenia',
  ubieranie: 'Podczas ubierania',
  // 3. Podczas treningu
  pysk: 'Zachowania pyska',
  glowa: 'Głowa i szyja',
  ogon: 'Ogon',
  chod: 'Chód',
  opor: 'Opór',
  // 4. Po treningu
  oddech: 'Oddech',
  spocenie: 'Spocenie',
  otoczenie: 'Reakcja na otoczenie',
  interakcja: 'Interakcja z człowiekiem',
  apetyt: 'Apetyt',
};


const [showModal, setShowModal] = useState(false);
const [showAnswers, setShowAnswers] = useState(false);

const [modalMessage, setModalMessage] = useState('');

const checkStepCompletion = (stepIndex: number): boolean => {
  const stepPrefixes = [
    ['karmienie', 'narowy', 'odejscie', 'uwiaz'],
    ['vaa', 'fha', 'czyszczenie', 'ubieranie'],
    ['pysk', 'glowa', 'ogon', 'chod', 'opor'],
    ['oddech', 'spocenie', 'otoczenie', 'interakcja', 'apetyt']
  ];

  const currentPrefixes = stepPrefixes[stepIndex];

  const missing = currentPrefixes.filter(prefix => {
return !Object.entries(formData).some(([key, val]) => {
  const isNarowyInne = prefix === 'narowy' && key === 'narowy_inne' && val === true;
  return (key.startsWith(prefix + '_') && val === true) || isNarowyInne;
});

  });

  if (missing.length > 0) {
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
    };

    const message = `Uzupełnij odpowiedzi w podkategoriach:\n\n${missing.map(m => '• ' + subcategoryNames[m]).join('\n')}`;
    setModalMessage(message);
    setShowModal(true);
    return false;
  }

  return true;
};


const handleFinalSubmit = () => {
  const finalStepPrefixes = ['oddech', 'spocenie', 'otoczenie', 'interakcja', 'apetyt'];

window.history.pushState({ showSummary: true }, '', `${window.location.pathname}#summary`);
setShowSummary(true);
setTimeout(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}, 0);


  const missing = finalStepPrefixes.filter(prefix => {
    return !Object.entries(formData).some(([key, val]) => {
      const isOtherNarowy = prefix === 'narowy' && key === 'narowy_inne' && val === true;
      return (key.startsWith(prefix + '_') && val === true) || isOtherNarowy;
    });
  });

  if (missing.length > 0) {
    const subcategoryNames: Record<string, string> = {
      oddech: 'Oddech',
      spocenie: 'Spocenie',
      otoczenie: 'Reakcja na otoczenie',
      interakcja: 'Interakcja z człowiekiem',
      apetyt: 'Apetyt',
    };

    const message = `Uzupełnij odpowiedzi w podkategoriach:\n\n${missing.map(m => '• ' + subcategoryNames[m]).join('\n')}`;
    setModalMessage(message);
    setShowModal(true);
    return;
  }

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

  setSummaryText(message);
setShowSummary(true);
setTimeout(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}, 0);
};

const [labelsByKey, setLabelsByKey] = useState<Record<string, string>>({});


const checkboxList = (items: string[], prefix: string) => {
  return items.map((label, i) => {
    const key = `${prefix}_${i}`;

    // Dodaj do labelsByKey jeśli jeszcze nie istnieje
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
  <fieldset key="1" style={{ border: '1px solid #ccc', padding: '1rem' }}>
    <legend><strong>1. Sytuacje codzienne</strong></legend>

    <h4>• Podczas karmienia (jednokrotny wybór)</h4>
    {checkboxList([
      'Agresywny do ludzi i koni (straszy lub próbuje ugryźć)',
      'Agresywny tylko do koni (atakuje inne konie)',
      'Niecierpliwy (kopie przednią nogą, wierci się po boksie)',
      'Dopomina się delikatnie (rży i wypatruje osoby karmiącej)',
      'Spokojnie czeka na karmienie (nie denerwuje się)',
    ], 'karmienie')}

    <h4>• Narowy (wielokrotny wybór)</h4>
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

    <label style={{ display: 'block', marginTop: '0.5rem' }}>
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
        style={{ marginTop: '0.5rem', display: 'block', width: '100%' }}
      />
    )}

    <h4>• Odejście od koni (jednokrotny wybór)</h4>
    {checkboxList([
      'Koń łatwo odłącza się od innych koni',
      'Zaniepokojony, ale reaguje na polecenia osoby prowadzącej',
      'Niebezpieczny, nie reaguje na polecenia prowadzącego',
    ], 'odejscie')}

    <h4>• Prowadzenie na uwiązie (jednokrotny wybór)</h4>
    {checkboxList([
      'Chętnie podąża za człowiekiem i reaguje na polecenia',
      'Wymaga korekt co jakiś czas',
      'Skupiony na otoczeniu, nie reaguje na polecenia prowadzącego',
    ], 'uwiaz')}
  </fieldset>,

  // === 2. Przed treningiem ===
  <fieldset key="2" style={{ border: '1px solid #ccc', padding: '1rem' }}>
    <legend><strong>2. Przed treningiem</strong></legend>

    <h4>• Test VAA – kontakt dobrowolny (jednokrotny wybór)</h4>
    {checkboxList([
      'Koń podchodzi, chce powąchać rękę',
      'Koń nie podchodzi i nie nawiązuje kontaktu',
      'Unikanie lub agresja - koń odwraca się zadem lub straszy ugryzieniem',
    ], 'vaa')}

    <h4>• Test FHA – kontakt wymuszony (jednokrotny wybór)</h4>
    {checkboxList([
      'Zachowania agresywno - obronne (straszenie, gryzienie, kopanie)',
      'Unikanie (odsuwanie się przy próbie dotyku)',
      'Chęć kontaktu (pozostaje spokojny, ciekawy, pozwala na dotyk)',
    ], 'fha')}

    <h4>• Podczas czyszczenia (wielokrotny wybór)</h4>
    {checkboxList([
      'Koń nie może być wiązany lub musi być wiązany na dwóch uwiązach',
      'Odsuwanie się od szczotki przy czyszczeniu grzbietu lub okolic popręgu (ugina plecy, unosi grzbiet)',
      'Nie pozwala dotknąć głowy lub uszu',
      'Nie podnosi wszystkich nóg',
      'Koń stoi spokojnie, przywiązany na pojedynczym uwiązie, podaje wszystkie kopyta',
    ], 'czyszczenie')}

    <h4>• Podczas ubierania (wielokrotny wybór)</h4>
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
  </fieldset>,

  // === 3. Podczas treningu ===
  <fieldset key="3" style={{ border: '1px solid #ccc', padding: '1rem' }}>
    <legend><strong>3. Podczas treningu</strong></legend>

    <h4>• Zachowania pyska (wielokrotny wybór)</h4>
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

    <h4>• Głowa i szyja (wielokrotny wybór)</h4>
    {checkboxList([
      'Unoszenie/opuszczanie głowy niesynchroniczne z ruchem kłusa',
      'Przechylanie głowy',
      'Głowa powyżej pionu ≥10s',
      'Głowa za pionem ≥10s',
      'Rzucanie, skręcanie głową, kręcenie głową na boki',
      'Koń nie wykazuje żadnego z powyższych zachowań',

    ], 'glowa')}

    <h4>• Ogon (jednokrotny wybór)</h4>
    {checkboxList([
      'Ogon trzymany na bok',
      'Ogon wciśnięty między pośladkami',
      'Energiczne, nerwowe machanie ogonem',
      'Ogon bez napięcia, zwisający swobodnie',
    ], 'ogon')}

    <h4>• Chód (wielokrotny wybór)</h4>
    {checkboxList([
      'Zbyt szybkie tempo (>40 kroków/15s)',
      'Zbyt wolne tempo (<35 kroków/15s)',
      'Trzyśladowy ruch',
      'Błędy galopu: zmiany nóg, galop krzyżowy',
      'Samoczynne zmiany chodu',
      'Potykanie się, ciągnięcie czubków kopyt',
      'Koń porusza się swobodnym, rytmicznym chodem',
    ], 'chod')}

    <h4>• Opór (wielokrotny wybór)</h4>
    {checkboxList([
      'Zmiana kierunku / płoszenie się / ponoszenie',
      'Opór przed ruchem, zatrzymywanie się / odmowa wykonania ruchu, np. skoków',
      'Stawanie dęba',
      'Brykanie',
      'Koń chętnie współpracuje i wykonuje polecenia',
    ], 'opor')}

  </fieldset>,

  // === 4. Po treningu ===
  <fieldset key="4" style={{ border: '1px solid #ccc', padding: '1rem' }}>
    <legend><strong>4. Po treningu</strong></legend>

    <h4>• Oddech (jednokrotny wybór)</h4>
    {checkboxList([
      'Koń oddycha intensywnie pracując bokami',
      'Koń nie pracuje intensywnie bokami, ale wykonuje 1 oddech w ciągu ok. 1-2 sekund',
      'Koń wykonuje 1 oddech na min. 3-4 sekundy',
    ], 'oddech')}

    <h4>• Spocenie (jednokrotny wybór)</h4>
    {checkboxList([
      'Nie jest spocony',
      'Jest spocony u podstawy szyi i pod siodłem',
      'Jest intensywnie spocony na szyi, pod siodłem, w okolicach słabizny, ale nie widać skapujących strużek potu ani piany',
      'Pot skapuje z konia i jest miejscami spieniony',
    ], 'spocenie')}

    <h4>• Reakcja na otoczenie (jednokrotny wybór)</h4>
    {checkboxList([
      'Zainteresowany otoczeniem',
      'Obojętny na otoczenie',
      'Zaniepokojony otoczeniem',
    ], 'otoczenie')}

    <h4>• Interakcja z człowiekiem (jednokrotny wybór)</h4>
    {checkboxList([
      'Koń chętnie podąża za człowiekiem, szuka kontaktu, chce powąchać dotknąć',
      'Koń obojętny wobec człowieka, nie szuka kontaktu',
      'Koń wykazujacy lęk lub agresję, reaguje nerwowo i przesadnie na gesty człowieka',
    ], 'interakcja')}

    <h4>• Apetyt (jednokrotny wybór)</h4>
    {checkboxList([
      'Koń jest zainteresowany jedzeniem, w drugiej kolejności napije się wody',
      'Koń spragniony, dopiero po napojeniu zainteresowany jedzeniem',
      'Koń niezainteresowany ani jedzeniem, ani wodą',
    ], 'apetyt')}
  </fieldset>
];



  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', lineHeight: '1.6' }}>
      <h2>Ocena zachowania konia</h2>

      {!showSummary ? (
        <form>
          {currentStep === 0 && (
  <div style={{ marginTop: '-1.5rem',marginBottom: '2rem' }}>
    <p style={{ background: '#f0f4ff', padding: '1rem', borderRadius: '6px', textAlign: 'justify'  }}>
      Wypełnienie wszystkich pól pomoże Ci uzyskać pełny obraz zachowań Twojego konia.
  Dowiesz się, które zachowania są prawidłowe, które wymagają obserwacji, a które
  sygnalizują potrzebę szybkiej reakcji. Dzięki temu uświadomisz sobie, na jakie
  objawy zwracasz uwagę, a które dotąd mogły Ci umknąć, rozwijając swoją umiejętność
  obserwacji zachowań konia. Jeśli w którymś obszarze pojawią się dla Ciebie
  nowe zachowania, znajdziesz na naszej stronie materiały szkoleniowe
  omawiające je w wybranych sytuacjach.
    </p>

<label>
  Imię konia:{' '}
  <input
    type="text"
    name="imie_konia"
    value={horseName}
    onChange={(e) => {
      // ręczne wpisanie działa TYLKO jeśli nie ma horseId
      if (!horseId) {
        setHorseName(e.target.value);
      }
    }}
    readOnly={!!horseId}   // z profilu konia pole jest tylko do odczytu
    style={{
      marginLeft: '1rem',
      background: horseId ? "#f9f9f9" : "white",
      border: "1px solid #ccc"
    }}
  />
</label>


    <br />
  </div>
)}


          {sections[currentStep]}

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
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
    onClick={() => {
      // 🟢 Walidacja imienia konia
      if (!horseName.trim()) {
        setModalMessage("⚠️ Podaj imię konia, aby kontynuować.");
        setShowModal(true);
        return;
      }

      if (checkStepCompletion(currentStep)) {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        setTimeout(() => {
          window.history.pushState({ step: nextStep }, '', window.location.pathname);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 0);
      }
    }}
    style={btnStyle}
  >
    Dalej →
  </button>
) : (
  <button
    type="button"
    onClick={() => {
      // 🟢 Walidacja imienia konia przy ostatnim kroku
      if (!horseName.trim()) {
        setModalMessage("⚠️ Podaj imię konia, aby zakończyć ankietę.");
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
      <div ref={summaryRef} style={{ padding: '2rem', background: '#f9f9f9', borderRadius: '8px' }}>

        <div style={{ padding: '2rem', background: '#f9f9f9', borderRadius: '8px' }}>
          <h3>📋 Podsumowanie zachowania</h3>
          <p>{summaryText}</p>

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
{categoryOrder.map((category) =>
  <fieldset
    key={category}
    style={{
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1.5rem'
    }}
  >
    <legend style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#0D1F40' }}>
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
      <div key={prefix} style={{ marginBottom: '1rem' }}>
        <strong>{prefixToLabel[prefix] || prefix}</strong>{' '}
        <span style={{
          fontSize: '0.9rem',
          marginLeft: '0.5rem',
          color:
            getSubcategoryColor(prefixToLabel[prefix] || prefix, items.map(({ key }) => labelsByKey[key] || key)) === 'red'
              ? 'red'
              : getSubcategoryColor(prefixToLabel[prefix] || prefix, items.map(({ key }) => labelsByKey[key] || key)) === 'yellow'
              ? 'orange'
              : 'green'
        }}>
          {(() => {
            const color = getSubcategoryColor(prefixToLabel[prefix] || prefix, items.map(({ key }) => labelsByKey[key] || key));
            const descriptions: Record<string, string> = {
              green: 'Zachowanie pożądane',
              yellow: 'Wymaga korekty',
              red: 'Wymaga pilnej korekty',
              gray: 'Brak wystarczających danych'
            };
            return `● ${descriptions[color]}`;
          })()}
        </span>

        <ul style={{ marginTop: '0.3rem', marginBottom: '0.5rem' }}>
          {items.map(({ key, val }) => {
            const label = labelsByKey[key] || key.replace(/_/g, ' ');
            return (
              <li key={key}>
                {label}
                {typeof val === 'string' ? `: ${val}` : ''}
              </li>
            );
          })}
          {prefix === 'narowy' &&
            formData['narowy_inne'] === true &&
            formData['narowy_inne_text'] && (
              <li><em>Inne narowy:</em> {(formData['narowy_inne_text'] as string).trim()}</li>
          )}
        </ul>
      </div>
    ))}
  </fieldset>
)}

    </div>
  )}
</div>





          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '2rem' }}>
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

            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
  <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
    Podaj swój e-mail, aby zapisać ocenę:
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
    maxWidth: '300px',
  }}
  required
/>




</div>


<button
  disabled={userExists === null}
  onClick={handleSaveClick}
  style={{
    ...iconBtnStyle,
    opacity: userExists === null ? 0.6 : 1,
    cursor: userExists === null ? 'not-allowed' : 'pointer'
  }}
>
  <img src="/images/floppy-disk.svg" alt="Zapisz wynik" width={36} height={36} style={svgIconStyle} />
  <span style={{ marginTop: '0.5rem' }}>Zapisz wynik</span>
</button>


            <button
              onClick={() => {
                window.location.href = '/znajdz?typ=behawiorysta';
              }}
              style={iconBtnStyle}
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

  {showLoginToSaveModal && (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000
  }}>
    <div style={{
      background: '#fff', padding: '2rem', borderRadius: '8px',
      width: '100%', maxWidth: '400px', textAlign: 'center'
    }}>
      <h3>Zaloguj się, aby zapisać ocenę</h3>
      <p>Ten adres e-mail jest już zarejestrowany. Wprowadź hasło, aby się zalogować i zapisać ocenę.</p>

      <input
        type="password"
        value={loginPassword}
        onChange={(e) => setLoginPassword(e.target.value)}
        placeholder="Hasło"
        style={{ width: '100%', padding: '0.5rem', marginTop: '1rem' }}
      />

      <button
        style={{ marginTop: '1.5rem', padding: '0.5rem 1.5rem', background: '#0D1F40', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
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
        Zaloguj i zapisz ocenę
      </button>

      <button
        onClick={() => {
          setShowLoginToSaveModal(false);
          setLoginPassword('');
        }}
        style={{ marginTop: '1rem', padding: '0.5rem', background: 'transparent', border: 'none', color: '#555', textDecoration: 'underline' }}
      >
        Anuluj
      </button>
    </div>
  </div>
)}


      {showModal && (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  }}>
    <div style={{
      background: 'white',
      padding: '2rem',
      borderRadius: '12px',
      maxWidth: '400px',
      textAlign: 'center',
      boxShadow: '0 0 10px rgba(0,0,0,0.3)'
    }}>
      <h3 style={{ marginBottom: '1rem' }}>Brak odpowiedzi</h3>
      <p style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>{modalMessage}</p>
      <button
        style={{ marginTop: '1.5rem', padding: '0.5rem 1.5rem', background: '#0D1F40', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        onClick={() => setShowModal(false)}
      >
        OK
      </button>
      <button
  style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
  onClick={async () => {
    const res = await fetch('/api/resend-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    await showDialog(data.message || 'Wysłano link ponownie.');
  }}
>
  Wyślij link weryfikacyjny ponownie
</button>
    </div>
  </div>
)}

{showEmailModal && (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }}>
    <div style={{
      background: '#fff',
      padding: '2rem',
      borderRadius: '8px',
      width: '100%',
      maxWidth: '400px'
    }}>
      <h3>Zapisz wynik</h3>
      <p>Podaj e-mail i wybierz, co chcesz zrobić:</p>

      

      {/* Zapis jako tymczasowy */}
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
  style={{ marginBottom: '1rem', width: '100%' }}
>
  Zapisz jako tymczasowy
</button>


      {/* Rejestracja */}
      <button
        onClick={() => {
          window.location.href = `/rejestracja?redirect=ankieta`;
        }}
        style={{ marginBottom: '0.5rem', width: '100%' }}
      >
        Załóż konto i zapisz
      </button>

      {/* Logowanie */}
      <button
        onClick={() => {
          window.location.href = `/logowanie?redirect=ankieta`;
        }}
        style={{ width: '100%' }}
      >
        Zaloguj się
      </button>
    </div>
  </div>
)}





{showConfirmRegisterModal && (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', zIndex: 9999,
    display: 'flex', justifyContent: 'center', alignItems: 'center'
  }}>
    <div style={{
      background: '#fff', padding: '2rem', borderRadius: '8px',
      width: '100%', maxWidth: '400px'
    }}>
      <h3>Utwórz konto</h3>
      <p>Uzupełnij dane, by zarejestrować konto właściciela:</p>

      <input
        type="text"
        placeholder="Imię i nazwisko"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem' }}
      />
      <input
        type="password"
        placeholder="Hasło"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem' }}
      />
      <input
        type="password"
        placeholder="Powtórz hasło"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem' }}
      />

      <button
        onClick={handleConfirmRegistration}
        style={{ marginBottom: '0.5rem', width: '100%' }}
      >
        Potwierdź dane i utwórz konto
      </button>

      <button
        onClick={() => setShowConfirmRegisterModal(false)}
        style={{ width: '100%' }}
      >
        Anuluj
      </button>
    </div>
  </div>
)}

    </div>
  );
}
