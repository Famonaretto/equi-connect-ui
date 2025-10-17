'use client';
import { useState } from 'react';
import { getAuth, updateEmail, updatePassword, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, getDocs, query, where, getDoc, addDoc, Timestamp, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useEffect } from 'react';
import locations from '@/utils/locations';
import { contactOptions } from '@/utils/contactOptions';
import specializations from '@/utils/specializations';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useDialog } from '../components/DialogProvider';
import KalendarzPage from '@/components/KalendarzPage';
import { resetCalendarSubstatuses,  useCalendarCounter } from '@/components/CalendarCounter';
import { useRouter } from "next/navigation";
import { handleOpenChat } from "@/utils/chatUtils";
import ChatSidebar from '@/components/ChatSidebar';
import { useSearchParams } from 'next/navigation'
import ChatBox from '@/components/ChatBox';
import dynamic from "next/dynamic";
import UmowioneKonsultacje from '@/components/UmowioneKonsultacje';



const inputStyle: React.CSSProperties = {
  padding: '1rem',
  borderRadius: '0.5rem',
  border: '1px solid #ccc',
  fontSize: '1rem',
  width: '100%',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: '100px',
};

const labelStyle: React.CSSProperties = {
  fontWeight: 'bold',
  marginBottom: '0.5rem',
  display: 'block',
};

// 🔹 Style dla modala oferty
const inputOfertaStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem',
  marginBottom: '0.8rem',
  border: '1px solid #ccc',
  borderRadius: '0.4rem',
};

const buttonOfertaPrimary: React.CSSProperties = {
  backgroundColor: '#0D1F40',
  color: 'white',
  padding: '0.6rem 1.2rem',
  borderRadius: '0.5rem',
  border: 'none',
  fontWeight: 'bold',
  cursor: 'pointer',
};

const buttonOfertaSecondary: React.CSSProperties = {
  backgroundColor: '#ccc',
  color: '#333',
  padding: '0.6rem 1.2rem',
  borderRadius: '0.5rem',
  border: 'none',
  fontWeight: 'bold',
  cursor: 'pointer',
};



