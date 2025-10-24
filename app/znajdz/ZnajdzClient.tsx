'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import specializations from '@/utils/specializations';
import locations from '@/utils/locations';
import { getSpecialistsFromFirestore, Specialist } from '@/app/listaSpec/specjalisciLista';
import { useSearchParams, useRouter } from 'next/navigation';
import minRatingOptions from '@/utils/minRatingOptions';
import maxPriceOptions from '@/utils/maxPriceOptions';


type FormState = {
  name: string;
  locations: string[]; 
  contactTypes: string[];
  specialization: string[];
  minRating: string;
  maxPrice: string;
};

export default function ZnajdzClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialForm: FormState = {
  name: searchParams.get('name') || '',
  locations: searchParams.getAll('location'), // tablica lokalizacji
  contactTypes: searchParams.getAll('contactTypes'),
  specialization: searchParams.getAll('specialization'),
  minRating: searchParams.get('minRating') || '',
  maxPrice: searchParams.get('maxPrice') || '',
};


  const [form, setForm] = useState<FormState>(initialForm);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [filteredNameSuggestions, setFilteredNameSuggestions] = useState<string[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [suggestionSelected, setSuggestionSelected] = useState(false);

  const [openSections, setOpenSections] = useState({
  location: false,
  specialization: false,
  contact: false,
  rating: false,
  price: false
});

const toggleSection = (section: keyof typeof openSections) => {
  setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
};


  const contactOptions = ['On-line', 'W stajni konia', 'W ośrodku specjalisty'];

  // Pobieranie specjalistów
  useEffect(() => {
    const fetchData = async () => {
      const data = await getSpecialistsFromFirestore();
      setSpecialists(data);
    };
    fetchData();
  }, []);

  // Sugestie nazwisk
  useEffect(() => {
  if (form.name.trim().length < 1) {
    setFilteredNameSuggestions([]);
    return;
  }

  // Jeśli wpisane jest dokładne dopasowanie do sugestii — chowamy listę
  const lowercaseInput = form.name.toLowerCase();
  const matches = Array.from(
    new Set(
      specialists
        .map((s) => s.name)
        .filter((name) => name.toLowerCase().includes(lowercaseInput))
    )
  );

  if (matches.length === 1 && matches[0].toLowerCase() === lowercaseInput) {
    setFilteredNameSuggestions([]);
    return;
  }

  setFilteredNameSuggestions(matches);
}, [form.name, specialists]);




  // Obsługa klawiatury w polu nazwiska
 const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (filteredNameSuggestions.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    setHighlightIndex((prev) => (prev + 1) % filteredNameSuggestions.length);
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    setHighlightIndex((prev) =>
      prev <= 0 ? filteredNameSuggestions.length - 1 : prev - 1
    );
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    if (highlightIndex >= 0) {
      setForm((prev) => ({
        ...prev,
        name: filteredNameSuggestions[highlightIndex],
      }));
    }
    // ZAWSZE chowamy listę po Enter
    setFilteredNameSuggestions([]);
    setHighlightIndex(-1);
  }
};


  // Zmiana pól formularza
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Checkboxy
const handleCheckboxChange = (value: string, group: keyof FormState) => {
  setForm((prev) => {
    const current = prev[group] as string[];

    if (group === 'locations') {
      if (value === 'Cała Polska') {
        if (current.includes('Cała Polska')) {
          // Odznaczenie -> czyścimy wszystko
          return { ...prev, locations: [] };
        } else {
          // Zaznaczenie -> zaznacz wszystkie lokalizacje
          return { ...prev, locations: locations };
        }
      } else {
        let updated: string[];
        if (current.includes(value)) {
          updated = current.filter((item) => item !== value);
        } else {
          updated = [...current, value];
        }

        // Jeśli jest "Cała Polska" i klikamy coś innego → usuń "Cała Polska"
        if (updated.includes('Cała Polska') && value !== 'Cała Polska') {
          updated = updated.filter((loc) => loc !== 'Cała Polska');
        }

        return { ...prev, locations: updated };
      }
    }

    // Inne checkboxy
    return {
      ...prev,
      [group]: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    };
  });
};




  // Wyczyść filtry
 const clearFilters = () => {
  setForm({
    name: '',
    locations: [],
    contactTypes: [],
    specialization: [],
    minRating: '',
    maxPrice: '',
  });
  setFilteredNameSuggestions([]);
  setHighlightIndex(-1);
  router.replace('/znajdz', { scroll: false });
};


  // Usuń pojedynczy filtr
 const removeFilter = (type: keyof FormState, value: string) => {
  if (type === 'name' || type === 'minRating' || type === 'maxPrice') {
    setForm((prev) => ({ ...prev, [type]: '' }));
  } else if (type === 'locations') {
    setForm((prev) => {
      let updated = (prev.locations as string[]).filter((loc) => loc !== value);

      // Jeśli usuwamy "Cała Polska" → usuń wszystkie lokalizacje
      if (value === 'Cała Polska') {
        updated = [];
      }

      // Jeśli była "Cała Polska" i usunięto jedną inną → usuń "Cała Polska"
      if (updated.includes('Cała Polska') && value !== 'Cała Polska') {
        updated = updated.filter((loc) => loc !== 'Cała Polska');
      }

      return { ...prev, locations: updated };
    });
  } else {
    setForm((prev) => ({
      ...prev,
      [type]: (prev[type] as string[]).filter((item) => item !== value),
    }));
  }
};



  // Lista aktywnych filtrów (do tagów)
