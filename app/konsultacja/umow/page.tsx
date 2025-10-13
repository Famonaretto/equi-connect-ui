'use client';

import { useState, useEffect } from 'react';
import { useDialog } from '../../components/DialogProvider';
import { getFirestore, collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { fetchEmailForSpecialist } from '../../lib/fetchEmailForSpecialist';
import { useSearchParams } from 'next/navigation';
import { getSpecialistsFromFirestore, Specialist } from '@/app/listaSpec/specjalisciLista';
import { doc, getDoc } from 'firebase/firestore';
import { contactOptions } from '@/utils/contactOptions';


export default function UmowKonsultacjePage() {
  const searchParams = useSearchParams();
  const { showDialog } = useDialog();

  const [availableSpecialists, setAvailableSpecialists] = useState<Specialist[]>([]);

const [formData, setFormData] = useState({
  specjalista: '',
  dataZgloszenia: new Date().toISOString().split('T')[0],
  termin: '',
  forma: [] as string[], // teraz tablica
  opis: '',
  ownerName: '',
  temat: '',
  lokalizacja: '',
  imieKonia: '',
  customImieKonia: '',

});

const handleFormaChange = (option: string) => {
  setFormData(prev => {
    const isSelected = prev.forma.includes(option);
    return {
      ...prev,
      forma: isSelected
        ? prev.forma.filter(f => f !== option)
        : [...prev.forma, option]
    };
  });
};
const [konie, setKonie] = useState<{ id: string; imie: string }[]>([]);

useEffect(() => {
  const fetchKonie = async () => {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) return;

    const db = getFirestore(app);
    const snapshot = await getDoc(doc(db, "users", user.uid));
    const userData = snapshot.data();

    const konieQuery = collection(db, 'konie');
    const q = query(konieQuery, where("ownerUid", "==", user.uid));
    const res = await getDocs(q);

    const listaKoni = res.docs.map(doc => ({
      id: doc.id,
      imie: doc.data().imie || "Bez nazwy",
    }));

    setKonie(listaKoni);
  };

  fetchKonie();
}, []);


useEffect(() => {
  const fetchOwnerName = async () => {
    const auth = getAuth(app);
    const user = auth.currentUser;

    if (user) {
      const db = getFirestore(app);
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
  const data = userDoc.data();
  const fullName = `${data.roles?.specjalista?.firstName || ''} ${data.roles?.specjalista?.lastName || ''}`.trim();
  setFormData(prev => ({
    ...prev,
    ownerName: fullName || prev.ownerName
  }));
} else {
  setFormData(prev => ({ ...prev, ownerName: user.displayName || '' }));
}
 }
  };

  fetchOwnerName();
}, []);

  useEffect(() => {
    const fetchData = async () => {
      const specialists = await getSpecialistsFromFirestore();
      setAvailableSpecialists(specialists);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const nazwiskoZURL = searchParams.get('specjalista');
    if (nazwiskoZURL) {
      setFormData((prev) => ({ ...prev, specjalista: nazwiskoZURL }));
    }
  }, [searchParams]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const db = getFirestore(app);
  const auth = getAuth(app);
  const user = auth.currentUser;

  if (!user) {
    await showDialog('Musisz być zalogowany, aby wysłać prośbę.');
    return;
  }

  try {
    // 🆕 pobierz maila specjalisty
    const specialistEmail = await fetchEmailForSpecialist(formData.specjalista);

    // 🔍 znajdź specjalistę po mailu w kolekcji "users"
    let specjalistaUid: string | null = null;
    if (specialistEmail) {
      const q = query(collection(db, 'users'), where('email', '==', specialistEmail));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        specjalistaUid = snapshot.docs[0].id; // 👈 UID specjalisty = id dokumentu
      }
    }

    if (formData.imieKonia === '__custom__' && !formData.customImieKonia.trim()) {
      await showDialog('Wpisz imię konia lub wybierz go z listy.');
      return;
    }

    // 🔎 pobierz imię właściciela z bazy
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    let ownerName = '';
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.roles?.wlasciciel) {
        ownerName = `${data.roles.wlasciciel.firstName || ''} ${data.roles.wlasciciel.lastName || ''}`.trim();
      } else if (data.roles?.specjalista) {
        ownerName = `${data.roles.specjalista.firstName || ''} ${data.roles.specjalista.lastName || ''}`.trim();
      }
    }

    // 🐴 ustal imię konia
    const finalImieKonia =
      formData.imieKonia === '__custom__'
        ? formData.customImieKonia.trim()
        : formData.imieKonia;

    // 🆕 dodaj konia do bazy, jeśli to nowy koń wpisany ręcznie
    if (formData.imieKonia === '__custom__' && finalImieKonia) {
      await addDoc(collection(db, 'konie'), {
        imie: finalImieKonia,
        ownerUid: user.uid,
        createdAt: Timestamp.now(),
      });
    }

    // znajdź wybranego konia z listy, jeśli nie jest "__custom__"
