'use client';

import { useEffect, useState } from 'react';
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  DocumentData,
  updateDoc,
  doc,
  addDoc,
  getDocs,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { app } from '@/lib/firebase';

interface Konsultacja extends DocumentData {
  id: string;
  imieKonia?: string;
  status: string;
  specjalista?: string;
  specjalistaUid?: string;
  ownerUid?: string;
  ownerName?: string;
  proponowanyTermin?: string;
  temat?: string;
  opis?: string;
  discrepancy?: boolean;
  discrepancyReason?: string;
  ownerDate?: string;
  specialistDate?: string;
  ownerResponse?: string;
  specialistResponse?: string;
}

export default function UmowioneKonsultacje() {
  const [konsultacje, setKonsultacje] = useState<Konsultacja[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterExtra, setFilterExtra] = useState('');
  const [uniqueExtra, setUniqueExtra] = useState<string[]>([]);
  const [role, setRole] = useState<'wlasciciel' | 'specjalista' | null>(null);

  const router = useRouter();

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);
    const user = auth.currentUser;

    if (!user) return;

    // 📌 odczytaj rolę z localStorage (ustawianą przy logowaniu)
    const savedRole = localStorage.getItem('role') as 'wlasciciel' | 'specjalista' | null;
    setRole(savedRole);

    if (!savedRole) return;

    const q =
      savedRole === 'wlasciciel'
        ? query(
            collection(db, 'konsultacje'),
            where('ownerUid', '==', user.uid),
            where('status', 'in', ['planowane', 'odwołane', 'odbyta'])
          )
        : query(
            collection(db, 'konsultacje'),
            where('specjalistaUid', '==', user.uid),
            where('status', 'in', ['planowane', 'odwołane', 'odbyta'])
          );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Konsultacja[];

      setKonsultacje(list);

      // 🔹 dla właściciela unikalne imiona koni
      // 🔹 dla specjalisty unikalne nazwiska właścicieli
      if (savedRole === 'wlasciciel') {
        const horseNames = Array.from(
          new Set(list.map((k) => k.imieKonia).filter((name): name is string => !!name))
        );
        setUniqueExtra(horseNames);
      } else {
        const owners = Array.from(
          new Set(list.map((k) => k.ownerName).filter((name): name is string => !!name))
        );
        setUniqueExtra(owners);
      }
    });

    return () => unsub();
  }, []);

  const filtered = konsultacje.filter(
    (k) =>
      (!filterStatus || k.status === filterStatus) &&
      (!filterExtra ||
        (role === 'wlasciciel'
          ? k.imieKonia?.toLowerCase() === filterExtra.toLowerCase()
          : k.ownerName?.toLowerCase() === filterExtra.toLowerCase()))
  );

  const handleAction = async (k: Konsultacja, action: string) => {
    const db = getFirestore(app);
    const docRef = doc(db, 'konsultacje', k.id);

    if (action === 'confirm') {
      await updateDoc(docRef, {
        discrepancy: true,
        finalStatus: null,
      });
    }

    if (action === 'later') {
      await updateDoc(docRef, {
        noDecision: true,
      });
    }

    if (action === 'change') {
      alert('🔄 Zmień odpowiedź – tu dodamy modal wyboru');
    }
  };

  // 🔹 Rozpoczęcie czatu
  const startChat = async (k: Konsultacja) => {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) return;

    const db = getFirestore(app);

    const otherUserId = user.uid === k.ownerUid ? k.specjalistaUid : k.ownerUid;

    if (!otherUserId) {
      alert('Nie można rozpocząć czatu — brak ID drugiej osoby.');
      return;
    }

    // 🔍 sprawdź, czy czat już istnieje
    const q = query(
      collection(db, 'czaty'),
      where('participants', 'array-contains', user.uid)
    );
    const snapshot = await getDocs(q);

    let existingChat = snapshot.docs.find((doc) => {
      const data = doc.data();
      return (
        Array.isArray(data.participants) &&
        data.participants.includes(user.uid) &&
        data.participants.includes(otherUserId)
      );
    });

    if (existingChat) {
      router.push(`/czat/${existingChat.id}`);
      return;
    }

    // ➕ utwórz nowy czat
    const newChat = await addDoc(collection(db, 'czaty'), {
      participants: [user.uid, otherUserId],
      createdAt: new Date(),
      lastMessage: '',
    });

    router.push(`/czat/${newChat.id}`);
  };

  return (
    <div>
      <h2>Umówione konsultacje</h2>

      {/* 🔹 Filtry */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Wszystkie statusy</option>
          <option value="planowane">Planowane</option>
          <option value="odwołane">Odwołane</option>
          <option value="odbyta">Odbyte</option>
        </select>

        <select value={filterExtra} onChange={(e) => setFilterExtra(e.target.value)}>
          <option value="">
            {role === 'wlasciciel' ? 'Wszystkie konie' : 'Wszyscy właściciele'}
          </option>
          {uniqueExtra.map((name, idx) => (
            <option key={idx} value={name}>
              {name}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setFilterStatus('');
            setFilterExtra('');
          }}
        >
          Wyczyść filtry
        </button>
      </div>

      {filtered.length === 0 ? (
        <p>Brak konsultacji spełniających wybrane filtry.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filtered.map((k) => (
            <li
              key={k.id}
              style={{
                border: '1px solid #ccc',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1rem',
              }}
            >
              <p>
                <strong>Status:</strong> {k.status}
              </p>
              <p>
                <strong>Koń:</strong> {k.imieKonia || 'Brak imienia'}
              </p>
              <p>
                <strong>Specjalista:</strong> {k.specjalista || 'Nieznany'}
              </p>
              <p>
                <strong>Właściciel:</strong> {k.ownerName || 'Nieznany'}
              </p>
              <p>
                <strong>Temat:</strong> {k.temat || '—'}
              </p>
              <p>
                <strong>Opis:</strong> {k.opis || 'Brak opisu'}
              </p>
              <p>
                <strong>Proponowany termin:</strong> {k.proponowanyTermin || '—'}
              </p>

              {/* 🔹 Przyciski zaleceń */}
              {k.status === 'odbyta' && (
                <div style={{ marginTop: '1rem' }}>
                  {role === 'specjalista' ? (
                    <button
                      onClick={() => router.push(`/zalecenia/${k.id}`)}
                      style={{
                        background: '#27ae60',
                        color: 'white',
                        padding: '0.6rem 1.2rem',
                        border: 'none',
                        borderRadius: '0.4rem',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                    >
                      ➕ Dodaj zalecenia
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push(`/zaleceniaPojedyncze/${k.id}`)}
                      style={{
                        background: '#2980b9',
                        color: 'white',
                        padding: '0.6rem 1.2rem',
                        border: 'none',
                        borderRadius: '0.4rem',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                    >
                      👀 Zobacz zalecenia specjalisty
                    </button>
                  )}
                </div>
              )}

              {/* 🔹 Rozbieżności */}
              {k.discrepancy && (
                <div style={{ marginTop: '1rem', color: 'red' }}>
                  <p>
                    <strong>⚠️ Rozbieżność:</strong> {k.discrepancyReason}
                  </p>

                  {k.discrepancyReason === 'różne_terminy' && (
                    <div style={{ margin: '0.5rem 0', color: '#333' }}>
                      <p>👤 <strong>Właściciel:</strong> {k.ownerDate || '—'}</p>
                      <p>👨‍⚕️ <strong>Specjalista:</strong> {k.specialistDate || '—'}</p>
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginTop: '0.5rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      onClick={() => handleAction(k, 'confirm')}
                      style={{
                        background: '#0D1F40',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.3rem',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      ✅ Potwierdź moją wersję
                    </button>
                    <button
                      onClick={() => handleAction(k, 'change')}
                      style={{
                        background: '#f1c40f',
                        color: 'black',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.3rem',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      ✏️ Zmień odpowiedź
                    </button>
                    <button
                      onClick={() => handleAction(k, 'later')}
                      style={{
                        background: '#7f8c8d',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.3rem',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      ⏳ Odpowiem później
                    </button>
                    <button
                      onClick={() => startChat(k)}
                      style={{
                        background: '#2980b9',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.3rem',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      💬 Napisz do {role === 'wlasciciel' ? 'specjalisty' : 'właściciela'}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
