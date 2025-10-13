'use client';

import { useState } from 'react';
import { useDialog } from '../components/DialogProvider';


type Wydarzenie = {
  title: string;
  date: string;
  location: string;
  mode: 'online' | 'stacjonarne';
  price: number;
  availableMaterial: 'na żywo' | 'z zapisem' | 'nagrane';
  instructor: string;
  topic: string;
  image: string;
  description: string;
};

const wydarzenia: Wydarzenie[] = [
  {
    title: 'Warsztat: Zrozum swojego konia',
    date: '2025-08-12',
    location: 'Warszawa',
    mode: 'stacjonarne',
    price: 250,
    availableMaterial: 'na żywo',
    instructor: 'dr Kowalski',
    topic: 'Zachowanie konia',
    image: '/images/horse-behavior.jpg',
    description: 'Zajęcia praktyczne z behawiorystą – poznaj mowę ciała konia...',
  },
  {
    title: 'Webinar: Dieta konia sportowego',
    date: '2025-08-22',
    location: 'Online',
    mode: 'online',
    price: 0,
    availableMaterial: 'z zapisem',
    instructor: 'Anna Nowak',
    topic: 'Żywienie',
    image: '/images/feeding.jpg',
    description: 'Dowiedz się, jak układać zbilansowaną dietę z dietetykiem koni.',
  },
  {
    title: 'Szkolenie: Dopasowanie siodła',
    date: '2025-09-01',
    location: 'Kraków',
    mode: 'stacjonarne',
    price: 300,
    availableMaterial: 'nagrane',
    instructor: 'Marek Lis',
    topic: 'Sprzęt',
    image: '/images/saddle.jpg',
    description: 'Jak prawidłowo dobrać siodło? Praktyczne wskazówki i pomiary.',
  },
];

export default function WydarzeniaPage() {
  const [filters, setFilters] = useState({
    location: '',
    mode: '',
    maxPrice: '',
    date: '',
    material: '',
    instructor: '',
    topic: '',
  });

  const { showDialog } = useDialog();


  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filtered = wydarzenia.filter(w =>
    (!filters.location || w.location.toLowerCase().includes(filters.location.toLowerCase())) &&
    (!filters.mode || w.mode === filters.mode) &&
    (!filters.maxPrice || w.price <= parseFloat(filters.maxPrice)) &&
    (!filters.date || w.date === filters.date) &&
    (!filters.material || w.availableMaterial === filters.material) &&
    (!filters.instructor || w.instructor.toLowerCase().includes(filters.instructor.toLowerCase())) &&
    (!filters.topic || w.topic.toLowerCase().includes(filters.topic.toLowerCase()))
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
      {/* FILTRY */}
      <section
        style={{
          backgroundColor: '#2b539eff',
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          backgroundRepeat: 'no-repeat',
          height: 'auto',
          padding: '2rem 1rem',
          borderRadius: '1rem',
          marginBottom: '3rem',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(to right, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
            borderRadius: '1rem',
            padding: '2rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'center',
          }}
        >
          <input type="text" name="location" value={filters.location} onChange={handleFilterChange} placeholder="Lokalizacja" style={inputStyle} />
          <select name="mode" value={filters.mode} onChange={handleFilterChange} style={inputStyle}>
            <option value="">Typ wydarzenia</option>
            <option value="online">Online</option>
            <option value="stacjonarne">Stacjonarne</option>
          </select>
          <input type="number" name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} placeholder="Cena maks." style={inputStyle} />
          <input type="date" name="date" value={filters.date} onChange={handleFilterChange} style={inputStyle} />
          <select name="material" value={filters.material} onChange={handleFilterChange} style={inputStyle}>
            <option value="">Materiały</option>
            <option value="na żywo">Na żywo</option>
            <option value="z zapisem">Z zapisem</option>
            <option value="nagrane">Nagrane</option>
          </select>
          <input type="text" name="instructor" value={filters.instructor} onChange={handleFilterChange} placeholder="Prowadzący" style={inputStyle} />
          <input type="text" name="topic" value={filters.topic} onChange={handleFilterChange} placeholder="Tematyka" style={inputStyle} />
        </div>
      </section>

      {/* WYDARZENIA */}
      <section>
        <h2 style={{ color: '#0D1F40', fontSize: '2rem', marginBottom: '1rem' }}>📅 Nadchodzące wydarzenia</h2>
        {filtered.length === 0 && <p>Brak wydarzeń spełniających podane kryteria.</p>}
{filtered.map((w, i) => (
  <div key={i} style={{ display: 'flex', marginBottom: '2rem', gap: '1rem', border: '1px solid #ccc', borderRadius: '0.8rem', padding: '1rem' }}>
    <img src={w.image} alt={w.title} style={{ width: '180px', height: '120px', objectFit: 'cover', borderRadius: '0.5rem' }} />
    <div style={{ flex: 1 }}>
      <h3 style={{ margin: '0 0 0.5rem', color: '#0D1F40' }}>{w.title}</h3>
      <p><strong>Data:</strong> {w.date}</p>
      <p><strong>Lokalizacja:</strong> {w.location}</p>
      <p><strong>Forma:</strong> {w.mode === 'online' ? 'Online' : 'Stacjonarne'}</p>
      <p><strong>Cena:</strong> {w.price === 0 ? 'Bezpłatne' : `${w.price} zł`}</p>
      <p><strong>Materiały:</strong> {w.availableMaterial}</p>
      <p><strong>Prowadzący:</strong> {w.instructor}</p>
      <p style={{ marginTop: '0.5rem' }}>{w.description}</p>

      {/* PRZYCISKI */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button
          onClick={async () => {  await showDialog(`Szczegóły: ${w.title}`);}}
          style={{
            backgroundColor: '#fff',
            border: '2px solid #0D1F40',
            color: '#0D1F40',
            padding: '0.6rem 1rem',
            borderRadius: '0.4rem',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Zobacz szczegóły
        </button>
        <button
          onClick={async () => {await showDialog(`Szczegóły: ${w.title}`);}}
          style={{
            backgroundColor: '#fff',
            border: '2px solid #0D1F40',
            color: '#0D1F40',
            padding: '0.6rem 1rem',
            borderRadius: '0.4rem',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Zgłoś zainteresowanie
        </button>

        <button
          onClick={async () => {
  await showDialog(`Zgłoszono się na wydarzenie: ${w.title}`);}}
          style={{
            backgroundColor: '#0D1F40',
            color: '#fff',
            padding: '0.6rem 1.2rem',
            borderRadius: '0.4rem',
            border: 'none',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Zgłoś udział
        </button>
        
      </div>
    </div>
  </div>
))}

      </section>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: '1 1 200px',
  padding: '0.8rem',
  borderRadius: '0.5rem',
  border: '1px solid #ccc',
  fontSize: '1rem',
};