const activeFilters: { type: keyof FormState; label: string; value: string }[] = [
  ...(form.name ? [{ type: 'name' as const, label: form.name, value: form.name }] : []),
...(form.locations.includes('Cała Polska')
  ? locations
      .filter((loc) => loc !== 'Cała Polska')
      .map((loc) => ({ type: 'locations' as const, label: loc, value: loc }))
  : form.locations.map((loc) => ({ type: 'locations' as const, label: loc, value: loc }))
),

  ...form.specialization.map((s) => ({ type: 'specialization' as const, label: s, value: s })),
  ...form.contactTypes.map((c) => ({ type: 'contactTypes' as const, label: c, value: c })),
  ...(form.minRating ? [{ type: 'minRating' as const, label: `Ocena ≥ ${form.minRating}`, value: form.minRating }] : []),
  ...(form.maxPrice ? [{ type: 'maxPrice' as const, label: `Cena ≤ ${form.maxPrice} zł`, value: form.maxPrice }] : []),
];



  // Filtrowanie wyników
  const filtered = specialists.filter((spec) => {
  return (
    (form.name === '' || spec.name.toLowerCase().includes(form.name.toLowerCase())) &&
    (form.locations.length === 0 || form.locations.includes(spec.location)) &&
    (form.specialization.length === 0 ||
      (Array.isArray(spec.specialization)
        ? spec.specialization.some((s) => form.specialization.includes(s))
        : form.specialization.includes(spec.specialization)
      )
    ) &&
    (form.contactTypes.length === 0 || form.contactTypes.some((c) => spec.contact.includes(c))) &&
    (form.minRating === '' || spec.rating >= parseInt(form.minRating)) &&
    (form.maxPrice === '' || spec.price <= parseInt(form.maxPrice))
  );
});


  return (
    <section style={{ display: 'flex', gap: '2rem', maxWidth: '1200px', margin: '4rem auto', padding: '2rem' }}>
      
      {/* Lewy panel filtrów */}
      <aside style={{ flex: '0 0 280px', borderRight: '1px solid #ccc', paddingRight: '1rem' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: '#0D1F40' }}>Filtry</h2>

        {/* Imię i nazwisko */}
        <div className="name-suggestions-container" style={{ position: 'relative', marginBottom: '1rem' }}>
          <input
  name="name"
  placeholder="Imię lub nazwisko"
  type="text"
  value={form.name}
  onChange={handleChange}
  onKeyDown={handleKeyDown}
  style={{ ...inputStyle, marginBottom: '1rem' }} // tak samo jak selecty
  autoComplete="off"
/>

          {form.name && filteredNameSuggestions.length > 0 && (
            <ul
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#fff',
                border: '1px solid #ccc',
                borderTop: 'none',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 10,
                listStyle: 'none',
                margin: 0,
                padding: 0,
              }}
            >
              {filteredNameSuggestions.map((name, index) => (
                <li
                  key={index}
                  onClick={() => {
                    setForm((prev) => ({ ...prev, name }));
                    setFilteredNameSuggestions([]);
                    setHighlightIndex(-1);
                    setSuggestionSelected(true); // oznaczamy, że wybrano sugestię
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    backgroundColor: index === highlightIndex ? '#f0f0f0' : '#fff',
                  }}
                >
                  {name}
                </li>


              ))}
            </ul>
          )}
        </div>

        {/* Lokalizacja */}
      <h4 style={{ cursor: 'pointer', marginTop: '-0.5rem', marginBottom: '0.5rem' }} 
      onClick={() => toggleSection('location')}>
  Obszar konsultacji stacjonarnych {openSections.location ? '▲' : '▼'}
</h4>
{openSections.location && locations.map((loc) => (
  <label key={loc} style={{ display: 'block', marginBottom: '0.3rem' }}>
    <input
      type="checkbox"
      value={loc}
      checked={form.locations.includes(loc)}
      onChange={() => handleCheckboxChange(loc, 'locations')}
    />{' '}
    {loc}
  </label>
))}


        {/* Specjalizacje */}
        <h4 style={{ cursor: 'pointer' }} onClick={() => toggleSection('specialization')}>
  Specjalizacja {openSections.specialization ? '▲' : '▼'}