export default function SpecjalistaPage() {

const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
const ChatUnreadBadge = dynamic(() => import("@/components/ChatUnreadBadge"), { ssr: false });

  
const searchParams = useSearchParams()
const [activeTab, setActiveTab] = useState('profil')

useEffect(() => {
  const tabFromUrl = searchParams.get('tab')
  if (tabFromUrl) {
    setActiveTab(tabFromUrl)
  }
}, [searchParams])
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
const [rejectReason, setRejectReason] = useState('');
const [totalOferty, setTotalOferty] = useState(0);
const [newOferty, setNewOferty] = useState(0);
const [prosby, setProsby] = useState<any[]>([]);
const [opis, setOpis] = useState('');
const [obszar, setObszar] = useState('');
const [wojewodztwo, setWojewodztwo] = useState<string[]>([]);
const [selectedForUI, setSelectedForUI] = useState<string[]>([]); // do zaznaczeń w UI
const [cenaOnline, setCenaOnline] = useState('');
const [cenaStacjonarna, setCenaStacjonarna] = useState('');
const [contactTypes, setContactTypes] = useState<string[]>([]);
const [specialization, setSpecialization] = useState<string[]>([]);
const [doswiadczenie, setDoswiadczenie] = useState('');
const [kursy, setKursy] = useState('');
const [certyfikaty, setCertyfikaty] = useState('');
const [avatar, setAvatar] = useState<File | null>(null);
const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
const { showDialog } = useDialog();
const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

const [ownerSuggestions, setOwnerSuggestions] = useState<string[]>([]);
const [highlightOwnerIndex, setHighlightOwnerIndex] = useState(-1);

const [refreshKey, setRefreshKey] = useState(0);
const calendarCount = useCalendarCounter("specjalista", refreshKey);

const [confirmedForms, setConfirmedForms] = useState<string[]>([]);
const [selectedRequestForms, setSelectedRequestForms] = useState<string[]>([]);

const router = useRouter();
const [activeChatId, setActiveChatId] = useState<string | null>(null);

const [editingOfertaId, setEditingOfertaId] = useState<string | null>(null);
const [selectedZgloszenie, setSelectedZgloszenie] = useState<string>('');
const [priceFrom, setPriceFrom] = useState<string>('');
const [priceTo, setPriceTo] = useState<string>('');
const [terminy, setTerminy] = useState<{ date: string; time: string }[]>([
  { date: '', time: '' }
]);
const [showOfertaDialog, setShowOfertaDialog] = useState<boolean>(false);




const handleOpenKalendarz = async () => {
  const auth = getAuth(app);
  const user = auth.currentUser;
  if (!user) return;

  const db = getFirestore(app);

  // pobierz wszystkie NS i NOS specjalisty
  const q = query(
    collection(db, "konsultacje"),
    where("specialistEmail", "==", user.email),
    where("substatusS", "in", ["NS", "NOS"])
  );

  const snap = await getDocs(q);

  // zmień NS -> SS i NOS -> SOS
  const updates = snap.docs.map(docSnap => {
    const subS = docSnap.data().substatusS;
    let newSubS = subS;
    if (subS === "NS") newSubS = "SS";
    if (subS === "NOS") newSubS = "SOS";
    return updateDoc(docSnap.ref, { substatusS: newSubS });
  });

  await Promise.all(updates);

  // wymuś przeliczenie licznika
  setRefreshKey(prev => prev + 1);

  // przełącz na zakładkę kalendarza
  setActiveTab("kalendarz");

  // zapisz datę ostatniego wejścia
  await setDoc(
    doc(db, "users", user.uid),
    {
      lastCalendarView_specialist: Timestamp.now(),
    },
    { merge: true }
  );
};



const handleUpdateProfile = async (e: React.FormEvent) => {
  e.preventDefault();
  setStatus('');
  setError('');

  try {
    const auth = getAuth(app);
    const user = auth.currentUser;
    const db = getFirestore(app);

    if (!user) throw new Error('Brak zalogowanego użytkownika');

    if (newEmail && newEmail !== user.email) {
      await updateEmail(user, newEmail);
    }

    if (newPassword) {
      await updatePassword(user, newPassword);
    }

    let finalAvatarUrl = avatarPreview || '';

if (avatar) {
  const storage = getStorage(app);
  const storageRef = ref(storage, `avatars/${user.uid}`);
  await uploadBytes(storageRef, avatar);
  finalAvatarUrl = await getDownloadURL(storageRef);
  setAvatarPreview(finalAvatarUrl);
}



await setDoc(doc(db, 'users', user.uid), {
  email: user.email,
  uid: user.uid,
  roles: {
    specjalista: {
      enabled: true,
      firstName,
      lastName,
      location: wojewodztwo,
      specialization,
      experience: doswiadczenie,
      description: opis,
      contactTypes,
      cenaOnline,
      cenaStacjonarna,
      kursy,
      certyfikaty,
      avatarUrl: finalAvatarUrl || '',


    }
  }
}, { merge: true });


await showDialog('✅ Dane profilu zostały zapisane.');


    setStatus('Dane zostały zaktualizowane.');
  } catch (err: any) {
    setError(err.message || 'Wystąpił błąd przy aktualizacji.');
  }
};







 const menuItems = [
  { id: 'profil', label: 'Mój profil' },
    {id: 'umowioneKonsultacje', label: 'Umówione konsultacje' },
  {id: 'prosby', label: 'Prośby o pomoc',
  count: prosby.length 
},

   {id: 'oferty', label: 'Moje oferty pomocy',

  },


{  id: 'czat',  label: 'Wiadomości (czat)'},


  {id: 'wydarzenia', label: 'Wydarzenia',
    submenu: [
      { id: 'planowanyUdzial', label: 'Planowany udział' },
      { id: 'historiaWydarzen', label: 'Historia wydarzeń' },
      { id: 'certyfikaty', label: 'Moje certyfikaty' },
      { id: 'dodajWydarzenie', label: 'Dodaj wydarzenie' },
      { id: 'anulowaneWydarzenia', label: 'Anulowane wydarzenia' },
    ]
  },

{ id: 'kalendarz', label: 'Mój kalendarz', onClick: handleOpenKalendarz },



  { id: 'platnosci',
    label: 'Płatności',

  },
  { id: 'ustawieniaSpecjalisty',
    label: 'Ustawienia',

  },
];


const [infoModalMessage, setInfoModalMessage] = useState<string | null>(null);

const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

const toggleSubmenu = (menuId: string) => {
  setExpandedMenus((prev) =>
    prev.includes(menuId)
      ? prev.filter((id) => id !== menuId)
      : [...prev, menuId]
  );
};

const handleSaveProfile = async (e: React.FormEvent) => {
  e.preventDefault();
  console.log('✅ handleSaveProfile uruchomione');
  setStatus('');
  setError('');

  // 🔹 Walidacja
// Czy cena online > 0?
const cenaOnlineNum = parseFloat(cenaOnline) || 0;
const cenaStacjonarnaNum = parseFloat(cenaStacjonarna) || 0;

const hasStationaryForm = contactTypes?.some(
  (type) => ["W stajni konia", "W ośrodku specjalisty"].includes(type)
);

// 1. Cena online podana, ale brak "On-line"
if (cenaOnlineNum > 0 && !contactTypes.includes("On-line")) {
  await showDialog("❌ Podałeś cenę online, ale nie zaznaczyłeś formy kontaktu 'On-line'.");
  return;
}

// 2. "On-line" zaznaczone, ale brak ceny online > 0
if (cenaOnlineNum <= 0 && contactTypes.includes("On-line")) {
  await showDialog("❌ Zaznaczyłeś formę kontaktu 'On-line', ale nie podałeś ceny online.");
  return;
}

// 3. Cena stacjonarna podana, ale brak form stacjonarnych
if (cenaStacjonarnaNum > 0 && !hasStationaryForm) {
  await showDialog("❌ Podałeś cenę stacjonarną, ale nie zaznaczyłeś formy kontaktu stacjonarnej.");
  return;
}

// 4. Forma stacjonarna zaznaczona, ale brak ceny stacjonarnej > 0
if (cenaStacjonarnaNum <= 0 && hasStationaryForm) {
  await showDialog("❌ Zaznaczyłeś formę kontaktu stacjonarną, ale nie podałeś ceny stacjonarnej.");
  return;
}


  try {
    const auth = getAuth(app);
    const user = auth.currentUser;
    const db = getFirestore(app);
    const storage = getStorage(app);

    if (!user) throw new Error('Brak zalogowanego użytkownika');

    // 🔹 Upload zdjęcia jeśli jest
    let avatarUrl = avatarPreview || '';
    if (avatar) {
      try {
        console.log('⬆️ Upload zdjęcia...');
        const storageRef = ref(storage, `avatars/${user.uid}/${avatar.name}`);
        const snapshot = await uploadBytes(storageRef, avatar);
        avatarUrl = await getDownloadURL(snapshot.ref);
        setAvatarPreview(avatarUrl);
      } catch (uploadError) {
        console.error('❌ Błąd uploadu zdjęcia:', uploadError);
        setError('Nie udało się załadować zdjęcia. Spróbuj ponownie.');
        return;
      }
    }

    // 🔹 Dane profilu
    const profileData = {
      email: user.email,
      firstName,
      lastName,
      wojewodztwo,
      cenaOnline,
      cenaStacjonarna,
      contactTypes,
      specialization,
      opis,
      doswiadczenie,
      kursy,
      certyfikaty,
      avatarUrl,
      kosztyDojazdu,
      czasTrwania,
    };


    // 🔹 Zapis do Firestore
    const profileRef = doc(db, 'profile', user.uid);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      await setDoc(profileRef, profileData, { merge: true });
    } else {
      await setDoc(profileRef, profileData);
    }

    setShowSaveConfirmation(true);
  } catch (err: any) {
    console.error(err);
    setError(err.message || 'Wystąpił błąd przy zapisie profilu.');
  }
};




const [filterOwner, setFilterOwner] = useState('');
const [filterForma, setFilterForma] = useState('');
const [filterTermin, setFilterTermin] = useState('');

useEffect(() => {
  if (!filterOwner.trim()) {
    setOwnerSuggestions([]);
    return;
  }
  const lower = filterOwner.toLowerCase();
  const matches = Array.from(
    new Set(
      prosby
        .map((p) => p.ownerName || '')
        .filter((name) => name.toLowerCase().includes(lower))
    )
  );
  setOwnerSuggestions(matches);
}, [filterOwner, prosby]);

const handleOwnerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (ownerSuggestions.length === 0) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    setHighlightOwnerIndex((prev) => (prev + 1) % ownerSuggestions.length);
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    setHighlightOwnerIndex((prev) =>
      prev <= 0 ? ownerSuggestions.length - 1 : prev - 1
    );
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    if (highlightOwnerIndex >= 0) {
      setFilterOwner(ownerSuggestions[highlightOwnerIndex]);
    }
    setOwnerSuggestions([]);
    setHighlightOwnerIndex(-1);
  }
};

const [kosztyDojazdu, setKosztyDojazdu] = useState("");
const [czasTrwania, setCzasTrwania] = useState("");


useEffect(() => {
  const handleEditOferta = (event: any) => {
    const { ofertaId, oferta } = event.detail;

    // 🔥 Otwórz dialog z istniejącymi danymi
    setActiveTab("prosby"); // lub np. 'oferty' jeśli tam masz formularz
    setEditingOfertaId(ofertaId);
    setSelectedZgloszenie(oferta.zgloszenieId || '');
    setPriceFrom(oferta.cena?.od || '');
    setPriceTo(oferta.cena?.do || '');
    setTerminy(
      oferta.proponowaneTerminy?.map((t: string) => {
        const [date, ...rest] = t.split(' ');
        const time = rest.join(' ') || '';
        return { date, time };
      }) || [{ date: '', time: '' }]
    );

    setShowOfertaDialog(true);// otwórz modal z edycją
  };

  window.addEventListener('editOferta', handleEditOferta);
  return () => window.removeEventListener('editOferta', handleEditOferta);
}, []);


