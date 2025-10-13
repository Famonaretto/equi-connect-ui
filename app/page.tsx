'use client';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { useState } from 'react';



export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');

  return (
    <>
    

      {/* SEKCJA HERO */}
      <section
        style={{
          backgroundImage: 'url("/images/elisa-photography-gjk_RegDTrM-unsplash.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'left',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          padding: '1rem 1rem 2rem',
        }}
      >
        {/* GRADIENT W PRAWO */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '60%',
            background: 'linear-gradient(to right, rgba(255,255,255,0.2), white 70%)',
            zIndex: 1,
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '1100px',
            margin: '0 auto',
            color: '#0D1F40',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}
        >
<h1
  style={{
    fontSize: '2.2rem',
    fontWeight: 'bold',
    marginRight: '-0.3rem', // 🔹 przesuwa w lewo (automatycznie)
    marginBottom: '2rem'
  }}
>
  Czy Twój koń potrzebuje wsparcia?
</h1>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
            }}
          >
<Link
  href="/ankieta"
  style={{
    backgroundColor: '#0D1F40',
    color: 'white',
    fontWeight: 'bold',
    padding: '1rem 2rem',
    borderRadius: '0.5rem',
    fontSize: '1.2rem',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
    marginLeft: '1rem',
    marginBottom: '0.8rem',
    textDecoration: 'none',
  }}
>
  Zrób test sprawdzający zachowania Twojego konia
</Link>


            
            {/* IKONY */}
            <div style={{ display: 'flex', gap: '3rem', justifyContent: 'center' }}>
              
              <div style={{ textAlign: 'center', color: '#0D1F40' }}>
                <img
                  src="/images/star.svg"
                  alt="Ocena"
                  width={36}
                  height={36}
                  style={{
                    filter: 'invert(11%) sepia(31%) saturate(1715%) hue-rotate(183deg) brightness(96%) contrast(102%)',
                  }}
                />
                <p style={{ marginTop: '0.5rem', fontWeight: '500' }}>
                  Oceń zachowanie<br />konia
                </p>
              </div>

              
              <div style={{ textAlign: 'center', color: '#0D1F40' }}>
                <img
                  src="/images/magnifying-glass.svg"
                  alt="Szukaj"
                  width={36}
                  height={36}
                  style={{ filter: 'invert(11%) sepia(31%) saturate(1715%) hue-rotate(183deg) brightness(96%) contrast(102%)' }}
                />
                <p style={{ marginTop: '0.5rem', fontWeight: '500' }}>
                  Znajdź <br />specjalistę
                </p>
              </div>

              <div style={{ textAlign: 'center', color: '#0D1F40' }}>
                <img
                  src="/images/check-fat.svg"
                  alt="Check"
                  width={36}
                  height={36}
                  style={{ filter: 'invert(11%) sepia(31%) saturate(1715%) hue-rotate(183deg) brightness(96%) contrast(102%)' }}
                />
                <p style={{ marginTop: '0.5rem', fontWeight: '500' }}>
                  Rozwiąż problemy<br />behawioralne
                </p>
              </div>

              <div style={{ textAlign: 'center', color: '#0D1F40' }}>
                <img
                  src="/images/heart.svg"
                  alt="Heart"
                  width={36}
                  height={36}
                  style={{ filter: 'invert(11%) sepia(31%) saturate(1715%) hue-rotate(183deg) brightness(96%) contrast(102%)' }}
                />
                <p style={{ marginTop: '0.5rem', fontWeight: '500' }}>
                  Buduj lepszą<br />relację
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
  style={{
    backgroundColor: 'white',
    textAlign: 'center',
    padding: '2.5rem 1rem 3.5rem',
    color: '#0D1F40',
  }}
>
  <h2
    style={{
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '2rem', 
      marginTop: '-1rem', 
    }}
  >
    Chcesz lepiej rozumieć zachowania swojego konia?
  </h2>

  <Link
    href="/wydarzenia"
    style={{
      backgroundColor: '#0D1F40',
      color: 'white',
      border: '2px solid #0D1F40',
      padding: '0.8rem 1.5rem',
      borderRadius: '0.5rem',
      fontWeight: 'bold',
      textDecoration: 'none',
      fontSize: '1.2rem',
      transition: 'all 0.3s ease',

    }}
  >
    Wybierz wydarzenie i zdobywaj wiedzę
  </Link>
</section>
      

