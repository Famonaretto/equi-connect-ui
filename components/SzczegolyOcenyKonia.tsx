'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// 🔹 Mapowanie prefiksów na nazwy podkategorii
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
};

// 🔹 Mapowanie prefiksów na kategorie główne
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

// 🔹 Kolejność kategorii
const categoryOrder = [
  'Sytuacje codzienne',
  'Przed treningiem',
  'Podczas treningu',
  'Po treningu',
];

// 🔹 Kolory dla konkretnych zachowań
const behaviorColorMap: Record<string, 'red' | 'yellow' | 'green'> = {
  'Agresywny do ludzi i koni (straszy lub próbuje ugryźć)': 'red',
  'Agresywny tylko do koni (atakuje inne konie)': 'red',
  'Niecierpliwy (kopie przednią nogą, wierci się po boksie)': 'yellow',
  'Dopomina się delikatnie (rży i wypatruje osoby karmiącej)': 'green',
  'Spokojnie czeka na karmienie (nie denerwuje się)': 'green',
  'Łykanie (połykanie powietrza)': 'yellow',
  'Tkanie (bujanie się)': 'yellow',
  'Heblowanie (tarcie zębami o powierzchnie)': 'yellow',
  'Krążenie po boksie': 'yellow',
  'Lizanie/gryzienie ścian': 'yellow',
  'Autoagresja (gryzienie się po piersiach, bokach)': 'red',
  'Inne narowy': 'yellow',
  'Koń nie ma narowów': 'green',
  'Koń łatwo odłącza się od innych koni': 'green',
  'Zaniepokojony, ale reaguje na polecenia osoby prowadzącej': 'yellow',
  'Niebezpieczny, nie reaguje na polecenia prowadzącego': 'red',
  'Chętnie podąża za człowiekiem i reaguje na polecenia': 'green',
  'Wymaga korekt co jakiś czas': 'yellow',
  'Skupiony na otoczeniu, nie reaguje na polecenia prowadzącego': 'red',
  'Koń podchodzi, chce powąchać rękę': 'green',
  'Koń nie podchodzi i nie nawiązuje kontaktu': 'yellow',
  'Unikanie lub agresja - koń odwraca się zadem lub straszy ugryzieniem': 'red',
  'Zachowania agresywno - obronne (straszenie, gryzienie, kopanie)': 'red',
  'Unikanie (odsuwanie się przy próbie dotyku)': 'yellow',
  'Chęć kontaktu (pozostaje spokojny, ciekawy, pozwala na dotyk)': 'green',
  'Koń nie może być wiązany lub musi być wiązany na dwóch uwiązach': 'red',
  'Odsuwanie się od szczotki przy czyszczeniu grzbietu lub okolic popręgu (ugina plecy, unosi grzbiet)': 'red',
  'Nie pozwala dotknąć głowy lub uszu': 'yellow',
  'Nie podnosi wszystkich nóg': 'yellow',
  'Koń stoi spokojnie, przywiązany na pojedynczym uwiązie, podaje wszystkie kopyta': 'green',
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
  'Uszy cofnięte przez ≥5 sekund': 'yellow',
  'Zamknięte oczy przez 2-5 sekund': 'yellow',
  'Widoczna twardówka (białko oka)': 'yellow',
  'Pusty wzrok przez ≥5 sekund': 'yellow',
  'Otwieranie/zamykanie pyska ≥10 sekund': 'yellow',
  'Ruch języka, wysuwanie': 'yellow',
  'Przesunięcie wędzidła na jedną stronę, opieranie się na jednej wodzy': 'yellow',
  'Koń nie wykazuje nieprawidłowości w ustawieniu głowy i szyi': 'green',
  'Unoszenie/opuszczanie głowy niesynchroniczne z ruchem kłusa': 'yellow',
  'Przechylanie głowy': 'yellow',
  'Głowa powyżej pionu ≥10s': 'yellow',
  'Głowa za pionem ≥10s': 'yellow',
  'Rzucanie, skręcanie głową, kręcenie głową na boki': 'yellow',
  'Koń nie wykazuje żadnego z powyższych zachowań': 'green',
  'Ogon trzymany na bok': 'yellow',
  'Ogon wciśnięty między pośladkami': 'yellow',
  'Energiczne, nerwowe machanie ogonem': 'yellow',
  'Ogon bez napięcia, zwisający swobodnie': 'green',
  'Zbyt szybkie tempo (>40 kroków/15s)': 'yellow',
  'Zbyt wolne tempo (<35 kroków/15s)': 'yellow',
  'Trzyśladowy ruch': 'yellow',
  'Błędy galopu: zmiany nóg, galop krzyżowy': 'yellow',
  'Samoczynne zmiany chodu': 'yellow',
  'Potykanie się, ciągnięcie czubków kopyt': 'yellow',
  'Koń porusza się swobodnym, rytmicznym chodem': 'green',
  'Zmiana kierunku / płoszenie się / ponoszenie': 'red',
  'Opór przed ruchem, zatrzymywanie się / odmowa wykonania ruchu, np. skoków': 'red',
  'Stawanie dęba': 'red',
  'Brykanie': 'red',
  'Koń chętnie współpracuje i wykonuje polecenia': 'green',
  'Koń oddycha intensywnie pracując bokami': 'red',
  'Koń nie pracuje intensywnie bokami, ale wykonuje 1 oddech w ciągu ok. 1-2 sekund': 'yellow',
  'Koń wykonuje 1 oddech na min. 3-4 sekundy': 'green',
  'Nie jest spocony': 'green',
  'Jest spocony u podstawy szyi i pod siodłem': 'green',
  'Jest intensywnie spocony na szyi, pod siodłem, w okolicach słabizny, ale nie widać skapujących strużek potu ani piany': 'yellow',
  'Pot skapuje z konia i jest miejscami spieniony': 'red',
  'Zainteresowany otoczeniem': 'green',
  'Obojętny na otoczenie': 'yellow',
  'Zaniepokojony otoczeniem': 'red',
  'Koń chętnie podąża za człowiekiem, szuka kontaktu, chce powąchać dotknąć': 'green',
  'Koń obojętny wobec człowieka, nie szuka kontaktu': 'yellow',
  'Koń wykazujacy lęk lub agresję, reaguje nerwowo i przesadnie na gesty człowieka': 'red',
  'Koń jest zainteresowany jedzeniem, w drugiej kolejności napije się wody': 'green',
  'Koń spragniony, dopiero po napojeniu zainteresowany jedzeniem': 'yellow',
  'Koń niezainteresowany ani jedzeniem, ani wodą': 'red',
};