useEffect(() => {
  const loadUserAndProfileData = async () => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      // 🔹 1. Dane z "users"
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        const spec = data?.roles?.specjalista;

        if (spec) {
          setFirstName(spec.firstName || '');
          setLastName(spec.lastName || '');
          setOpis(spec.description || '');
          setWojewodztwo(spec.location || '');
          setSpecialization(spec.specialization || []);
          setDoswiadczenie(spec.experience || '');
          setAvatarPreview(spec.avatarUrl || '');
          setContactTypes(spec.contactTypes || []);
          setCenaOnline(spec.cenaOnline || '');
          setCenaStacjonarna(spec.cenaStacjonarna || '');
          setKursy(spec.kursy || '');
          setCertyfikaty(spec.certyfikaty || '');
        }
      }

      // 🔹 2. Dane z "profile"
      const profileDocRef = doc(db, 'profile', user.uid);
      const profileSnap = await getDoc(profileDocRef);

      if (profileSnap.exists()) {
        const profile = profileSnap.data();

        // Tylko nadpisz pola, których nie ma lub są puste
        setFirstName((prev) => prev || profile.firstName || '');
        setLastName((prev) => prev || profile.lastName || '');
        setOpis((prev) => prev || profile.opis || '');
        setWojewodztwo((prev) => prev || profile.wojewodztwo || '');
        setSpecialization((prev) => prev.length ? prev : profile.specialization || []);
        setContactTypes((prev) => prev.length ? prev : profile.contactTypes || []);
        setDoswiadczenie((prev) => prev || profile.doswiadczenie || '');
        setKursy((prev) => prev || profile.kursy || '');
        setCenaOnline((prev) => prev || profile.cenaOnline || '');
        setCenaStacjonarna((prev) => prev || profile.cenaStacjonarna || '');
        setAvatarPreview((prev) => prev || profile.avatarUrl || '');

      }
    });
  };

  loadUserAndProfileData();
}, []);

const [statusModalMessage, setStatusModalMessage] = useState<string | null>(null);

const updateRequestStatus = async (
  id: string,
  status: 'zaakceptowane' | 'odrzucone',
  reason?: string
) => {
  try {
    const db = getFirestore(app);
    const docRef = doc(db, 'konsultacje', id);

    await setDoc(docRef, {
      status,
      ...(status === 'odrzucone' && reason ? { reason } : {}),
    }, { merge: true });

    const snapshot = await getDoc(docRef);
    const data = snapshot.data();
    const ownerEmail = data?.ownerEmail;
    const specialistName = data?.specjalista;

    await fetch('/api/sendConsultationStatusUpdate', {
      method: 'POST',
      body: JSON.stringify({
        to: ownerEmail,
        specialistName,
      }),
    });

    setProsby((prev) => prev.filter((p) => p.id !== id));

    // 🔹 Zamiast alertu otwieramy modal
    setStatusModalMessage('✅ Status został pomyślnie zaktualizowany.');
  } catch (err) {
    console.error(err);
    setStatusModalMessage('❌ Wystąpił błąd przy zmianie statusu.');
  }
};



const terminyMap: Record<string, string> = {
  pilne: 'Pilne (jak najszybciej)',
  tydzien: 'W ciągu tygodnia',
  '14dni': 'W ciągu 14 dni',
  miesiac: 'W ciągu miesiąca',
  dluzszy: 'Mogę poczekać dłużej'
};

// 📌 Nowe stany na górze komponentu SpecjalistaPage
const [showAcceptModal, setShowAcceptModal] = useState(false);
const [acceptDate, setAcceptDate] = useState('');
const [acceptTime, setAcceptTime] = useState('');
const [predefinedRejectReasons] = useState([
  "Brak wolnych terminów",
  "Nie mogę przyjąć w tej lokalizacji",
  "Problem nie w moim zakresie",
]);

const acceptRequestWithDate = async (id: string) => {
  try {
    const db = getFirestore(app);
    const docRef = doc(db, 'konsultacje', id);

    await setDoc(docRef, {
      status: 'zaakceptowane',
      proponowanyTermin: `${acceptDate} ${acceptTime}`,
      potwierdzoneFormy: confirmedForms // <--- dodane
    }, { merge: true });

    const snapshot = await getDoc(docRef);
    const data = snapshot.data();
    const ownerEmail = data?.ownerEmail;
    const specialistName = data?.specjalista;

    await fetch('/api/sendConsultationStatusUpdate', {
      method: 'POST',
      body: JSON.stringify({
        to: ownerEmail,
        specialistName,
        date: `${acceptDate} ${acceptTime}`,
        potwierdzoneFormy: confirmedForms // <--- też wyślij w mailu, jeśli chcesz
      }),
    });

    setProsby(prev => prev.filter(p => p.id !== id));
    setShowAcceptModal(false);
    setInfoModalMessage('✅ Prośba zaakceptowana z terminem!');

  } catch (err) {
    console.error(err);
    setInfoModalMessage('❌ Błąd podczas akceptacji.');
  }
};


const startChat = async (p: Prosba) => {
  try {
    const db = getFirestore(app);
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) return;

const ownerUid = p.ownerUid;
const specialistUid = user.uid;
    
const chatDoc = await addDoc(collection(db, 'czaty'), {
  participants: [
    { uid: ownerUid, role: 'wlasciciel' },
    { uid: specialistUid, role: 'specjalista' },
  ],
  createdAt: Timestamp.now(),
  messages: [],
});



// 📩 Wyślij e-mail do właściciela (tylko jeśli ma zamknięty czat lub jest offline)
await fetch('/api/sendChatNotification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: p.ownerEmail, // upewnij się, że to pole jest w obiekcie p
    subject: 'Nowa wiadomość od specjalisty',
    text: `Specjalista ${user.displayName || ''} rozpoczął z Tobą czat. 
Zaloguj się, aby odpowiedzieć.`,
  }),
});


    window.location.href = `/panel/wiadomosci/rozmowa?chatId=${chatDoc.id}`;
  } catch (err) {
    console.error(err);
    setInfoModalMessage('❌ Nie udało się rozpocząć czatu.');

  }
};



useEffect(() => {
  const fetchOfertaStats = async () => {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user?.email) return;

    const db = getFirestore(app);
    const q = query(collection(db, 'oferty'), where('specialistEmail', '==', user.email));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => doc.data());

    setTotalOferty(data.length);
    setNewOferty(data.filter(o => !o.oznaczonaJakoPrzeczytana).length);
  };

  fetchOfertaStats();
}, []);

