'use client';

import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useDialog } from '@/app/components/DialogProvider';

// TYLKO ŻÓŁTE I CZERWONE ZACHOWANIA
const behaviorProblems = {
  'Sytuacje codzienne': {
    red: [
      'Agresja przy karmieniu (atakuje lub straszy osobę karmiącą)',
      'Agresja do ludzi i koni',
      'Autoagresja (gryzienie się po piersiach, bokach)',
    ],
    yellow: [
      'Narowy (łykanie, tkanie, heblowanie, krążenie)',
      'Niebezpieczne przy odłączaniu od innych koni',
      'Problemy z prowadzeniem na uwiązie (nie reaguje)',
    ]
  },
  'Przed treningiem': {
    red: [
      'Zachowania agresywno-obronne (test FHA)',
      'Nie może być wiązany lub musi być na dwóch uwiązach',
      'Odsuwanie się od szczotki przy czyszczeniu grzbietu',
    ],
    yellow: [
      'Unikanie kontaktu (test VAA - nie podchodzi)',
      'Nie pozwala dotknąć głowy lub uszu',
      'Nie podnosi wszystkich nóg',
      'Problemy podczas ubierania (wiercenie, machanie ogonem)',
    ]
  },
  'Podczas treningu': {
    red: [
      'Próby ugryzienia jeźdźca',
      'Zmiana kierunku / płoszenie się / ponoszenie',
      'Opór przed ruchem, zatrzymywanie się',
      'Stawanie dęba',
      'Brykanie',
    ],
    yellow: [
      'Nieprawidłowe zachowania pyska (uszy, oczy, język)',
      'Nieprawidłowe ustawienie głowy i szyi',
      'Ogon trzymany na bok lub wciśnięty',
      'Energiczne machanie ogonem',
      'Zaburzenia chodu (tempo, rytm, potykanie)',
    ]
  },
  'Po treningu': {
    red: [
      'Koń oddycha intensywnie pracując bokami',
      'Pot skapuje z konia i jest miejscami spieniony',
      'Koń wykazuje lęk lub agresję wobec człowieka',
      'Koń niezainteresowany ani jedzeniem, ani wodą',
    ],
    yellow: [
      'Przyspieszony oddech (1 oddech na 1-2 sekundy)',
      'Intensywne pocenie na szyi i pod siodłem',
      'Obojętny na otoczenie',
      'Koń obojętny wobec człowieka',
      'Koń spragniony, dopiero po napojeniu zainteresowany jedzeniem',
    ]
  },
  'Sytuacje dodatkowe': {
    red: [
      'Koń stawia wyraźny opór przed wejściem do przyczepy',
      'Koń kopie przy próbie podniesienia kopyt przez kowala',
      'Koń emocjonalnie źle znosi udział w zawodach',
    ],
    yellow: [
      'Trudności z wejściem do przyczepy (do 15 min)',
      'Koń z czasem zaczyna się kręcić przy kowalu',
      'Gorsza dyspozycja fizyczna na zawodach',
    ]
  },
};

interface SpecjalistaAnkietaProps {
  onClose: () => void;
  onSaved?: () => void;
}