// 🔹 Funkcja wyznaczająca kolor podkategorii
function getSubcategoryColor(selectedLabels: string[]): 'gray' | 'green' | 'yellow' | 'red' {
  if (selectedLabels.length === 0) return 'gray';
  let hasRed = false;
  let hasYellow = false;
  let hasGreen = false;

  for (const label of selectedLabels) {
    const color = behaviorColorMap[label];
    if (color === 'red') hasRed = true;
    if (color === 'yellow') hasYellow = true;
    if (color === 'green') hasGreen = true;
  }
  if (hasRed) return 'red';
  if (hasYellow) return 'yellow';
  if (hasGreen) return 'green';
  return 'gray';
}

type SzczegolyOcenyKoniaProps = {
  horseId: string;
  ocenaId: string;
  onBack: () => void;
};

export default function SzczegolyOcenyKonia({ horseId, ocenaId, onBack }: SzczegolyOcenyKoniaProps) {
  const [ocena, setOcena] = useState<any | null>(null);


  
  useEffect(() => {
    const fetchOcena = async () => {
      const snap = await getDoc(doc(db, 'konie', horseId, 'oceny', ocenaId));
      if (snap.exists()) {
        setOcena(snap.data());
      }
    };
    fetchOcena();
  }, [horseId, ocenaId]);

    // 🔹 Obsługa przycisku "wstecz" w przeglądarce
   useEffect(() => {
    // Dodaj wpis do historii – żeby przy kliknięciu wstecz wracało do listy ocen
    window.history.pushState({ page: "ocena" }, "", window.location.href);

    const handlePopState = () => {
      onBack();
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 0);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [onBack]);

  if (!ocena) return <p>⏳ Ładowanie szczegółów oceny...</p>;


  
  // Grupowanie danych
  const groupedByCategory: Record<string, Record<string, { key: string; val: boolean | string }[]>> = {};

  Object.entries(ocena.formData)
    .filter(([key, val]) => key !== 'narowy_inne_text' && (val === true || (typeof val === 'string' && val.trim() !== '')))
    .forEach(([key, val]) => {
      const prefix = key.split('_')[0];
      const category = prefixToCategory[prefix] || 'Inne';
      if (!groupedByCategory[category]) groupedByCategory[category] = {};
      if (!groupedByCategory[category][prefix]) groupedByCategory[category][prefix] = [];
      groupedByCategory[category][prefix].push({ key, val: val as boolean | string });
    });

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <h2>📋 Szczegóły oceny konia</h2>

      {categoryOrder.map((category) =>
        groupedByCategory[category] ? (
          <fieldset key={category} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
            <legend style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#0D1F40' }}>{category}</legend>

            {Object.entries(groupedByCategory[category]).map(([prefix, items]) => (
              <div key={prefix} style={{ marginBottom: '1rem' }}>
                <strong>{prefixToLabel[prefix] || prefix}</strong>{' '}
                <span
                  style={{
                    fontSize: '0.9rem',
                    marginLeft: '0.5rem',
                    color:
                      getSubcategoryColor(items.map(({ key }) => ocena.labelsByKey?.[key] || key)) === 'red'
                        ? 'red'
                        : getSubcategoryColor(items.map(({ key }) => ocena.labelsByKey?.[key] || key)) === 'yellow'
                        ? 'orange'
                        : 'green',
                  }}
                >
                  {(() => {
                    const color = getSubcategoryColor(items.map(({ key }) => ocena.labelsByKey?.[key] || key));
                    const descriptions: Record<string, string> = {
                      green: 'Zachowanie pożądane',
                      yellow: 'Wymaga korekty',
                      red: 'Wymaga pilnej korekty',
                      gray: 'Brak wystarczających danych',
                    };
                    return `● ${descriptions[color]}`;
                  })()}
                </span>
                <ul style={{ marginTop: '0.3rem', marginBottom: '0.5rem' }}>
                  {items.map(({ key, val }) => {
                    const label = ocena.labelsByKey?.[key] || key;
                    return (
                      <li key={key}>
                        {label}
                        {typeof val === 'string' ? `: ${val}` : ''}
                      </li>
                    );
                  })}
                  {prefix === 'narowy' && ocena.formData['narowy_inne'] === true && ocena.formData['narowy_inne_text'] && (
                    <li>
                      <em>Inne narowy:</em> {(ocena.formData['narowy_inne_text'] as string).trim()}
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </fieldset>
        ) : null
      )}

<button
  onClick={() => {
    onBack();
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  }}
  style={{
    marginTop: '2rem',
    backgroundColor: '#0D1F40',
    color: 'white',
    padding: '0.7rem 1.5rem',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  }}
>
  ← Wróć do listy ocen
</button>

    </div>
  );
}