interface Prosba {
  id: string;
  ownerName?: string;
  dataZgloszenia?: any; // Firestore Timestamp | Date | string
  ownerEmail?: string;
  [key: string]: any;
}

useEffect(() => {
  const unsubscribe = onAuthStateChanged(getAuth(app), async (user) => {
    if (!user?.email) return;

    const db = getFirestore(app);

    const q = query(
      collection(db, "konsultacje"),
      where("specialistEmail", "==", user.email),
      where("status", "==", "oczekujące")
    );

    const snapshot = await getDocs(q);

    const prosbyWithOwner: Prosba[] = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data() as Prosba;
        let ownerName = data.ownerName || "";

        if (!ownerName && data.ownerEmail) {
  const qOwner = query(
    collection(db, "users"),
    where("email", "==", data.ownerEmail)
  );
  const ownerSnap = await getDocs(qOwner);
  if (!ownerSnap.empty) {
    const ownerData = ownerSnap.docs[0].data();

    // ✅ pobieramy imię i nazwisko z roles.wlasciciel
    const wlasciciel = ownerData?.roles?.wlasciciel;
    ownerName = `${wlasciciel?.firstName || ""} ${wlasciciel?.lastName || ""}`.trim();
  }
}


        return {
  ...data,
  id: docSnap.id,
  ownerName
};

      })
    );

    setProsby(
      prosbyWithOwner.sort((a, b) => {
        const dateA =
          typeof a.dataZgloszenia?.toDate === "function"
            ? a.dataZgloszenia.toDate()
            : new Date(a.dataZgloszenia || 0);

        const dateB =
          typeof b.dataZgloszenia?.toDate === "function"
            ? b.dataZgloszenia.toDate()
            : new Date(b.dataZgloszenia || 0);

        return dateB.getTime() - dateA.getTime();
      })
    );
  });

  return () => unsubscribe();
}, []);


const handleZapiszOferte = async () => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const user = auth.currentUser;

  if (!user) {
    alert("❌ Musisz być zalogowany.");
    return;
  }

  const preparedTerminy = terminy.map(({ date, time }) =>
    date && time ? `${date} ${time}` : 'Do ustalenia'
  );

  const oferta = {
    zgloszenieId: selectedZgloszenie,
    specjalistaId: user.uid,
    specjalistaEmail: user.email,
    proponowaneTerminy: preparedTerminy,
    cena: { od: priceFrom, do: priceTo },
    status: 'oczekuje',
    updatedAt: serverTimestamp(),
  };

  try {
    if (editingOfertaId) {
      const ofertaRef = doc(db, 'ofertySpecjalistow', editingOfertaId);
      await updateDoc(ofertaRef, oferta);
    } else {
      await addDoc(collection(db, 'ofertySpecjalistow'), oferta);
    }

    alert('✅ Oferta została zapisana.');
    setShowOfertaDialog(false);
    setEditingOfertaId(null);
    setPriceFrom('');
    setPriceTo('');
    setTerminy([{ date: '', time: '' }]);
  } catch (error) {
    console.error('❌ Błąd zapisu oferty:', error);
    alert('Nie udało się zapisać oferty.');
  }
};




  const renderContent = () => {
    switch (activeTab) {
      case 'profil':
         return (
    <>
      <h2>Edytuj swój profil</h2>
      <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
<label style={labelStyle}>Imię:</label>
<input
  type="text"
  value={firstName}
  onChange={(e) => setFirstName(e.target.value)}
  style={inputStyle}
  placeholder="Imię"
/>
<label style={labelStyle}>Nazwisko:</label>
<input
  type="text"
  value={lastName}
  onChange={(e) => setLastName(e.target.value)}
  style={inputStyle}
  placeholder="Nazwisko"
/>
<fieldset>
  <legend><strong>Obszar konsultacji stacjonarnych</strong></legend>
  {locations.map((loc) => {
    const isCalaPolska = loc === "Cała Polska";
    return (
      <label key={loc} style={{ display: 'block', marginBottom: '0.5rem' }}>
        <input
          type="checkbox"
          checked={selectedForUI.includes(loc)}
          onChange={() => {
            if (isCalaPolska) {
              if (selectedForUI.includes("Cała Polska")) {
                // Odznacz wszystko
                setSelectedForUI([]);
                setWojewodztwo([]);
              } else {
                // Zaznacz wszystko w UI, do bazy tylko "Cała Polska"
                setSelectedForUI(locations);
                setWojewodztwo(["Cała Polska"]);
              }
            } else {
              let updatedUI;
              if (selectedForUI.includes(loc)) {
                updatedUI = selectedForUI.filter((w) => w !== loc);
              } else {
                updatedUI = [...selectedForUI, loc];
              }

              // Jeśli wcześniej była Cała Polska, usuń ją
              if (updatedUI.length !== locations.length) {
                updatedUI = updatedUI.filter((w) => w !== "Cała Polska");
              }

              setSelectedForUI(updatedUI);

              // Jeśli zaznaczone wszystkie poza Całą Polską → dodaj Całą Polskę do UI
              if (updatedUI.length === locations.length - 1 && !updatedUI.includes("Cała Polska")) {
                setSelectedForUI([...updatedUI, "Cała Polska"]);
                setWojewodztwo(["Cała Polska"]);
              } else {
                setWojewodztwo(updatedUI.includes("Cała Polska") ? ["Cała Polska"] : updatedUI);
              }
            }
          }}
        />{" "}
        {isCalaPolska ? <strong>{loc}</strong> : loc}
      </label>
    );
  })}
</fieldset>





<label style={labelStyle}>Cena online (zł):</label>
<input
  type="number"
  value={cenaOnline}
  onChange={(e) => setCenaOnline(e.target.value)}
  style={inputStyle}
  placeholder="Cena online"
/>
<label style={labelStyle}>Cena stacjonarna (zł):</label>
<small style={{ color: '#666' , marginTop: '-1rem'}}>
  Cena nie obejmuje kosztów dojazdu. </small>
<input
  type="number"
  value={cenaStacjonarna}
  onChange={(e) => setCenaStacjonarna(e.target.value)}
  style={inputStyle}
  placeholder="np. 200"
/>

<label style={labelStyle}>Koszty dojazdu przy konsultacji stacjonarnej:</label>
<input
  value={kosztyDojazdu}
  onChange={(e) => setKosztyDojazdu(e.target.value)}
  style={inputStyle}
  placeholder="Podaj informację, czy koszty dojazdu są wliczone w cenę, czy naliczane oddzielnie. Np.: 'Do 30 km w cenie konsultacji. Powyżej – 1 zł/km'."
/>

<label style={labelStyle}>Czas trwania wizyty:</label>
<input
  type="text"
  value={czasTrwania}
  onChange={(e) => setCzasTrwania(e.target.value)}
  style={inputStyle}
  placeholder="Np.: 60 minut"
/>


  <fieldset>
  <legend><strong>Formy kontaktu</strong></legend>
  {contactOptions.map((type) => (
    <label key={type} style={{ display: 'block' }}>
      <input
        type="checkbox"
        checked={contactTypes.includes(type)}
        onChange={() =>
          setContactTypes((prev) =>
            prev.includes(type)
              ? prev.filter((t) => t !== type)
              : [...prev, type]
          )
        }
      /> {type}
    </label>
  ))}
</fieldset>


  <fieldset>
  <legend><strong>Specjalizacje</strong></legend>
  {specializations.map((spec) => (
    <label key={spec} style={{ display: 'block' }}>
      <input
        type="checkbox"
        checked={specialization.includes(spec)}
        onChange={() =>
          setSpecialization((prev) =>
            prev.includes(spec)
              ? prev.filter((s) => s !== spec)
              : [...prev, spec]
          )
        }
      /> {spec}
    </label>
  ))}
</fieldset>



<label style={labelStyle}>Opis / O mnie:</label>
<textarea
  value={opis}
  onChange={(e) => setOpis(e.target.value)}
  style={textareaStyle}
  placeholder="To miejsce na przedstawienie się w sposób, który pokaże Twoją osobowość i doświadczenie. Możesz opisać swoją filozofię pracy, wartości, które Ci przyświecają, najważniejsze osiągnięcia, a także co motywuje Cię w codziennej pracy z końmi. Dodaj elementy, które wyróżniają Cię na tle innych specjalistów – np. unikalne metody, indywidualne podejście czy sukcesy Twoich podopiecznych."
/>
<label style={labelStyle}>Doświadczenie:</label>
<textarea
  value={doswiadczenie}
  onChange={(e) => setDoswiadczenie(e.target.value)}
  style={textareaStyle}
  placeholder="m.in.: ile lat pracujesz w tej specjalizacji, z jakimi końmi i problemami najczęściej się spotykasz, jakie metody stosujesz, jakie masz osiągnięcia."
/>


<label style={labelStyle}>Kursy i uprawnienia:</label>
<textarea
  value={kursy}
  onChange={(e) => setKursy(e.target.value)}
  style={textareaStyle}
  placeholder="Wymień certyfikaty, ukończone kursy, szkolenia i warsztaty związane z Twoją specjalizacją. Podaj nazwę organizatora, temat szkolenia i rok ukończenia. Możesz uwzględnić także międzynarodowe kwalifikacje oraz licencje."
/>


  <label>Zdjęcie profilowe:
    <input type="file" accept="image/*" onChange={(e) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file)); // ✅ TYLKO dla podglądu, nie zapisuj tego
  }
}} />

  </label>

