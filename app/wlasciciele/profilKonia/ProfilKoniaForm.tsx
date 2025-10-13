'use client';

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function ProfilKoniaForm({
  horseId,
  onBack,
}: {
  horseId?: string;
  onBack?: () => void;
}) {
  const [formData, setFormData] = useState({
    imie: "",
    plec: "",
    rasa: "",
    dataUrodzenia: "",
    sposobUzytkowania: "",
    historiaUzytkowania: "",
    historiaUzytkowaniaSzczegoly: "",
    stanUzytkowania: "",
    stanUzytkowaniaSzczegoly: "",
    stanOpieki: "",
    stanOpiekiSzczegoly: "",
    historiaChorob: {} as Record<string, string>,
    cechyIndywidualne: "",
  });

  const [loading, setLoading] = useState(false);
  const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);

  const chorobyOptions = [
    "urazy układu ruchu",
    "urazy oczu",
    "blizny po urazach skóry",
    "alergie pokarmowe",
    "choroby układu oddechowego",
    "choroby układu pokarmowego",
    "inne zaburzenia",
  ];

  // 📥 Pobranie danych konia jeśli edytujemy
  useEffect(() => {
    if (!horseId) return;
    const fetchHorse = async () => {
      setLoading(true);
      const docRef = doc(db, "konie", horseId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setFormData((prev) => ({
          ...prev,
          ...data,
        }));
      }
      setLoading(false);
    };
    fetchHorse();
  }, [horseId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (option: string) => {
    setFormData((prev) => {
      const updated = { ...prev.historiaChorob };
      if (updated[option] !== undefined) {
        delete updated[option];
      } else {
        updated[option] = "";
      }
      return { ...prev, historiaChorob: updated };
    });
  };

  const handleDetailsChange = (option: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      historiaChorob: { ...prev.historiaChorob, [option]: value },
    }));
  };

  // 📝 Obsługa zapisu formularza
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    alert("❌ Musisz być zalogowany, aby dodać profil konia.");
    return;
  }

  try {
    if (horseId) {
      // tryb edycji → pokaż potwierdzenie
      setShowConfirmUpdate(true);
      return;
    }

    // tryb dodawania
    await addDoc(collection(db, "konie"), {
      ...formData,
      ownerUid: user.uid,
      createdAt: serverTimestamp(),
    });

    alert("✅ Profil konia został zapisany!");
    if (onBack) onBack(); // ⬅️ automatyczny powrót
  } catch (err) {
    console.error("Błąd zapisu:", err);
  }
};


  // ✅ Potwierdzona aktualizacja
  const confirmUpdate = async () => {
  if (!horseId) return;
  try {
    await updateDoc(doc(db, "konie", horseId), {
      ...formData,
      updatedAt: serverTimestamp(),
    });
    alert("✅ Dane konia zostały zaktualizowane!");
    if (onBack) onBack(); // ⬅️ automatyczny powrót
  } catch (err) {
    console.error("Błąd aktualizacji:", err);
  } finally {
    setShowConfirmUpdate(false);
  }
};


  if (loading) return <p>⏳ Ładowanie danych konia...</p>;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "1.5rem", color: "#0D1F40" }}>
        {horseId ? "✏️ Edytuj profil konia" : "📋 Utwórz profil konia"}
      </h2>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
      >
        {/* Imię */}
        <div>
          <label><strong>Imię konia:</strong></label>
          <input
            type="text"
            name="imie"
            value={formData.imie}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ccc" }}
          />
        </div>

        {/* Płeć */}
        <div>
          <label><strong>Płeć:</strong></label>
          <select name="plec" value={formData.plec} onChange={handleChange} required
            style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ccc" }}>
            <option value="">-- wybierz --</option>
            <option value="klacz">Klacz</option>
            <option value="ogier">Ogier</option>
            <option value="wałach">Wałach</option>
          </select>
        </div>

        {/* Rasa */}
        <div>
          <label><strong>Rasa:</strong></label>
          <select name="rasa" value={formData.rasa} onChange={handleChange}
            style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ccc" }}>
            <option value="">-- wybierz --</option>
            <option value="SP">SP (polski koń szlachetny półkrwi)</option>
            <option value="xx">Thoroughbred (pełnej krwi angielskiej)</option>
            <option value="arab">Koń arabski</option>
            <option value="haflinger">Haflinger</option>
            <option value="ślązak">Ślązak</option>
            <option value="inna">Inna</option>
          </select>
        </div>

        {/* Data urodzenia */}
        <div>
          <label><strong>Data urodzenia:</strong></label>
          <input
            type="date"
            name="dataUrodzenia"
            value={formData.dataUrodzenia}
            onChange={handleChange}
            style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ccc" }}
          />
        </div>

        {/* Aktualny sposób użytkowania */}
        <div>
          <label><strong>Aktualny sposób użytkowania:</strong></label>
          <select
            name="sposobUzytkowania"
            value={formData.sposobUzytkowania}
            onChange={handleChange}
            style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ccc" }}
          >
            <option value="">-- wybierz --</option>
            <option value="rekreacja">Rekreacja</option>
            <option value="sport">Sport</option>
            <option value="hodowla">Hodowla</option>
            <option value="terapia">Hipoterapia / terapia</option>
            <option value="inne">Inne</option>
          </select>
        </div>

        {/* Historia użytkowania */}
        <div>
          <label><strong>Historia użytkowania – główny kierunek:</strong></label>
          <select
            name="historiaUzytkowania"
            value={formData.historiaUzytkowania}
            onChange={handleChange}
            style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ccc" }}
          >
            <option value="">-- wybierz --</option>
            <option value="rekreacja ogólna">Rekreacja ogólna</option>
            <option value="sport – skoki">Sport – skoki</option>
            <option value="sport – ujeżdżenie">Sport – ujeżdżenie</option>
            <option value="sport – WKKW">Sport – WKKW</option>
            <option value="sport – western">Sport – western</option>
            <option value="hodowla">Hodowla</option>
            <option value="hipoterapia">Hipoterapia / terapia</option>
            <option value="koń młody – trening podstawowy">Koń młody – trening podstawowy</option>
            <option value="koń emerytowany">Koń emerytowany</option>
            <option value="inne">Inne</option>
          </select>
          {formData.historiaUzytkowania === "inne" && (
            <textarea
              placeholder="Opisz szczegóły..."
              name="historiaUzytkowaniaSzczegoly"
              value={formData.historiaUzytkowaniaSzczegoly}
              onChange={handleChange}
              style={{ marginTop: "0.8rem", width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ccc" }}
            />
          )}
        </div>

        {/* Stan zdrowia – intensywność użytkowania */}
        <div>
          <label><strong>Stan zdrowia – intensywność użytkowania:</strong></label>
          <select
            name="stanUzytkowania"
            value={formData.stanUzytkowania}
            onChange={handleChange}
            style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ccc" }}
          >
            <option value="">-- wybierz --</option>
            <option value="pełna sprawność">Pełna sprawność – użytkowanie bez ograniczeń</option>
            <option value="ograniczona sprawność">Ograniczona sprawność – użytkowanie lekkie</option>
            <option value="minimalna sprawność">Minimalna sprawność – sporadyczne lekkie aktywności</option>
            <option value="wyłączony z użytkowania">Wyłączony z użytkowania – brak możliwości pracy</option>
            <option value="inne">Inne</option>
          </select>
          {formData.stanUzytkowania === "inne" && (
            <textarea
              placeholder="Opisz szczegóły..."
              name="stanUzytkowaniaSzczegoly"
              value={formData.stanUzytkowaniaSzczegoly}
              onChange={handleChange}
              style={{ marginTop: "0.8rem", width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ccc" }}
            />
          )}
        </div>

        {/* Stan zdrowia – opieka specjalistyczna */}
        <div>
          <label><strong>Stan zdrowia – potrzeba opieki specjalistycznej:</strong></label>
          <select
            name="stanOpieki"
            value={formData.stanOpieki}
            onChange={handleChange}
            style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ccc" }}
          >
            <option value="">-- wybierz --</option>
            <option value="brak">Brak – koń nie wymaga opieki specjalistycznej</option>
            <option value="obserwacja">Wymaga obserwacji / rutynowych kontroli</option>
            <option value="okresowa opieka">Wymaga okresowej specjalistycznej opieki</option>
            <option value="stała opieka">Wymaga stałej specjalistycznej opieki</option>
            <option value="inne">Inne</option>
          </select>
          {formData.stanOpieki === "inne" && (
            <textarea
              placeholder="Opisz szczegóły..."
              name="stanOpiekiSzczegoly"
              value={formData.stanOpiekiSzczegoly}
              onChange={handleChange}
              style={{ marginTop: "0.8rem", width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ccc" }}
            />
          )}
        </div>

        {/* Historia chorób */}
        <fieldset style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "1rem" }}>
          <legend><strong>Historia chorób i kontuzji:</strong></legend>
          {chorobyOptions.map((option) => (
            <div key={option} style={{ marginBottom: "0.8rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={formData.historiaChorob[option] !== undefined}
                  onChange={() => handleCheckboxChange(option)}
                />
                {option}
              </label>
              {formData.historiaChorob[option] !== undefined && (
                <textarea
                  placeholder="Podaj szczegóły..."
                  value={formData.historiaChorob[option]}
                  onChange={(e) => handleDetailsChange(option, e.target.value)}
                  style={{ marginTop: "0.4rem", width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ccc", minHeight: "60px" }}
                />
              )}
            </div>
          ))}
        </fieldset>

        {/* Indywidualne cechy */}
        <div>
          <label><strong>Indywidualne cechy i charakter:</strong></label>
          <textarea
            name="cechyIndywidualne"
            value={formData.cechyIndywidualne}
            onChange={handleChange}
            style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ccc", minHeight: "80px" }}
          />
        </div>

        {/* Przyciski */}
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            type="submit"
            style={{
              padding: "0.8rem 1.2rem",
              background: "#0D1F40",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {horseId ? "💾 Zaktualizuj dane" : "💾 Zapisz profil konia"}
          </button>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                padding: "0.8rem 1.2rem",
                background: "#999",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              🔙 Wróć do listy koni
            </button>
          )}
        </div>
      </form>

      {/* Modal potwierdzenia przy edycji */}
      {showConfirmUpdate && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}>
          <div style={{ background: "white", padding: "2rem", borderRadius: "8px", maxWidth: "400px" }}>
            <h3>Czy na pewno chcesz zaktualizować dane konia?</h3>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button
                onClick={() => setShowConfirmUpdate(false)}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#999",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                }}
              >
                ❌ Anuluj
              </button>
              <button
                onClick={confirmUpdate}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#0D1F40",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                }}
              >
                ✅ Potwierdź
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
