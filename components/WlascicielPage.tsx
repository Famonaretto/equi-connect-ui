'use client';

import { useState, useEffect } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  updateEmail,
  updatePassword
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  getDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import ListaZgloszenDlaUzytkownika from './ListaZgloszenDlaUzytkownika';
import KalendarzPage from '@/components/KalendarzPage';
import { QuerySnapshot, DocumentData, DocumentChange } from 'firebase/firestore';
import { useCalendarCounter, resetCalendarSubstatuses } from "@/components/CalendarCounter";
import {  addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { handleOpenChat } from "@/utils/chatUtils";
import ChatSidebar from './ChatSidebar';
import ChatBox from './ChatBox';
import dynamic from 'next/dynamic';
import ProfilKoniaForm from '@/app/wlasciciele/profilKonia/ProfilKoniaForm';
import OcenaZachowaniaPage from '@/app/ankieta/page';
import ListaOcenKonia from './ListaOcenKonia';
import SzczegolyOcenyKonia from './SzczegolyOcenyKonia';
import UmowioneKonsultacje from './UmowioneKonsultacje';
import ZaleceniaKoniaPage from '@/app/zaleceniaLista/[id]/page';
import ListaZgloszenWlasciciela from './ListaZgloszenWlasciciela';






export default function WlascicielPage() {

const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
const ChatUnreadBadge = dynamic(() => import('@/components/ChatUnreadBadge'), { ssr: false });

  
  const [activeTab, setActiveTab] = useState('oceny');
  const [loading, setLoading] = useState(true);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [oceny, setOceny] = useState<any[]>([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [prosby, setProsby] = useState<any[]>([]);

  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [infoModalMessage, setInfoModalMessage] = useState<string | null>(null);

const calendarCount = useCalendarCounter('wlasciciel');
const [selectedHorseId, setSelectedHorseId] = useState<string | undefined>(undefined);
const [selectedHorseName, setSelectedHorseName] = useState<string | undefined>(undefined);
const [selectedOcenaId, setSelectedOcenaId] = useState<string | undefined>(undefined);





const handleOpenKalendarzOwner = async () => {
  await resetCalendarSubstatuses('wlasciciel');
  setActiveTab("kalendarz");
};


const [cancelNotification, setCancelNotification] = useState<null | { specjalista: string; data: string }>(null);



  useEffect(() => {
  const auth = getAuth(app);
  const db = getFirestore(app);

  const unsubAuth = onAuthStateChanged(auth, (user) => {
    if (!user?.email) return;

    // zapytanie OR
const q = query(
  collection(db, "konsultacje"),
  where("ownerEmail", "==", user.email),
  where("substatusW", "in", ["NW", "NOW"])
);


    const qProsby = query(
  collection(db, 'konsultacje'),
  where('ownerEmail', '==', user.email),
  where('status', 'in', ['oczekujące', 'zaakceptowane', 'odrzucone'])
);

onSnapshot(qProsby, (snapshot) => {
  const lista = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
  setProsby(lista);
});


const q2 = query(
  collection(db, 'konsultacje'),
  where('specialistaEmail', '==', user.email),
  where('hideForSpecialist', '==', false)
);

  const listen = (queryRef: any, currentUserEmail: string) => {
  let lastSeenCalendar: Date | null = null;
  let initialLoad = true;
  const db = getFirestore(app);
  const auth = getAuth(app);
  const user = auth.currentUser;

  console.log("👂 [OWNER][LISTEN] Start nasłuchiwania dla:", currentUserEmail);

  if (user) {
    getDoc(doc(db, 'users', user.uid)).then(docSnap => {
  if (docSnap.exists()) {
    const data = docSnap.data();
    lastSeenCalendar = data.lastCalendarViewOwner?.toDate?.() || null;
    console.log("📅 [OWNER][LISTEN] lastCalendarViewOwner z bazy:", lastSeenCalendar);
  }
 else {
        console.log("⚠️ [OWNER][LISTEN] Brak dokumentu użytkownika w 'users'");
      }
    });
  }

  return onSnapshot(queryRef, (snapshot: QuerySnapshot<DocumentData>) => {
    console.log("📡 [OWNER][LISTEN] snapshot.docChanges:", snapshot.docChanges().length);

    snapshot.docChanges().forEach(async (change: DocumentChange<DocumentData>) => {
      const data = change.doc.data();
      const isNew = change.type === 'added';
      const isStatusChanged = change.type === 'modified' && !!data.status;
      const updatedAt = data.updatedAt?.toDate?.() || null;

// ⛔ ignorujemy eventy, w których Firestore jeszcze nie ustawił updatedAt
if (!updatedAt) return;

// Podczas pierwszego ładowania pomijamy stare zmiany
if (initialLoad) {
  if (!lastSeenCalendar || updatedAt <= lastSeenCalendar) {
    return;
  }
}


      if (
        (isNew && data.status === 'planowane') ||
       (isStatusChanged && data.status === 'planowane') ||
(isStatusChanged && data.status === 'anulowane') ||
(isStatusChanged && data.status === 'odwołane')

      ) {
        console.log("✅ [OWNER][LISTEN] Zmiana kwalifikuje się do powiadomienia");

     }

      if (isStatusChanged && data.status === 'anulowane' && data.lastUpdatedBy !== currentUserEmail) {
        console.log("❌ [OWNER][LISTEN] Powiadamiam o anulowaniu");
        setCancelNotification({
          specjalista: data.specjalista || 'Nieznany',
          data: data.proponowanyTermin || 'nieznana data'
        });
      }
    });

    initialLoad = false;
  });
};




  });

  return () => unsubAuth();
}, []);

const [konie, setKonie] = useState<any[]>([]);

useEffect(() => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return;

  const q = query(collection(db, "konie"), where("ownerUid", "==", user.uid));
  const unsub = onSnapshot(q, (snapshot) => {
    setKonie(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });

  return () => unsub();
}, []);

const router = useRouter();

const [showCancelModal, setShowCancelModal] = useState(false);
const [cancelReason, setCancelReason] = useState('');
const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);

const cancelReasonsList = [
  "Znalazłem innego specjalistę",
  "Problem został rozwiązany",
  "Inny powód"
];

const [filterStatus, setFilterStatus] = useState('');
const [filterForma, setFilterForma] = useState('');


  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        setNewEmail(user.email);

        const userDoc = await getDocs(
          query(collection(db, 'users'), where('uid', '==', user.uid))
        );

        if (!userDoc.empty) {
          const data = userDoc.docs[0].data();
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setPhone(data.phone || '');
        }

        const ocenyQuery = query(
          collection(db, 'oceny_zachowania'),
          where('email', '==', user.email)
        );

        const snapshot = await getDocs(ocenyQuery);
        const wyniki = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setOceny(wyniki);
      } else {
        setUserEmail(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenKalendarz = async () => {
  const auth = getAuth(app);
  const user = auth.currentUser;
  if (!user) return;

  const db = getFirestore(app);

  // pobierz wszystkie NW i NOW właściciela
  const q = query(
    collection(db, "konsultacje"),
    where("ownerEmail", "==", user.email),
    where("substatus", "in", ["NW", "NOW"])
  );

  const snap = await getDocs(q);

// zmień NW -> SW i NOW -> SOW tylko dla substatusW
const updates = snap.docs.map(docSnap => {
  const subW = docSnap.data().substatusW;
  let newSubW = subW;
  if (subW === "NW") newSubW = "SW";
  if (subW === "NOW") newSubW = "SOW";
  return updateDoc(docSnap.ref, { substatusW: newSubW });
});


  await Promise.all(updates);

  // wyzeruj licznik
  setActiveTab("kalendarz");
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

      await setDoc(doc(db, 'users', user.uid), {
        firstName,
        lastName,
        phone,
        uid: user.uid,
        email: newEmail || user.email,
      }, { merge: true });

      setStatus('Dane zostały zaktualizowane.');
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd przy aktualizacji.');
    }
  };

const handleDeleteRequest = async (id: string) => {
  try {
    const db = getFirestore(app);
    const role = 'wlasciciel'; // 📌 Na razie wpisz ręcznie lub pobierz z kontekstu/logowania

console.log("[OWNER] Ukrywam konsultację", {
  konsultacjaId: id,
  rola: role,
  lastUpdatedBy: userEmail
});

await setDoc(doc(db, 'konsultacje', id), {
  ...(role === 'wlasciciel' ? { hideForOwner: true } : { hideForSpecialist: true }),
  updatedAt: serverTimestamp(),
  lastUpdatedBy: userEmail || ''
}, { merge: true });

console.log("[OWNER] Ukrycie konsultacji zapisane w bazie:", id);


    setProsby(prev => prev.filter(p => p.id !== id));
    setInfoModalMessage('🗑 Pozycja została usunięta.');
  } catch (error) {
    console.error('Błąd podczas usuwania pozycji:', error);
    setInfoModalMessage('❌ Wystąpił błąd przy usuwaniu pozycji.');
  }
};

  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  if (loading) return <p style={{ padding: '2rem' }}>Ładowanie danych użytkownika...</p>;

  const menuItems = [
    
    { 
    id: 'prosby', 
    label: 'Moje prośby o konsultację', 
    count: prosby.length // ✅ licznik jak w prosby
  },
   
    { id: 'zgloszenia', label: 'Moje zgłoszenia problemów' },
    { id: 'oferty', label: 'Oferty pomocy od specjalistów' },
    {id: 'umowioneKonsultacje', label: 'Umówione konsultacje' },

    
{ id: 'czat', label: 'Wiadomości (czat)' },

    {
      id: 'wydarzenia',
      label: 'Wydarzenia',
      submenu: [
        { id: 'planowanyUdzial', label: 'Planowany udział' },
        { id: 'historiaWydarzen', label: 'Historia wydarzeń' },
        { id: 'certyfikaty', label: 'Moje certyfikaty' },
        { id: 'anulowaneWydarzenia', label: 'Anulowane wydarzenia' },
      ]
    },
     {id: 'mojeKonie', label: 'Moje konie' },
    { id: 'kalendarz', label: 'Mój kalendarz', count: calendarCount, onClick: handleOpenKalendarzOwner },

    { id: 'platnosci', label: 'Płatności' },
    { id: 'ustawienia', label: 'Ustawienia konta' },

  ];

  const renderContent = () => {
    switch (activeTab) {
case 'ocenyZachowania':
  return (
    <ListaOcenKonia
      horseId={selectedHorseId!}
      horseName={selectedHorseName!}
      onBack={() => setActiveTab("mojeKonie")}   // wróć do listy/profilu koni
      onAdd={() => setActiveTab("nowaOcena")}   // otwiera ankietę
      onView={(ocenaId) => {
        setSelectedOcenaId(ocenaId);
        setActiveTab("szczegolyOceny");
      }}
    />
  );


case 'nowaOcena':
  return (
    <OcenaZachowaniaPage
      horseId={selectedHorseId}
      onBack={() => setActiveTab("ocenyZachowania")}
    />
  );

case 'szczegolyOceny':
  return (
    <SzczegolyOcenyKonia
      horseId={selectedHorseId!}
      ocenaId={selectedOcenaId!}
      onBack={() => setActiveTab("ocenyZachowania")}
    />
  );

      case 'prosby':
  return (
    <>
      <h2>Moje prośby</h2>
      {prosby.length === 0 ? (
        <p>Brak wysłanych próśb o konsultację.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {/* Filtry */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid #ccc' }}
            >
              <option value="">Wszystkie statusy</option>
              <option value="oczekujące">⏳ Oczekujące</option>
              <option value="zaakceptowane">✅ Zaakceptowane</option>
              <option value="odrzucone">❌ Odrzucone</option>
            </select>

            <select
              value={filterForma}
              onChange={(e) => setFilterForma(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid #ccc' }}
            >
              <option value="">Wszystkie formy</option>
              <option value="online">Online</option>
              <option value="stacjonarnie">Stacjonarnie</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => { setFilterStatus(''); setFilterForma(''); }}
            style={{
              backgroundColor: '#ccc',
              color: '#333',
              padding: '0.5rem 1rem',
              borderRadius: '0.4rem',
              border: 'none',
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            Wyczyść filtry
          </button>

          {prosby
            .sort((a, b) => {
              const dateA = a.dataZgloszenia?.toDate?.() || new Date(0);
              const dateB = b.dataZgloszenia?.toDate?.() || new Date(0);
              return dateB.getTime() - dateA.getTime();
            })
            .filter(
              (p) =>
                (!filterStatus || p.status === filterStatus) &&
                (!filterForma || p.forma === filterForma)
            )
            .map((p) => (
              <li
                key={p.id}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}
              >
                <p><strong>Specjalista:</strong> {p.specjalista}</p>
<p><strong>Data zgłoszenia:</strong> {p.dataZgloszenia?.toDate?.().toLocaleDateString?.() || '—'}</p>

{p.proponowanyTermin && (
  <p><strong>Proponowany termin:</strong> {p.proponowanyTermin}</p>
)}

{p.potwierdzoneFormy && Array.isArray(p.potwierdzoneFormy) && p.potwierdzoneFormy.length > 0 ? (
  <p><strong>Forma kontaktu:</strong> {p.potwierdzoneFormy.join(', ')}</p>
) : (
  <p><strong>Forma kontaktu:</strong> {Array.isArray(p.forma) ? p.forma.join(', ') : p.forma}</p>
)}

{(p.lokalizacja || p.potwierdzonaLokalizacja) && (
  <p><strong>Lokalizacja stajni:</strong> {p.lokalizacja || p.potwierdzonaLokalizacja}</p>
)}

<p><strong>Temat konsultacji:</strong> {p.temat || '—'}</p>   {/* 🆕 dodane pole */}

<p><strong>Opis:</strong> {p.opis || 'Brak opisu'}</p>

<p>
  <strong>Status:</strong>{' '}
  {p.status === 'oczekujące' && '⏳ Oczekuje na decyzję'}
  {p.status === 'zaakceptowane' && '✅ Zaakceptowane – oczekuje na Twoją decyzję'}
  {p.status === 'odrzucone' && '❌ Odrzucone'}
</p>

{p.status === 'odrzucone' && p.reason && (
  <p><strong>Powód odrzucenia:</strong> {p.reason}</p>
)}


                {/* Akcje dla zaakceptowanej prośby */}
{p.status === "zaakceptowane" && (
  <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
    <button
      onClick={async () => {
        const db = getFirestore(app);
        console.log("[OWNER] Potwierdzam termin", {
          konsultacjaId: p.id,
          nowyStatus: "planowane",
          lastUpdatedBy: userEmail,
        });

        await setDoc(
          doc(db, "konsultacje", p.id),
          {
            status: "planowane",
            substatusW: "NW", // właściciel – nowe planowane
            substatusS: "NS", // specjalista – nowe planowane
            updatedAt: serverTimestamp(),
            lastUpdatedBy: userEmail || "",
            hideForOwner: false,
            hideForSpecialist: false,
          },
          { merge: true }
        );

        console.log("[OWNER] Potwierdzenie zapisane w bazie:", p.id);

        setProsby((prev) => prev.filter((x) => x.id !== p.id));
        setInfoModalMessage("✅ Termin został potwierdzony.");
      }}
      style={{
        padding: "0.5rem 1rem",
        backgroundColor: "#0D1F40",
        color: "white",
        borderRadius: "0.3rem",
        border: "none",
        cursor: "pointer",
        whiteSpace: "nowrap", // ✅ nie łamie tekstu
      }}
    >
      ✅ Akceptuję termin i formę kontaktu
    </button>

    <button
      onClick={() => {
        setSelectedConsultationId(p.id);
        setCancelReason("");
        setShowCancelModal(true);
      }}
      style={{
        backgroundColor: "#c00",
        color: "white",
        padding: "0.5rem 1rem",
        borderRadius: "0.3rem",
        border: "none",
        cursor: "pointer",
      }}
    >
      ❌ Anuluj konsultację
    </button>

<button
  onClick={() =>
    handleOpenChat(
      router,
      p.specialistEmail ?? "",                   // zawsze string
      "wlasciciel",
      p.temat ?? "Bez tematu",                   // zawsze string
      p.dataZgloszenia?.toDate
        ? p.dataZgloszenia.toDate().toISOString() // Timestamp -> string
        : String(p.dataZgloszenia ?? ""),         // string/null -> string
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
  💬 Napisz do specjalisty
</button>





                  </div>
                )}

                {/* Dostęp do czatu po potwierdzeniu */}
                {p.status === 'potwierdzone' && (
                  <button
                    onClick={() => window.location.href = `/panel/wiadomosci/rozmowa?specjalista=${encodeURIComponent(p.specjalista)}`}
                    style={{ backgroundColor: '#0077cc', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.3rem', border: 'none', cursor: 'pointer', marginTop: '1rem' }}
                  >
                    💬 Otwórz czat
                  </button>
                )}

                {/* Usuwanie dla oczekujących i odrzuconych */}
                {(p.status === 'oczekujące' || p.status === 'odrzucone') && (
                  <button
                    onClick={async () => {
                      try {
                        const db = getFirestore(app);
                        await deleteDoc(doc(db, 'konsultacje', p.id));
                        setProsby(prev => prev.filter(x => x.id !== p.id));
                        setInfoModalMessage('🗑 Pozycja została usunięta.');
                      } catch (error) {
                        console.error('Błąd przy usuwaniu:', error);
                        setInfoModalMessage('❌ Wystąpił błąd podczas usuwania pozycji.');
                      }
                    }}
                    style={{
                      backgroundColor: '#999',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.3rem',
                      border: 'none',
                      cursor: 'pointer',
                      marginTop: '0.5rem'
                    }}
                  >
                    🗑 Usuń pozycję
                  </button>
                )}
              </li>
            ))}
        </ul>
      )}
    </>
  );

case 'umowioneKonsultacje':
  return <UmowioneKonsultacje />;


case "czat":
  return (
    <div style={{ display: "flex", height: "80vh", gap: "24px" }}>
      <div style={{ width: "30%", overflowY: "auto", borderRight: "1px solid #ddd" }}>
<ChatSidebar
  role="wlasciciel"
  activeChatId={selectedChatId}
onSelectChat={async (chatId) => {
  const auth = getAuth(app);
  const user = auth.currentUser;
  if (!user) return;

  const myIdentity = `${user.uid}_wlasciciel`;

  await setDoc(
    doc(db, "czaty", chatId, "readStatus", myIdentity),
    { lastReadAt: serverTimestamp() },
    { merge: true } // ✅ ważne
  );

  setSelectedChatId(chatId);
}}

/>

      </div>
      <div style={{ flex: 1, padding: "16px" }}>
        {selectedChatId ? (
          <ChatBox
  chatId={selectedChatId}
  role="wlasciciel"
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

 case 'mojeKonie':
  return (
    <div>
      <h2>Moje konie</h2>
      <button
        style={buttonStyle}
        onClick={() => setActiveTab('utworzProfilKonia')}
      >
        ➕ Utwórz profil konia
      </button>

      {konie.length === 0 ? (
        <p style={{ marginTop: "1rem" }}>Nie masz jeszcze żadnych koni w systemie.</p>
      ) : (
        <ul style={{ marginTop: "1rem", listStyle: "none", padding: 0 }}>
          {konie.map((kon) => (
            <li key={kon.id} style={{ border: "1px solid #ccc", padding: "1rem", marginBottom: "1rem", borderRadius: "8px" }}>
              <h3>{kon.imie || "Bez nazwy"}</h3>
              <p><strong>Rasa:</strong> {kon.rasa || "—"}</p>
              <p><strong>Płeć:</strong> {kon.plec || "—"}</p>

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  style={buttonStyle}
                  onClick={() => {
                    setSelectedHorseId(kon.id);
                    setActiveTab("edytujProfilKonia");
                  }}
                >
                  👁 Zobacz profil
                </button>
                <button style={buttonStyle} onClick={() => {  setSelectedHorseId(kon.id);  setActiveTab('ocenyZachowania');}}>
                📊 Oceny zachowania
              </button>

                <button style={buttonStyle}>📅 Konsultacje</button>
                <button
  style={buttonStyle}
  onClick={() => {
    console.log("✅ Kliknięto ZALECENIA dla konia:", kon.id);
    setSelectedHorseId(kon.id);          // zapisz którego konia wybrałaś
    setActiveTab("zalecenia");           // przełącz widok na zakładkę zalecenia
  }}
>
  📝 Zalecenia
</button>

              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

case 'utworzProfilKonia':
  return <ProfilKoniaForm onBack={() => setActiveTab('mojeKonie')} />;

case 'edytujProfilKonia':
  return <ProfilKoniaForm horseId={selectedHorseId ?? undefined} onBack={() => setActiveTab('mojeKonie')} />;



      case 'planowane':
        return <><h2>Planowane konsultacje</h2><p>Konsultacje oczekujące na realizację.</p></>;
      case 'historia':
        return <><h2>Historia konsultacji</h2><p>Lista zakończonych konsultacji.</p></>;
      case 'anulowane':
        return <><h2>Anulowane konsultacje</h2><p>Lista odwołanych konsultacji.</p></>;
case 'zalecenia':
  return (
    <ZaleceniaKoniaPage
      horseId={selectedHorseId!}         // 🔑 przekazujemy id konia
      onBack={() => setActiveTab('mojeKonie')}
    />
  );

case 'oferty':
        return <><h2>Oferty pomocy</h2><p>Przegląd ofert od specjalistów.</p></>;
        
case 'zgloszenia':
  return (
    <>
      
      <ListaZgloszenWlasciciela />
    </>
  );





      case 'aktualne':
        return <><h2>Rozpoczęte konwersacje</h2><p>Aktywne rozmowy z ekspertami.</p></>;
      case 'historiaWiadomosci':
        return <><h2>Historia wiadomości</h2><p>Archiwalne konwersacje.</p></>;
      case 'planowanyUdzial':
        return <><h2>Planowany udział</h2><p>Lista zaplanowanych wydarzeń.</p></>;
      case 'historiaWydarzen':
        return <><h2>Historia wydarzeń</h2><p>Ukończone i przeszłe wydarzenia.</p></>;
      case 'certyfikaty':
        return <><h2>Moje certyfikaty</h2><p>Lista certyfikatów potwierdzających udział w wydarzeniach.</p></>;
      case 'anulowaneWydarzenia':
        return <><h2>Anulowane wydarzenia</h2><p>Odwołane wydarzenia.</p></>;
      case 'kalendarz':
  return (
    <>
      {cancelNotification && (
        <div style={{
          backgroundColor: '#ffe6e6',
          color: '#c00',
          padding: '1rem',
          marginBottom: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid #c00'
        }}>
          ❌ Konsultacja z <strong>{cancelNotification.specjalista}</strong> w dniu <strong>{cancelNotification.data}</strong> została anulowana.
          <button
            onClick={() => setCancelNotification(null)}
            style={{
              marginLeft: '1rem',
              padding: '0.3rem 0.6rem',
              backgroundColor: '#c00',
              color: 'white',
              border: 'none',
              borderRadius: '0.3rem',
              cursor: 'pointer'
            }}
          >
            OK
          </button>
        </div>
      )}
      <KalendarzPage role="wlasciciel" />
    </>
  );



      case 'ustawienia':
        return (
          <>
            <h2>Ustawienia konta</h2>
            <form onSubmit={handleUpdateProfile} style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
    }
  };

return (
  <div style={{ display: 'flex', minHeight: '90vh' }}>
    <aside style={{ width: '250px', backgroundColor: '#f2f2f2', padding: '2rem 1rem', borderRight: '1px solid #ccc' }}>
        <h3 style={{ marginBottom: '2rem', color: '#0D1F40' }}>Panel właściciela</h3>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {menuItems.map((item) => (
            <div key={item.id}>
              <button
  onClick={() => {
    if (item.onClick) item.onClick();
    if (!item.submenu) setActiveTab(item.id);
    else toggleSubmenu(item.id);
  }}
  style={{
    background: activeTab === item.id ? '#0D1F40' : 'transparent',
    color: activeTab === item.id ? 'white' : '#0D1F40',
    border: 'none',
    padding: '0.8rem 1rem',
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: '1rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    width: '100%',
  }}
>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
  {item.id === 'czat' ? (
    <>
      <span>Wiadomości (czat)</span>
      <ChatUnreadBadge role="wlasciciel" />
    </>
  ) : (
    item.label
  )}
</span>

  {/* licznik tylko dla prosb */}
{item.id === 'prosby' ? (
  prosby.length > 0 && (
    <span style={{
      backgroundColor: '#c00',
      color: 'white',
      padding: '0.2rem 0.5rem',
      borderRadius: '999px',
      fontSize: '0.75rem'
    }}>
      {prosby.length}
    </span>
  )
) : (
  typeof item.count === 'number' && item.count > 0 && (
    <span style={{
      backgroundColor: '#c00',
      color: 'white',
      padding: '0.2rem 0.5rem',
      borderRadius: '999px',
      fontSize: '0.75rem'
    }}>
      {item.count}
    </span>
  )
)}



</div>


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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {subItem.label}
        {subItem.id === 'prosby' && prosby.length > 0 && (
          <span style={{
            backgroundColor: '#c00',
            color: 'white',
            padding: '0.2rem 0.5rem',
            borderRadius: '999px',
            fontSize: '0.75rem'
          }}>
            {prosby.length}
          </span>
        )}
      </button>
    ))}
  </div>
)}

            </div>
          ))}
        </nav>
      </aside>

    <main style={{ flex: 1, padding: '2rem' }}>
      {renderContent()}
    </main>

    {/* Modal informacyjny */}
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
              borderRadius: '0.3rem',
              cursor: 'pointer'
            }}
          >
            Zamknij
          </button>
        </div>
      </div>
    )}

    {/* Modal anulowania */}
    {showCancelModal && (
      <div style={modalOverlay}>
        <div style={modalContent}>
          <h3>Podaj powód anulowania</h3>
          <select
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
          >
            <option value="">-- Wybierz powód --</option>
            {cancelReasonsList.map(reason => (
              <option key={reason} value={reason}>{reason}</option>
            ))}
          </select>
          {cancelReason === "Inny powód" && (
            <textarea
              placeholder="Wpisz inny powód..."
              onChange={(e) => setCancelReason(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', minHeight: '80px' }}
            />
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button onClick={() => setShowCancelModal(false)}>Anuluj</button>
            <button
              onClick={async () => {
                if (!cancelReason.trim()) {
                  setInfoModalMessage("❌ Podaj powód anulowania.");
                  return;
                }
                if (selectedConsultationId) {
  const db = getFirestore(app);
console.log("[OWNER] Anuluję konsultację", {
  konsultacjaId: selectedConsultationId,
  nowyStatus: "anulowane",
  lastUpdatedBy: userEmail
});

// Sprawdzenie czy obecny status to "planowane"
const konsultacjaRef = doc(db, 'konsultacje', selectedConsultationId);
const konsultacjaSnap = await getDoc(konsultacjaRef);
if (!konsultacjaSnap.exists()) {
  setInfoModalMessage("❌ Konsultacja nie istnieje.");
  return;
}
const konsultacjaData = konsultacjaSnap.data();
if (konsultacjaData.status !== 'planowane') {
  setInfoModalMessage("❌ Można odwołać tylko konsultację w statusie 'planowane'.");
  return;
}

console.log('▶ PRZED updateDoc', selectedConsultationId);
await updateDoc(doc(db, 'konsultacje', selectedConsultationId), {
  status: 'odwołane',
  substatusW: 'testW_' + Date.now(),
  substatusS: 'testS_' + Date.now(),
  updatedAt: serverTimestamp(),
  lastUpdatedBy: userEmail || '',
  hideForOwner: false,
  hideForSpecialist: false
});
console.log('✔ PO updateDoc');

const snapAfter = await getDoc(doc(db, 'konsultacje', selectedConsultationId));
console.log('📄 W bazie po zapisie:', snapAfter.data());



console.log("[OWNER] Anulowanie zapisane w bazie:", selectedConsultationId);


  setInfoModalMessage('✅ Konsultacja została anulowana.');
  setShowCancelModal(false);
}

              }}
              style={{
                backgroundColor: '#c00',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0.3rem'
              }}
            >
              Potwierdź anulowanie
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
  padding: '0.8rem 1.5rem',
  borderRadius: '0.5rem',
  textDecoration: 'none',
  fontWeight: 'bold',
};

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
  boxShadow: '0 0 10px rgba(0,0,0,0.2)'
};