<section
  style={{
    backgroundImage: 'url("/images/mathias-reding-5-u43jf_Q8c-unsplash.jpg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center 20%', // ważne: przycinamy od dołu
    backgroundRepeat: 'no-repeat',
    height: '250px', // <-- dopasuj, by widoczna była tylko górna część
    overflow: 'hidden', // ukrywa nadmiar zdjęcia
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 1rem',
  }}
>
  <div
    style={{
      background: 'linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.6))',
      borderRadius: '1rem',
      padding: '2rem',
      maxWidth: '1000px',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.5rem',
    }}
  >
    <h3
      style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#0D1F40',
        margin: 0,
        textAlign: 'center',
      }}
    >
      Potrzebujesz pomocy? Znajdź specjalistę
    </h3>

    <div
      style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <select
        style={{
          flex: '1 1 300px',
          padding: '1rem',
          borderRadius: '0.6rem',
          border: '1px solid #ccc',
          fontSize: '1rem',
        }}
      >
        <option>Lokalizacja</option>
      </select>

      <input
        type="text"
        placeholder="Specjalizacja"
        style={{
          flex: '1 1 300px',
          padding: '1rem',
          borderRadius: '0.6rem',
          border: '1px solid #ccc',
          fontSize: '1rem',
        }}
      />

<Link
  href={`/znajdz?lokalizacja=${encodeURIComponent(selectedLocation)}&specjalizacja=${encodeURIComponent(selectedSpec)}`}
  style={{
    backgroundColor: '#0D1F40',
    color: 'white',
    padding: '1rem 1.5rem',
    borderRadius: '0.5rem',
    fontWeight: 'bold',
    fontSize: '1rem',
    textDecoration: 'none',
  }}
>
  Szukaj
</Link>

    </div>
  </div>
</section>


{/* PROFILOWANI SPECJALIŚCI */}
<section
  style={{
    backgroundColor: '#f9f9f9',
    padding: '1rem 1rem 4rem',
    textAlign: 'center',
  }}
>
  <h2
    style={{
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#0D1F40',
      marginBottom: '2rem',
    }}
  >
    Nasi polecani specjaliści
  </h2>

  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '2rem',
      flexWrap: 'wrap',
    }}
  >
    {/* BEHAWIORYSTA */}
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        padding: '1.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        maxWidth: '300px',
      }}
    >
      <img
        src="/images/jake-nackos-IF9TK5Uy-KI-unsplash.jpg"
        alt="Behawiorysta"
        style={{
          width: '100%',
          height: '200px',
          objectFit: 'cover',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
        }}
      />
      <h3
        style={{
          color: '#0D1F40',
          fontSize: '1.2rem',
          marginBottom: '0.5rem',
        }}
      >
        Anna Kowalska
      </h3>
      <p style={{ marginBottom: '1rem', color: '#444' }}>
        Behawiorystka koni
      </p>
      <Link
        href="/specjalista/anna-kowalska"
        style={{
          backgroundColor: '#0D1F40',
          color: 'white',
          padding: '0.7rem 1.5rem',
          borderRadius: '0.5rem',
          fontWeight: 'bold',
          fontSize: '0.95rem',
          textDecoration: 'none',
          display: 'inline-block',
        }}
      >
        Zobacz profil
      </Link>
    </div>

    {/* SADDLE FITTER */}
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        padding: '1.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        maxWidth: '300px',
      }}
    >
      <img
        src="/images/cali-brutz-0YovAfvi2uU-unsplash.jpg"
        alt="Saddle fitter"
        style={{
          width: '100%',
          height: '200px',
          objectFit: 'cover',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
        }}
      />
      <h3
        style={{
          color: '#0D1F40',
          fontSize: '1.2rem',
          marginBottom: '0.5rem',
        }}
      >
        Marek Nowak
      </h3>
      <p style={{ marginBottom: '1rem', color: '#444' }}>
        Saddle fitter
      </p>
      <Link
        href="/specjalista/profil"
        style={{
          backgroundColor: '#0D1F40',
          color: 'white',
          padding: '0.7rem 1.5rem',
          borderRadius: '0.5rem',
          fontWeight: 'bold',
          fontSize: '0.95rem',
          textDecoration: 'none',
          display: 'inline-block',
        }}
      >
        Zobacz profil
      </Link>
    </div>

    {/* TRENER */}
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        padding: '1.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        maxWidth: '300px',
      }}
    >
      <img
        src="/images/daniel-schuh-8AqymJv-Sg4-unsplash.jpg"
        alt="Trener koni"
        style={{
          width: '100%',
          height: '200px',
          objectFit: 'cover',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
        }}
      />
      <h3
        style={{
          color: '#0D1F40',
          fontSize: '1.2rem',
          marginBottom: '0.5rem',
        }}
      >
        Katarzyna Lewandowska
      </h3>
      <p style={{ marginBottom: '1rem', color: '#444' }}>
        Trenerka naturalna
      </p>
      <Link
        href="/specjalista/katarzyna-lewandowska"
        style={{
          backgroundColor: '#0D1F40',
          color: 'white',
          padding: '0.7rem 1.5rem',
          borderRadius: '0.5rem',
          fontWeight: 'bold',
          fontSize: '0.95rem',
          textDecoration: 'none',
          display: 'inline-block',
        }}
      >
        Zobacz profil
      </Link>
    </div>
  </div>
