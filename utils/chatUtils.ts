import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  updateDoc,
  doc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export async function handleOpenChat(
  router: AppRouterInstance,
  otherUserEmail: string | null,   // 👈 może być null, więc dopisałem typ
  myRole: "wlasciciel" | "specialista",
  temat: string,                  // temat konsultacji
  dataZgloszenia: string,         // data zgłoszenia (ISO string)
  onChatOpened?: (chatId: string) => void
) {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const user = auth.currentUser;

  if (!user?.email || !user.uid) return;
  if (!otherUserEmail) {
    console.error("❌ Brak adresu email drugiego użytkownika!");
    return;
  }


  const otherRole: "wlasciciel" | "specialista" =
    myRole === "wlasciciel" ? "specialista" : "wlasciciel";

  // ✅ Pobierz profil aktualnego usera
  const myProfileSnap = await getDoc(doc(db, "users", user.uid));
  const myData = myProfileSnap.exists() ? myProfileSnap.data() : null;

  // ✅ Pobierz profil drugiego usera po emailu
  let otherData: any = null;
  let otherUid: string | null = null;

  const qOther = query(
    collection(db, "users"),
    where("email", "==", otherUserEmail)
  );
  const otherSnap = await getDocs(qOther);
  if (!otherSnap.empty) {
    otherData = otherSnap.docs[0].data();
    otherUid = otherData.uid || null;
  }

  // ✅ Sprawdź czy istnieje czat dla tej pary + temat + data zgłoszenia
  const q = query(
    collection(db, "czaty"),
    where("participantEmails", "array-contains", user.email),
    where("temat", "==", temat),
    where("dataZgloszenia", "==", dataZgloszenia)
  );

  const snapshot = await getDocs(q);

  let chatId: string | null = null;
  let existingDocId: string | null = null;
  let existingParticipants: any[] = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const emails = data.participantEmails || [];
    if (emails.includes(user.email) && emails.includes(otherUserEmail)) {
      chatId = docSnap.id;
      existingDocId = docSnap.id;
      existingParticipants = data.participants || [];
    }
  });

  if (chatId && existingDocId) {
    // czat istnieje → ewentualnie dopisz siebie
    const isInParticipants = existingParticipants.some(
      (p) => p.uid === user.uid && p.role === myRole
    );

    if (!isInParticipants) {
      await updateDoc(doc(db, "czaty", existingDocId), {
        participants: arrayUnion({
          uid: user.uid,
          email: user.email,
          role: myRole,
          firstName: myData?.firstName || null,
          lastName: myData?.lastName || null,
        }),
        participantEmails: arrayUnion(user.email),
        updatedAt: serverTimestamp(),
      });
    }
  } else {
    // 🆕 nowy czat dla pary + temat + dataZgloszenia
    const docRef = await addDoc(collection(db, "czaty"), {
      participantEmails: [user.email, otherUserEmail],
      participants: [
        {
          uid: user.uid,
          email: user.email,
          role: myRole,
          firstName: myData?.roles?.[myRole]?.firstName || null,

          lastName: otherData?.roles?.[otherRole]?.lastName || null,



        },
        {
          uid: otherUid ?? "", // 👈 zabezpieczenie przed null
          email: otherUserEmail,
          role: otherRole,
          firstName: myData?.roles?.[myRole]?.firstName || null,

          lastName: otherData?.roles?.[otherRole]?.lastName || null,



        },
      ],
      temat: temat || "Bez tematu",                 // 👈 domyślnie Bez tematu
      dataZgloszenia: dataZgloszenia || "",         // 👈 domyślnie pusty string
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: null,
    });
    console.log("🧑 Moje dane z Firestore:", myData);
console.log("👤 Dane drugiego użytkownika:", otherData);
console.log("📌 Moja rola:", myRole);
console.log("📌 Rola drugiego użytkownika:", otherRole);
console.log("🧑 Moje imię i nazwisko:", myData?.roles?.[myRole]?.firstName, myData?.roles?.[myRole]?.lastName);
console.log("👤 Inne imię i nazwisko:", otherData?.roles?.[otherRole]?.firstName, otherData?.roles?.[otherRole]?.lastName);

    chatId = docRef.id;
  }

  if (chatId && onChatOpened) {
    onChatOpened(chatId);
  }
}