{avatarPreview && (
  <img
    src={avatarPreview}
    alt="Podgląd zdjęcia"
    style={{ width: '150px', borderRadius: '0.5rem', marginTop: '1rem' }}
  />
)}

  <button type="submit" style={buttonStyle}>💾 Zapisz zmiany</button>
  <button
  type="button"
  onClick={() => {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (user) {
      window.open(`/specjalista/profil/${user.uid}`, '_blank');
    }
  }}
  style={{
    marginTop: '1rem',
    backgroundColor: '#ccc',
    color: '#333',
    padding: '0.4rem 0.8rem',
    borderRadius: '0.3rem',
    fontSize: '0.9rem',
    border: 'none',
    cursor: 'pointer',
  }}
>
  👁️ Podgląd publicznego profilu
</button>

  {status && <p style={{ color: 'green' }}>{status}</p>}
  {error && <p style={{ color: 'red' }}>{error}</p>}
</form>

    </>
  );

  case 'umowioneKonsultacje':
    return <UmowioneKonsultacje />;

        case 'prosby':
  return (
    <>
      <h2>Prośby o pomoc</h2>

      {prosby.length === 0 ? (
        <p>Brak oczekujących próśb o konsultację.</p>
      ) : (
        <>
          {/* 🔹 Filtry */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
  {/* Filtr po właścicielu z dropdownem */}
  <select
  value={filterOwner}
  onChange={(e) => setFilterOwner(e.target.value)}
  style={inputStyle}
>
  <option value="">Wszyscy właściciele</option>
  {Array.from(new Set(prosby.map(p => p.ownerName || 'Nieznany')))
    .map(name => (
      <option key={name} value={name}>{name}</option>
    ))}
</select>


  {/* Filtr po formie */}
  <select
    value={filterForma}
    onChange={(e) => setFilterForma(e.target.value)}
    style={inputStyle}
  >
    <option value="">Wszystkie formy</option>
    <option value="online">Online</option>
    <option value="stacjonarnie">Stacjonarnie</option>
  </select>

  {/* Filtr po terminie */}
  <select
    value={filterTermin}
    onChange={(e) => setFilterTermin(e.target.value)}
    style={inputStyle}
  >
    <option value="">Wszystkie terminy</option>
    {Object.entries(terminyMap).map(([key, label]) => (
      <option key={key} value={key}>
        {label}
      </option>
    ))}
  </select>
</div>

{/* Przycisk czyszczenia */}
<button
  type="button"
  onClick={() => {
    setFilterOwner('');
    setFilterForma('');
    setFilterTermin('');
  }}
  style={{
    backgroundColor: '#ccc',
    color: '#333',
    padding: '0.8rem 1.2rem',
    borderRadius: '0.5rem',
    fontWeight: 'bold',
    fontSize: '1rem',
    border: 'none',
    cursor: 'pointer',
    marginBottom: '1rem'
  }}
>
  Wyczyść filtry
</button>



          {/* 🔹 Lista próśb */}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
  {prosby
              .sort((a, b) => {
                const dateA =
                  typeof a.dataZgloszenia?.toDate === 'function'
                    ? a.dataZgloszenia.toDate()
                    : new Date(a.dataZgloszenia);
                const dateB =
                  typeof b.dataZgloszenia?.toDate === 'function'
                    ? b.dataZgloszenia.toDate()
                    : new Date(b.dataZgloszenia);
                return dateB - dateA; // najnowsze na górze
              })
              .filter(
                (p) =>
                  (!filterOwner ||
                    p.ownerName?.toLowerCase().includes(filterOwner.toLowerCase())) &&
                  (!filterForma || p.forma === filterForma) &&
                  (!filterTermin || p.termin === filterTermin)
              )
              .map((p) => {
                let date: Date | null = null;

                if (p.dataZgloszenia) {
                  if (typeof p.dataZgloszenia.toDate === 'function') {
                    date = p.dataZgloszenia.toDate();
                  } else {
                    date = new Date(p.dataZgloszenia);
                  }
                }

                const formattedDate =
                  date && !isNaN(date.getTime())
                    ? `${date.toLocaleDateString()} (${date.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })})`
                    : '—';

                    

                return (

                  
                  <li
                    key={p.id}
                    style={{
                      marginBottom: '1rem',
                      padding: '1rem',
                      border: '1px solid #ccc',
                      borderRadius: '0.4rem',
                    }}
                  >
                    
                    <p style={{ fontSize: "1.2rem", fontWeight: "bold" }}>Temat wiadomości: {p.temat || '—'}</p>
                    <p><strong>Data zgłoszenia:</strong> {formattedDate}</p>
                    <p><strong>Preferowany termin konsultacji:</strong> {terminyMap[p.termin] || p.termin}</p>
<p>
  <strong>Forma kontaktu:</strong>{" "}
  {Array.isArray(p.forma)
    ? p.forma.join(", ")
    : p.forma || "Brak"}
</p>
{(p.lokalizacja || p.potwierdzonaLokalizacja) && (
  <p><strong>Lokalizacja stajni:</strong> {p.lokalizacja || p.potwierdzonaLokalizacja}</p>
)}

                    <p><strong>Opis:</strong> {p.opis}</p>
                    <p><strong>Właściciel:</strong> {p.ownerName || 'Nieznany'}</p>

                    {/* 🔹 Przyciski w jednej linii z odstępem */}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
  <button
    onClick={() => {
  setSelectedRequestId(p.id);
  setAcceptDate('');
  setAcceptTime('');
  
  // 🔥 Tu przypisz formy kontaktu z prośby do state'u
  const forma = p.forma;
  const formy = Array.isArray(forma)
    ? forma
    : typeof forma === 'string'
      ? [forma]
      : [];
  setSelectedRequestForms(formy); // <-- najważniejsze
  setConfirmedForms(formy); // <- opcjonalnie, jeśli chcesz mieć je domyślnie zaznaczone

  setShowAcceptModal(true);
}}

    style={{ padding: '0.5rem 1rem', backgroundColor: '#0D1F40', color: 'white', border: 'none', borderRadius: '0.3rem' }}
  >
    ✅ Zaakceptuj i podaj termin
  </button>

  <button
    onClick={() => {
      setSelectedRequestId(p.id);
      setRejectReason('');
      setShowReasonModal(true);
    }}
    style={{ padding: '0.5rem 1rem', backgroundColor: '#c00', color: 'white', border: 'none', borderRadius: '0.3rem' }}
  >
    ❌ Odrzuć
  </button>

<button
  onClick={() =>
    handleOpenChat(
      router,
      p.ownerEmail ?? "",                         // zawsze string
      "specialista",
      p.temat ?? "Bez tematu",
      p.dataZgloszenia?.toDate
        ? p.dataZgloszenia.toDate().toISOString()
        : String(p.dataZgloszenia ?? ""),
      (chatId) => {
        setActiveTab("czat");
        setSelectedChatId(chatId);
      }
    )
  }
  style={{
    backgroundColor: "#0077cc",
    color: "white",
    padding: "0.5rem 1rem",
    borderRadius: "0.3rem",
    border: "none",
    cursor: "pointer"
  }}
>
  💬 Napisz do właściciela
</button>





</div>

                  </li>
                );
              })}
          </ul>
        </>
      )}
    </>
  );

case "czat":
  return (
    <div style={{ display: "flex", height: "80vh", gap: "24px" }}>
      <div style={{ width: "30%", overflowY: "auto", borderRight: "1px solid #ddd" }}>
        <ChatSidebar
  role="specjalista"
  activeChatId={selectedChatId}   // 🆕 przekazujemy aktywny czat
  onSelectChat={(chatId) => setSelectedChatId(chatId)}
/>
      </div>
      <div style={{ flex: 1, padding: "16px" }}>
        {selectedChatId ? (
          <ChatBox
  chatId={selectedChatId}
  role="specjalista"
  onBack={() => setSelectedChatId(null)}
/>

        ) : (
          <p style={{ padding: "16px", color: "#555" }}>
            Wybierz czat z listy po lewej stronie.
          </p>
        )}
      </div>
    </div>
  )


case 'konsultacje':
  return <><h2>Planowane konsultacje</h2><p>Konsultacje zaplanowane na najbliższe dni...</p></>;
case 'historia':
  return <><h2>Historia konsultacji</h2><p>Zakończone konsultacje...</p></>;
case 'anulowaneKonsultacje':
  return <><h2>Anulowane konsultacje</h2><p>Konsultacje anulowane przez klientów lub specjalistę...</p></>;
case 'zalecenia':
  return <><h2>Moje zalecenia</h2><p>Lista wykonanych konsultacji</p></>;

    
        

case 'wariantKonta':
  return <><h2>Wybór wariantu konta</h2><p>Wybierz spośród dostępnych opcji: Basic, Pro, Premium.</p></>;

case 'profilUstawienia':
  return <><h2>Ustawienia profilu</h2><p>Edytuj swoje dane kontaktowe i profil.</p></>;

  case 'bezpieczenstwo':
  return (
    <>
      <h2>Bezpieczeństwo konta</h2>
      <form onSubmit={handleUpdateProfile} style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        <label>
          Imię:
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </label>
        <label>
          Nazwisko:
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </label>
        <label>
          Telefon:
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label>
          Nowy e-mail:
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
        </label>
        <label>
  Nowe hasło:
  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
  <small style={{ color: '#666' }}>
    🔒 Hasło dotyczy całego konta (niezależnie od wybranej roli)
  </small>
</label>

        <button style={buttonStyle} type="submit">Zapisz zmiany</button>
        {status && <p style={{ color: 'green' }}>{status}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </>
  );

  case 'oczekujące':
  return <><h2>Oczekujące oferty</h2><p>Oferty złożone, które czekają na potwierdzenie przez właścicieli.</p></>;

case 'zaakceptowane':
  return <><h2>Zaakceptowane oferty</h2><p>Lista ofert, które zostały zaakceptowane i są w trakcie realizacji.</p></>;

case 'odrzucone':
  return <><h2>Odrzucone oferty</h2><p>Oferty, które nie zostały zaakceptowane przez klientów.</p></>;

case 'anulowaneOferty':
  return <><h2>Anulowane oferty</h2><p>Oferty, które zostały anulowane przez jedną ze stron.</p></>;

case 'aktualne':
  return <><h2>Rozpoczęte konwersacje</h2><p>Twoje aktywne rozmowy z klientami.</p></>;

case 'historiaWiadomosci':
  return <><h2>Historia wiadomości</h2><p>Archiwalne konwersacje z właścicielami koni.</p></>;

case 'planowanyUdzial':
  return <><h2>Planowany udział w wydarzeniach</h2><p>Lista wydarzeń, na które jesteś zapisany.</p></>;

case 'historiaWydarzen':
  return <><h2>Historia wydarzeń</h2><p>Twoja historia udziału w poprzednich wydarzeniach.</p></>;

case 'certyfikaty':
  return <><h2>Moje certyfikaty</h2><p>Lista certyfikatów potwierdzających udział w wydarzeniach</p></>;
     
case 'dodajWydarzenie':
  return (
    <>
      <h2>Dodaj wydarzenie</h2>
      <form style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        <input type="text" placeholder="Tytuł wydarzenia" required />
        <input type="text" placeholder="Data" required />
        <input type="text" placeholder="Lokalizacja" required />
        <input type="text" placeholder="Prowadzący" required />
        <textarea placeholder="Opis wydarzenia" required rows={4} />
        <button type="submit" style={buttonStyle}>Dodaj wydarzenie</button>
      </form>
    </>
  );

case 'anulowaneWydarzenia':
  return <><h2>Anulowane wydarzenia</h2><p>Wydarzenia, które zostały odwołane lub anulowane przez organizatora.</p></>;

     
case 'oczekujace':
  return <><h2>Oczekujące płatności</h2><p>Usługi lub konsultacje, które nie zostały jeszcze opłacone.</p></>;

case 'zrealizowane':
  return <><h2>Opłaty zrealizowane</h2><p>Historia płatności za usługi, które już zostały opłacone.</p></>;


        case 'wydarzenia':
  return (
    <>
      <h2>Moje wydarzenia</h2>

      {/* Formularz dodania wydarzenia */}
      <section style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '0.6rem' }}>
        <h3>➕ Dodaj nowe wydarzenie</h3>
        <form style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
          <input type="text" placeholder="Tytuł wydarzenia" required />
          <input type="text" placeholder="Data (np. 10.09.2025)" required />
          <input type="text" placeholder="Lokalizacja (Online / Miasto)" required />
          <input type="text" placeholder="Prowadzący" required />
          <input type="text" placeholder="Cena (zł)" required />
          <textarea placeholder="Opis wydarzenia" rows={4} required />
          <button type="submit" style={buttonStyle}>Dodaj wydarzenie</button>
        </form>
      </section>

      {/* Lista zapisanych wydarzeń */}
      <section style={{ marginTop: '2rem' }}>
        <h3>📅 Wydarzenia, na które jesteś zapisany</h3>
        <ul style={{ marginTop: '1rem', paddingLeft: '1rem' }}>
          <li><strong>Webinar:</strong> Zrozumienie stresu u koni – 22.08.2025 – Online</li>
          <li><strong>Warsztat:</strong> Dopasowanie siodła – 01.09.2025 – Stajnia Warszawa</li>
        </ul>
      </section>
    </>
  );