let konId: string | null = null;
if (formData.imieKonia !== "__custom__") {
  const wybrany = konie.find((k) => k.imie === formData.imieKonia);
  if (wybrany) {
    konId = wybrany.id; // 👈 tutaj masz prawidłowe konId
  }
}


    // 📝 zapisz konsultację w bazie
    await addDoc(collection(db, 'konsultacje'), {
      specjalista: formData.specjalista,
      specjalistaUid, // 👈 teraz zapisujesz UID specjalisty
      dataZgloszenia: Timestamp.now(),
      termin: formData.termin,
      forma: formData.forma,
      lokalizacja: formData.lokalizacja || '',
      opis: formData.opis,
      status: 'oczekujące',
      createdAt: Timestamp.now(),
      ownerEmail: user.email,
      ownerUid: user.uid,
      ownerName: ownerName || formData.ownerName || user.displayName || '',
      specialistEmail,
      oznaczonaJakoPrzeczytana: false,
      temat: formData.temat,
      imieKonia: finalImieKonia,
      konId, 
        ownerResponse: null,
  specialistResponse: null,
  ownerDate: null,
  specialistDate: null,
  finalStatus: null,
  discrepancy: false,
  discrepancyReason: null,
    });

    // 📧 wyślij powiadomienie do specjalisty
    if (specialistEmail) {
      await fetch('/api/sendCustomEmailLink', {
        method: 'POST',
        body: JSON.stringify({
          to: specialistEmail,
          subject: `Nowa prośba o konsultację od ${ownerName || user.email}`,
          text: `Masz nową prośbę o konsultację. Zaloguj się, aby zobaczyć szczegóły.`,
        }),
      });
    }

    await showDialog('Konsultacja została zgłoszona!');
  } catch (error) {
    console.error(error);
    await showDialog('Wystąpił błąd podczas wysyłania prośby.');
  }
};


  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ color: '#0D1F40', fontSize: '2rem', marginBottom: '1.5rem' }}>
        Umów konsultację ze specjalistą
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <label>
  Specjalista:
  <select
    name="specjalista"
    value={formData.specjalista}
    onChange={handleChange}
    required
    style={inputStyle}
  >
    <option value="">Wybierz specjalistę</option>
    {availableSpecialists.map((s) => (
      <option key={s.name} value={s.name}>
        {s.name}
      </option>
    ))}
  </select>
</label>
<label>
  Wybierz konia:
  <select
    name="imieKonia"
    value={formData.imieKonia}
    onChange={handleChange}
    required
    style={inputStyle}
  >
    <option value="">-- wybierz konia --</option>
    {konie.map(kon => (
      <option key={kon.id} value={kon.imie}>{kon.imie}</option>
    ))}
    <option value="__custom__">Inny koń (wpisz ręcznie)</option>
  </select>
</label>
{formData.imieKonia === '__custom__' && (
  <label>
    Imię nowego konia:
    <input
      type="text"
      name="customImieKonia"
      value={formData.customImieKonia}
      onChange={handleChange}
      placeholder="Wpisz imię konia"
      required
      style={inputStyle}
    />
  </label>
)}


<label>
  Data zgłoszenia:
  <input
    type="date"
    name="dataZgloszenia"
    value={formData.dataZgloszenia}
    readOnly
    style={inputStyle}
  />
</label>

<label>
  Proponowany termin konsultacji:
  <select
    name="termin"
    value={formData.termin}
    onChange={handleChange}
    required
    style={inputStyle}
  >
    <option value="">Wybierz termin</option>
    <option value="pilne">Pilne (jak najszybciej)</option>
    <option value="tydzien">W ciągu tygodnia</option>
    <option value="14dni">W ciągu 14 dni</option>
    <option value="miesiac">W ciągu miesiąca</option>
    <option value="dluzszy">Mogę poczekać dłużej</option>
  </select>
</label>

<label>
  Forma konsultacji:
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.3rem' }}>
    {contactOptions.map((option, idx) => (
      <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="checkbox"
          checked={formData.forma.includes(option)}
          onChange={() => handleFormaChange(option)}
        />
        {option}
      </label>
    ))}
    {formData.forma.includes('w stajni konia') && (
  <label>
    Lokalizacja stajni:
    <input
      type="text"
      name="lokalizacja"
      value={formData.lokalizacja}
      onChange={handleChange}
      placeholder="Podaj dokładną lokalizację..."
      style={inputStyle}
      required
    />
  </label>
)}

  </div>
</label>


<label>
  Temat wiadomości:
  <input
    type="text"
    name="temat"
    value={formData.temat}
    onChange={handleChange}
    required
    style={inputStyle}
    placeholder="Podaj temat wiadomości..."
  />
</label>

<label>
  Opis problemu (opcjonalnie):
  <textarea
    name="opis"
    value={formData.opis}
    onChange={handleChange}
    rows={5}
    placeholder="Opisz problem jak najdokładniej – podaj objawy, kiedy się pojawiły, w jakich sytuacjach oraz inne istotne informacje dla specjalisty."
    style={{
      ...inputStyle,
      resize: 'vertical'
    }}
  />
</label>

<button type="submit" style={{ ...submitBtnStyle, width: '100%' }}>
  Wyślij prośbę o konsultację
</button>

      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: '0.75rem',
  borderRadius: '0.5rem',
  border: '1px solid #ccc',
  marginTop: '0.3rem',
  fontSize: '1rem',
  fontFamily: 'inherit'
};


const submitBtnStyle: React.CSSProperties = {
  marginTop: '1rem',
  backgroundColor: '#0D1F40',
  color: 'white',
  padding: '1rem 2rem',
  fontWeight: 'bold',
  borderRadius: '0.5rem',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1rem',
};
