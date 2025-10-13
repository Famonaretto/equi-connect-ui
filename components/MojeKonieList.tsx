'use client';

import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function MojeKonieList() {
  const [konie, setKonie] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchKonie = async () => {
      console.log("🚀 Start fetchKonie()");
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        console.warn("⚠️ Brak zalogowanego użytkownika!");
        return;
      }

      console.log("👤 Użytkownik:", user.uid);

      try {
        const q = query(
          collection(db, "konie"),
          where("ownerUid", "==", user.uid)
        );
        const snapshot = await getDocs(q);

        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("📄 Pobrano konie:", data);

        setKonie(data);
      } catch (err) {
        console.error("❌ Błąd podczas pobierania koni:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchKonie();
  }, []);

  if (loading) return <p>Ładowanie koni...</p>;

  return (
    <div>
      <h2>Moje konie</h2>
      <button
        type="button"
        style={{
          background: "#0D1F40",
          color: "white",
          padding: "0.8rem 1.2rem",
          borderRadius: "6px"
        }}
        onClick={() => {
          console.log("➕ Klik na UTWÓRZ PROFIL KONIA");
          router.push("/utworzProfilKonia");
        }}
      >
        ➕ Utwórz profil konia
      </button>

      {konie.length === 0 ? (
        <p style={{ marginTop: "1rem" }}>
          Nie masz jeszcze żadnych koni w systemie.
        </p>
      ) : (
        <ul style={{ marginTop: "1rem", listStyle: "none", padding: 0 }}>
          {konie.map((kon) => {
            console.log("🐴 Renderuję konia:", kon.id, kon.imie);
            return (
              <li
                key={kon.id}
                style={{
                  border: "1px solid #ccc",
                  padding: "1rem",
                  marginBottom: "1rem",
                  borderRadius: "8px"
                }}
              >
                <h3>{kon.imie}</h3>
                <p>
                  <strong>Rasa:</strong> {kon.rasa || "nie podano"}
                </p>
                <p>
                  <strong>Płeć:</strong> {kon.plec || "nie podano"}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    flexWrap: "wrap"
                  }}
                >
                  <button type="button" style={buttonStyle}>
                    👁 Zobacz profil
                  </button>
                  <button type="button" style={buttonStyle}>
                    📊 Oceny zachowania
                  </button>
                  <button type="button" style={buttonStyle}>
                    📅 Konsultacje
                  </button>
                  <button
                    type="button"
                    style={buttonStyle}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("✅ Kliknięto ZALECENIA dla konia:", kon.id);
                      router.push(`/zaleceniaPojedyncze/${kon.id}`);
                    }}
                  >
                    📝 Zalecenia
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  background: "#0D1F40",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer"
};