case 'kalendarz':
  return <KalendarzPage role="specjalista" />;



case 'oferty':
  const MojeOferty = dynamic(() => import('@/components/MojeOferty'), { ssr: false });
  return <MojeOferty />;


      case 'znajdzZgloszenie':
        return <><h2>Znajdź nowe zgłoszenei problemu</h2><p>Lista zgłoszeń</p></>;

      case 'wiadomosci':
        return (
          <>
            <h2>Wiadomości od klientów</h2>
            <p>Odpowiadaj na zapytania klientów:</p>
            <ul style={{ marginTop: '1rem' }}>
              <li><strong>o_grabowska@poczta.onet.pl</strong> – "Dziękuję za ofertę, czy możemy umówić się w sobotę?"</li>
              <li><strong>klient2@onet.pl</strong> – "Czy oferuje Pan konsultacje online?"</li>
            </ul>
          </>
        );

      case 'platnosci':
        return (
          <>
            <h2>Płatności</h2>
            <p>Podsumowanie dochodów i wystawionych faktur:</p>
            <ul style={{ marginTop: '1rem' }}>
              <li>01.07.2025 – 200 zł – Konsultacja online – Opłacone</li>
              <li>27.06.2025 – 250 zł – Konsultacja stacjonarna – Opłacone</li>
            </ul>
          </>
        );

      default:
        return <p>Wybierz zakładkę z menu po lewej.</p>;
    }
  };

 

  return (
    <div style={{ display: 'flex', minHeight: '90vh' }}>
      {/* MENU LEWE */}
      <aside
  style={{
    width: '250px',
    backgroundColor: '#f2f2f2',
    padding: '2rem 1rem',
    borderRight: '1px solid #ccc',
  }}
>
  <h3 style={{ marginBottom: '2rem', color: '#0D1F40' }}>Panel specjalisty</h3>
  <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    {menuItems.map((item) => (
      <div key={item.id}>
        <button
  onClick={() => {
  if (item.onClick) {
    item.onClick(); // uruchomi handleOpenKalendarz
  } else if (item.submenu) {
    toggleSubmenu(item.id);
  } else {
    setActiveTab(item.id);
  }
}}

  style={{
    background: activeTab === item.id ? '#0D1F40' : 'transparent',
    color: activeTab === item.id ? 'white' : '#0D1F40',
    border: 'none',
    padding: '0.8rem 1rem',
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: "1rem",
    borderRadius: '0.5rem',
    cursor: 'pointer',
    width: '100%',
  }}
>
<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
  {item.id === 'czat' ? (
    <>
      <span>Wiadomości (czat)</span>
      <ChatUnreadBadge role="specjalista" />

    </>
  ) : (
    item.label
  )}


  {item.id === 'prosby' && prosby.length > 0 && (
    <span style={{
      backgroundColor: '#c00',
      color: 'white',
      padding: '0.2rem 0.5rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      marginLeft: '0.5rem',
    }}>
      {prosby.length}
    </span>
  )}
  {item.id === 'kalendarz' && calendarCount > 0 && (
  <span style={{
    backgroundColor: '#c00',
    color: 'white',
    padding: '0.2rem 0.5rem',
    borderRadius: '999px',
    fontSize: '0.75rem',
    marginLeft: '0.5rem',
  }}>
    {calendarCount}
  </span>
)}


  {item.id === 'oferty' && totalOferty > 0 && (
    <span style={{
      backgroundColor: '#0D1F40',
      color: 'white',
      padding: '0.2rem 0.5rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      marginLeft: '0.5rem',
    }}>
      {newOferty}/{totalOferty}
    </span>
  )}
</span>

        </button>

        {item.submenu && expandedMenus.includes(item.id) && (
          <div style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
            {item.submenu.map((subItem) => (
              <button
                key={subItem.id}
                onClick={() => setActiveTab(subItem.id)}
                style={{
                  background: activeTab === subItem.id ? '#0D1F40' : 'transparent',
                  color: activeTab === subItem.id ? 'white' : '#0D1F40',
                  border: 'none',
                  padding: '0.4rem 1rem',
                  textAlign: 'left',
                  fontSize: '1rem',
                  borderRadius: '0.4rem',
                  cursor: 'pointer',
                  width: '100%',
                  fontWeight: 'normal',
                  fontFamily: 'inherit', 
                }}
              >
                {subItem.label}
              </button>
            ))}
          </div>
        )}
      </div>
    ))}
  </nav>
</aside>

      {/* WIDOK GŁÓWNY */}
      <main style={{ flex: 1, padding: '2rem' }}>
        {renderContent()}
      </main>

      {showSaveConfirmation && (
  <div style={{
    position: 'fixed',
    top: 0, left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  }}>
    <div style={{
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '1rem',
      maxWidth: '400px',
      width: '100%',
      boxShadow: '0 0 10px rgba(0,0,0,0.2)',
      textAlign: 'center'
    }}>
      <h3>Dane zostały zapisane 🎉</h3>
      <p>Zmiany w Twoim profilu zostały pomyślnie zapisane.</p>
      <button
        onClick={() => setShowSaveConfirmation(false)}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#0D1F40',
          color: 'white',
          border: 'none',
          borderRadius: '0.3rem'
        }}
      >
        Zamknij
      </button>
    </div>
  </div>
)}