</section>


{/* BLOK: DLA WŁAŚCICIELI I DLA SPECJALISTÓW – OBOK SIEBIE */}
<div
  style={{
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '2rem',
    padding: '2rem 1rem',
  }}
>
  {/* DLA WŁAŚCICIELI */}
  <section
    style={{
      backgroundColor: '#0D1F40',
      color: 'white',
      flex: '1 1 350px',
      padding: '2rem',
      borderRadius: '1rem',
      textAlign: 'center',
    }}
  >
    <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>
      Twój koń ma problemy behawioralne?
    </h2>
    <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
      Specjaliści z całej Polski są gotowi Wam pomóc.
    </p>
<Link
  href="/zgloszenia/zloz"
  style={{
    backgroundColor: 'white',
    color: '#0D1F40',
    padding: '1rem 2rem',
    borderRadius: '0.5rem',
    fontWeight: 'bold',
    fontSize: '1rem',
    textDecoration: 'none',
    display: 'inline-block',
  }}
>
  Opisz problem i złóż zgłoszenie
</Link>

  </section>

  {/* DLA SPECJALISTÓW */}
  <section
    style={{
      backgroundColor: '#fff',
      color: '#0D1F40',
      flex: '1 1 350px',
      padding: '2rem',
      borderRadius: '1rem',
      textAlign: 'center',
      boxShadow: '0 0 0 1px #ccc',
    }}
  >
    <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>
      Jesteś specjalistą?
    </h2>
    <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
      Dodaj swój profil i pomóż poprawiać dobrostan koni w Polsce.
    </p>
    <Link
  href="/zaloguj"
  style={{
    backgroundColor: '#0D1F40',
    color: 'white',
    padding: '1rem 2rem',
    borderRadius: '0.5rem',
    fontWeight: 'bold',
    fontSize: '1rem',
    textDecoration: 'none',
    display: 'inline-block',
  }}
>
  Załóż konto
</Link>

  </section>
</div>

<section
  style={{
    backgroundColor: '#fff',
    padding: '4rem 1rem',
    borderTop: '1px solid #eee',
    borderBottom: '1px solid #eee',
  }}
>
  <div
    style={{
      maxWidth: '1100px',
      margin: '0 auto',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '3rem',
    }}
  >
    {/* Obrazek quizu */}
    <div style={{ flex: '1 1 400px', textAlign: 'center' }}>
      <img
        src="/images/quiz.png"
        alt="Quiz – sygnały konia"
        style={{
          maxWidth: '50%',
          height: 'auto',
          borderRadius: '0.75rem',
        }}
      />
    </div>

    {/* Tekst i przycisk */}
    <div style={{ flex: '1 1 450px' }}>
      <h2
        style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#0D1F40',
          marginBottom: '1rem',
        }}
      >
        Jak dobrze znasz sygnały wysyłane przez konie?
      </h2>
      <p style={{ color: '#444', fontSize: '1.1rem', marginBottom: '2rem' }}>
        Rozwiąż quiz i przekonaj się, czy potrafisz rozpoznać emocje i potrzeby konia!
      </p>
      <Link
        href="/quiz"
        style={{
          backgroundColor: '#0D1F40',
          color: 'white',
          fontWeight: 'bold',
          padding: '1rem 2rem',
          borderRadius: '0.5rem',
          fontSize: '1.1rem',
          textDecoration: 'none',
          display: 'inline-block',
        }}
      >
        Rozwiąż quiz
      </Link>
    </div>
  </div>
</section>

    </>
  );
}