</h4>
{openSections.specialization && specializations.map((spec) => (
  <label key={spec} style={{ display: 'block', marginBottom: '0.3rem' }}>
    <input
      type="checkbox"
      value={spec}
      checked={form.specialization.includes(spec)}
      onChange={() => handleCheckboxChange(spec, 'specialization')}
    />{' '}
    {spec}
  </label>
))}

        {/* Forma kontaktu */}
        <h4 style={{ marginTop: '1rem' }}>Forma kontaktu</h4>
        {contactOptions.map((option) => (
          <label key={option} style={{ display: 'block', marginBottom: '0.3rem' }}>
            <input
              type="checkbox"
              value={option}
              checked={form.contactTypes.includes(option)}
              onChange={() => handleCheckboxChange(option, 'contactTypes')}
            />{' '}
            {option}
          </label>
        ))}

        {/* Ocena */}
     <h4 style={{ marginTop: '1rem', marginBottom: '-0.5rem' }}>Ocena specjalisty od:</h4>

<select
  name="minRating"
  value={form.minRating}
  onChange={handleChange}
  style={{ ...inputStyle, marginTop: '1rem' }}
>
  {minRatingOptions.map((opt) => (
    <option key={opt.value} value={opt.value}>
      {opt.label}
    </option>
  ))}
</select>

{/* Cena */}
<h4 style={{  marginTop: '1rem', marginBottom: '-0.5rem' }}>Cena konsultacji od:</h4>

<select
  name="maxPrice"
  value={form.maxPrice}
  onChange={handleChange}
  style={{ ...inputStyle, marginTop: '1rem' }}
>
  {maxPriceOptions.map((opt) => (
    <option key={opt.value} value={opt.value}>
      {opt.label}
    </option>
  ))}
</select>

        {/* Wyczyść */}
        <button
          type="button"
          onClick={clearFilters}
          style={{
            backgroundColor: '#ccc',
            color: '#333',
            padding: '0.8rem 1.2rem',
            borderRadius: '0.5rem',
            fontWeight: 'bold',
            fontSize: '1rem',
            border: 'none',
            cursor: 'pointer',
            marginTop: '1rem',
            width: '100%',
          }}
        >
          Wyczyść filtry
        </button>
      </aside>

      {/* Prawa kolumna z wynikami */}
      
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#0D1F40' }}>Wyniki wyszukiwania:</h2>

        {/* Tagi aktywnych filtrów */}
        <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {activeFilters.map((filter, index) => (
            <span
              key={index}
              style={{
                background: '#eee',
                padding: '0.3rem 0.6rem',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                border: '1px solid #ccc',
              }}
            >
              {filter.label}
              <button
                onClick={() => removeFilter(filter.type, filter.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  color: '#333',
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>

        {/* Lista wyników */}
        {filtered.map((spec, index) => (
  <div
    key={index}
    style={{
      display: 'flex',
      gap: '1.5rem',
      padding: '1rem',
      border: '1px solid #ccc',
      borderRadius: '0.8rem',
      marginBottom: '1.5rem',
      alignItems: 'center',
    }}
  >
    <img
      src={spec.photo}
      alt={spec.name}
      style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover' }}
    />
    <div style={{ flex: 1 }}>
      <h2 style={{ fontSize: '1.3rem', color: '#0D1F40', marginBottom: '0.4rem' }}>{spec.name}</h2>
      <p><strong>Specjalizacja:</strong> {Array.isArray(spec.specialization) ? spec.specialization.join(', ') : spec.specialization}</p>
<p>
  <strong>Obszar konsultacji stacjonarnych:</strong>{' '}
  {Array.isArray(spec.location)
    ? (spec.location.includes('Cała Polska')
        ? locations.filter((loc) => loc !== 'Cała Polska')
        : spec.location
      ).join(', ')
    : spec.location}
</p>
      <p><strong>Formy kontaktu:</strong> {Array.isArray(spec.contact) ? spec.contact.join(', ') : spec.contact}</p>
     <p><strong>Cena konsultacji od:</strong> {spec.price ? `${spec.price} zł` : 'Nie podano'}</p>
  <p><strong>Ocena:</strong> {'⭐'.repeat(spec.rating)} ({spec.reviews} opinii)</p>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <Link
          href={`/konsultacja/umow?specjalista=${encodeURIComponent(spec.name)}`}
        >
          <button
            style={{
              backgroundColor: '#0D1F40',
              color: '#fff',
              padding: '0.75rem 1.5rem',
              border: '2px solid #0D1F40',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
             
            }}
          >
            Umów konsultację
          </button>
        </Link>

        <Link
  href={{
    pathname: `/specjalista/profil/${spec.id}`,
    query: {
      name: form.name || undefined,
      location: form.locations,
      contactTypes: form.contactTypes,
      specialization: form.specialization,
      minRating: form.minRating || undefined,
      maxPrice: form.maxPrice || undefined,
    },
  }}
>


          <button
            style={{
              backgroundColor: '#f0f0f0',
              color: '#0D1F40',
              padding: '0.75rem 1.5rem',
              border: '2px solid #0D1F40',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
          >
            Zobacz profil
          </button>
        </Link>
      </div>
    </div>
  </div>
))}


        {filtered.length === 0 && (
          <p style={{ marginTop: '2rem', fontStyle: 'italic', color: '#777' }}>
            Brak specjalistów spełniających wybrane kryteria.
          </p>
        )}
      </div>
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  borderRadius: '0.5rem',
  border: '1px solid #ccc',
  fontSize: '1rem',
  boxSizing: 'border-box'
};