export default function SpecjalistaAnkieta({ onClose, onSaved }: SpecjalistaAnkietaProps) {
  const [selectedProblems, setSelectedProblems] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { showDialog } = useDialog();

  // Pobierz zapisane odpowiedzi przy otwarciu
  useEffect(() => {
    const loadSavedAnswers = async () => {
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (!user) {
        setIsLoading(false);
        return;
      }

      const db = getFirestore(app);
      const docRef = doc(db, 'specjalistaAnkiety', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.selectedProblems) {
          const saved: Record<string, boolean> = {};
          data.selectedProblems.forEach((problem: string) => {
            saved[problem] = true;
          });
          setSelectedProblems(saved);
        }
      }
      setIsLoading(false);
    };

    loadSavedAnswers();
  }, []);

  const handleProblemToggle = (problem: string) => {
    setSelectedProblems(prev => ({
      ...prev,
      [problem]: !prev[problem]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const auth = getAuth(app);
      const user = auth.currentUser;
      
      if (!user) {
        await showDialog('❌ Musisz być zalogowany, aby zapisać ankietę.');
        return;
      }

      const selectedList = Object.entries(selectedProblems)
        .filter(([_, selected]) => selected)
        .map(([problem]) => problem);

      const db = getFirestore(app);
      
      await setDoc(doc(db, 'specjalistaAnkiety', user.uid), {
        uid: user.uid,
        selectedProblems: selectedList,
        updatedAt: serverTimestamp(),
      });

      await showDialog('✅ Ankieta została zapisana. Właściciele koni będą mogli Cię znaleźć na podstawie Twoich specjalizacji.');
      
      if (onSaved) onSaved();
      onClose();
    } catch (error) {
      console.error('Błąd zapisu ankiety:', error);
      await showDialog('❌ Nie udało się zapisać ankiety. Spróbuj ponownie.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalSelected = Object.values(selectedProblems).filter(v => v === true).length;

  if (isLoading) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <p>Ładowanie ankiety...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, maxWidth: '900px', width: '100%' }}>
        {/* Nagłówek */}
        <div style={styles.header}>
          <h2 style={{ margin: 0, color: '#0D1F40' }}>
            📋 Zakres mojej pomocy – problemy behawioralne koni
          </h2>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>

        {/* Treść */}
        <div style={styles.content}>
          <p style={styles.infoText}>
            ✅ Zaznacz problemy behawioralne koni, które <strong>potrafisz rozwiązać</strong> lub w których <strong>masz doświadczenie</strong>.
            <br /><br />
            <span style={{ color: '#c62828' }}>🔴 Zachowania czerwone</span> – wymagają pilnej interwencji<br />
            <span style={{ color: '#f57c00' }}>🟡 Zachowania żółte</span> – wymagają korekty
          </p>

          {Object.entries(behaviorProblems).map(([category, problems]) => {
            const allProblems = [...problems.red, ...problems.yellow];
            const selectedCount = allProblems.filter(p => selectedProblems[p]).length;
            
            return (
              <fieldset key={category} style={styles.fieldset}>
                <legend style={styles.legend}>
                  {category}
                  <span style={styles.counter}>({selectedCount}/{allProblems.length})</span>
                </legend>

                {/* Czerwone zachowania */}
                {problems.red.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ color: '#c62828', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      🔴 Wymagające pilnej interwencji
                    </h4>
                    <div style={styles.grid}>
                      {problems.red.map(problem => (
                        <label key={problem} style={getCheckboxStyle(selectedProblems[problem], '#c62828')}>
                          <input
                            type="checkbox"
                            checked={!!selectedProblems[problem]}
                            onChange={() => handleProblemToggle(problem)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <span style={{ color: '#c62828', fontSize: '0.9rem' }}>{problem}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Żółte zachowania */}
                {problems.yellow.length > 0 && (
                  <div>
                    <h4 style={{ color: '#f57c00', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      🟡 Wymagające korekty
                    </h4>
                    <div style={styles.grid}>
                      {problems.yellow.map(problem => (
                        <label key={problem} style={getCheckboxStyle(selectedProblems[problem], '#f57c00')}>
                          <input
                            type="checkbox"
                            checked={!!selectedProblems[problem]}
                            onChange={() => handleProblemToggle(problem)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <span style={{ color: '#f57c00', fontSize: '0.9rem' }}>{problem}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </fieldset>
            );
          })}
        </div>

        {/* Stopka */}
        <div style={styles.footer}>
          <div>
            <strong>Zaznaczono: {totalSelected}</strong> problemów
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={onClose} style={styles.buttonSecondary}>
              Anuluj
            </button>
            <button onClick={handleSave} disabled={isSaving} style={{ ...styles.buttonPrimary, opacity: isSaving ? 0.6 : 1 }}>
              {isSaving ? 'Zapisywanie...' : '💾 Zapisz ankietę'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Style
const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '1rem',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  },
  header: {
    padding: '1rem 1.5rem',
    borderBottom: '2px solid #0D1F40',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#666',
    padding: '0 8px',
  },
  content: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '1rem 1.5rem',
  },
  infoText: {
    background: '#f0f4ff',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    fontSize: '0.95rem',
  },
  fieldset: {
    border: '1px solid #ccc',
    borderRadius: '12px',
    padding: '1rem',
    marginBottom: '1.5rem',
  },
  legend: {
    fontWeight: 'bold',
    fontSize: '1.1rem',
    color: '#0D1F40',
    padding: '0 0.5rem',
  },
  counter: {
    marginLeft: '0.75rem',
    fontSize: '0.8rem',
    fontWeight: 'normal' as const,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '0.5rem',
  },
  footer: {
    padding: '1rem 1.5rem',
    borderTop: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonPrimary: {
    padding: '0.6rem 1.5rem',
    backgroundColor: '#0D1F40',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  buttonSecondary: {
    padding: '0.6rem 1.5rem',
    backgroundColor: '#ccc',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
};

const getCheckboxStyle = (isSelected: boolean, color: string): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem',
  borderRadius: '6px',
  cursor: 'pointer',
  backgroundColor: isSelected ? `${color}20` : 'transparent',
  border: isSelected ? `1px solid ${color}` : '1px solid transparent',
});