{infoModalMessage && (
  <div style={modalOverlay}>
    <div style={modalContent}>
      <p style={{ textAlign: 'justify' }}>{infoModalMessage}</p>
      <button
        onClick={() => setInfoModalMessage(null)}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#0D1F40',
          color: 'white',
          border: 'none',
          borderRadius: '0.3rem'
        }}
      >
        Zamknij
      </button>
    </div>
  </div>
)}


{statusModalMessage && (
  <div style={modalOverlay}>
    <div style={modalContent}>
      <p style={{ textAlign: 'justify' }}>{statusModalMessage}</p>
      <button
        onClick={() => setStatusModalMessage(null)}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#0D1F40',
          color: 'white',
          border: 'none',
          borderRadius: '0.3rem'
        }}
      >
        Zamknij
      </button>
    </div>
  </div>
)}


{showAcceptModal && (
  <div style={modalOverlay}>
    <div style={modalContent}>
      <h3>Podaj termin konsultacji</h3>

      {/* Wybór daty */}
      <input
        type="date"
        value={acceptDate}
        onChange={(e) => setAcceptDate(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
      />

      {/* Wybór godziny */}
      <input
        type="time"
        value={acceptTime}
        onChange={(e) => setAcceptTime(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
      />

      {/* Checkboxy z formami kontaktu */}
      <div style={{ marginBottom: '1rem' }}>
  <strong>Wybierz formę kontaktu:</strong>
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
    {Array.isArray(selectedRequestForms) &&
      selectedRequestForms.map((forma: string, idx: number) => (
        <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <input
            type="checkbox"
            value={forma}
            checked={confirmedForms.includes(forma)}
            onChange={(e) => {
              if (e.target.checked) {
                setConfirmedForms(prev => [...prev, forma]);
              } else {
                setConfirmedForms(prev => prev.filter(f => f !== forma));
              }
            }}
          />
          {forma}
        </label>
      ))}
  </div>
</div>


      {/* Przyciski */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <button onClick={() => setShowAcceptModal(false)}>Anuluj</button>
        <button
          onClick={() => acceptRequestWithDate(selectedRequestId!)}
          style={{ backgroundColor: '#0D1F40', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.3rem' }}
        >
          Potwierdź termin
        </button>
      </div>
    </div>
  </div>
)}




       {showReasonModal && (
  <div style={modalOverlay}>
    <div style={modalContent}>
      <h3>Powód odrzucenia</h3>
      <select
        value={rejectReason}
        onChange={(e) => setRejectReason(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
      >
        <option value="">-- Wybierz powód --</option>
        {predefinedRejectReasons.map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
        <option value="inny">Inny powód</option>
      </select>
      {rejectReason === 'inny' && (
        <textarea
          placeholder="Wpisz inny powód..."
          onChange={(e) => setRejectReason(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', minHeight: '80px' }}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <button onClick={() => setShowReasonModal(false)}>Anuluj</button>
        <button
          onClick={() => {
            if (selectedRequestId && rejectReason.trim()) {
              updateRequestStatus(selectedRequestId, 'odrzucone', rejectReason.trim());
              setShowReasonModal(false);
            } else {
              setInfoModalMessage('⚠️ Wybierz lub wpisz powód.');

            }
          }}
          style={{ backgroundColor: '#c00', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.3rem' }}
        >
          Potwierdź odrzucenie
        </button>
      </div>
    </div>
  </div>
)}

{showOfertaDialog && (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000
  }}>
    <div style={{
      background: 'white',
      padding: '2rem',
      borderRadius: '1rem',
      width: '400px',
      maxWidth: '90%',
      maxHeight: '90vh',
      overflowY: 'auto'
    }}>
      <h3 style={{ marginBottom: '1rem', color: '#0D1F40' }}>
        {editingOfertaId ? '✏️ Edytuj ofertę' : '💡 Zaproponuj pomoc'}
      </h3>

      <label>Proponowane terminy:</label>
      {terminy.map((t, index) => (
        <div key={index} style={{ marginBottom: '1rem', borderBottom: '1px dashed #ccc', paddingBottom: '1rem' }}>
          <label>Data konsultacji:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
            <input
              type="date"
              value={t.date}
              onChange={(e) => {
                const newTerminy = [...terminy];
                newTerminy[index].date = e.target.value;
                setTerminy(newTerminy);
              }}
              style={inputOfertaStyle}
            />
          </div>

          <label>Godzina:</label>
          <input
            type="time"
            value={t.time}
            onChange={(e) => {
              const newTerminy = [...terminy];
              newTerminy[index].time = e.target.value;
              setTerminy(newTerminy);
            }}
            style={inputOfertaStyle}
          />

          {terminy.length > 1 && (
            <button
              onClick={() => setTerminy(terminy.filter((_, i) => i !== index))}
              style={{ ...buttonOfertaSecondary, backgroundColor: '#eee', fontSize: '0.85rem', marginTop: '0.5rem' }}
            >
              Usuń ten termin
            </button>
          )}
        </div>
      ))}

      <button
        onClick={() => setTerminy([...terminy, { date: '', time: '' }])}
        style={{ ...buttonOfertaSecondary, marginBottom: '1rem' }}
      >
        ➕ Dodaj kolejny termin
      </button>

      <label>Cena orientacyjna (od):</label>
      <input
        type="number"
        value={priceFrom}
        onChange={(e) => setPriceFrom(e.target.value)}
        style={inputOfertaStyle}
      />

      <label>Cena orientacyjna (do):</label>
      <input
        type="number"
        value={priceTo}
        onChange={(e) => setPriceTo(e.target.value)}
        style={inputOfertaStyle}
      />

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button style={buttonOfertaSecondary} onClick={() => setShowOfertaDialog(false)}>Anuluj</button>
        <button style={buttonOfertaPrimary} onClick={handleZapiszOferte}>
          {editingOfertaId ? '💾 Zapisz zmiany' : 'Potwierdź'}
        </button>
      </div>
    </div>
  </div>
)}


    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#0D1F40',
  color: 'white',
  padding: '0.4rem 0.8rem',
  borderRadius: '0.3rem',
  fontSize: '0.9rem',
  border: 'none',
  cursor: 'pointer',
};

// 📌 Style dla modala – dodaj przed return w komponencie
const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalContent: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '2rem',
  borderRadius: '1rem',
  maxWidth: '400px',
  width: '100%',
  boxShadow: '0 0 10px rgba(0,0,0,0.2)',
  textAlign: 'center'
};
