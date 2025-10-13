"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";

interface ChatSidebarProps {
  role: "wlasciciel" | "specjalista";
  onSelectChat?: (chatId: string) => void;
  activeChatId?: string | null;
  onUnreadCountChange?: (count: number) => void;
}

export default function ChatSidebar({
  role,
  onSelectChat,
  activeChatId,
  onUnreadCountChange,
}: ChatSidebarProps) {
  const [chats, setChats] = useState<any[]>([]);
  const [userUid, setUserUid] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<Record<string, any>>({});
  const router = useRouter();

  const normalizeRole = (r: string) => {
    if (!r) return "";
    const lower = r.toLowerCase();
    if (lower === "wlasciciel") return "wlasciciel";
    if (lower === "specjalista" || lower === "specialista") return "specjalista";
    return lower;
  };

  useEffect(() => {
    const auth = getAuth();
    let unsubChats: (() => void) | null = null;
    const unsubReadStatus: (() => void)[] = [];

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user?.uid || !user?.email) return;
      setUserUid(user.uid);

      const q = query(
        collection(db, "czaty"),
        where("participantEmails", "array-contains", user.email),
        orderBy("updatedAt", "desc")
      );

      unsubChats = onSnapshot(q, (snapshot) => {
        const chatDocs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        // dodaj/aktualizuj czaty w stanie
        setChats((prev) => {
          const merged = chatDocs.map((c) => {
            const existing = prev.find((p) => p.id === c.id);
            return existing ? { ...existing, ...c } : c;
          });
          return merged;
        });

        // ustaw nasłuchy readStatus dla każdego czatu
        chatDocs.forEach((chat: any) => {
          const myParticipant = chat.participants?.find(
            (p: any) => p.uid === user.uid
          );
          if (!myParticipant) return;
          const myRole = normalizeRole(myParticipant?.role ?? "");
          const myIdentity = `${user.uid}_${myRole}`;
          const senderUid = chat?.lastMessageSender;
          const senderRole = normalizeRole(chat?.lastMessageRole);
          const senderIdentity = `${senderUid}_${senderRole}`;
          const rsRef = doc(db, "czaty", chat.id, "readStatus", myIdentity);

          const unsub = onSnapshot(rsRef, (rsSnap) => {
            const readStatus = rsSnap.data();
            const lastReadAt =
              readStatus?.lastReadAt?.toMillis?.() ??
              readStatus?.lastReadAtLocal ??
              0;
            const lastMessageAt = chat?.lastMessageAt?.toMillis?.() ?? 0;
            const hasUnread =
              senderIdentity !== myIdentity && lastMessageAt > lastReadAt;

            setChats((prev) =>
              prev.map((c) =>
                c.id === chat.id ? { ...c, hasUnread } : c
              )
            );

            if (onUnreadCountChange) {
              setChats((prev) => {
                const count = prev.filter((c) => c.hasUnread).length;
                onUnreadCountChange(count);
                return prev;
              });
            }
          });

          unsubReadStatus.push(unsub);
        });
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubChats) unsubChats();
      unsubReadStatus.forEach((u) => u());
    };
  }, []);

  // 👉 Kliknięcie w czat
  const handleClick = async (chat: any) => {
    if (!userUid) return;

    if (chat.hasUnread) {
      const myParticipant = chat.participants?.find(
        (p: any) => p.uid === userUid
      );
      const myRole = normalizeRole(myParticipant?.role ?? "");
      const myIdentity = `${userUid}_${myRole}`;
      const rsRef = doc(db, "czaty", chat.id, "readStatus", myIdentity);

      await setDoc(
        rsRef,
        {
          lastReadAt: serverTimestamp(),
          lastReadAtLocal: Date.now(),
        },
        { merge: true }
      );

      // 🔥 lokalny update od razu
      setChats((prev) => {
        const updated = prev.map((c) =>
          c.id === chat.id ? { ...c, hasUnread: false } : c
        );
        if (onUnreadCountChange) {
          const count = updated.filter((c) => c.hasUnread).length;
          onUnreadCountChange(count);
        }
        return updated;
      });
    }

    if (onSelectChat) {
      onSelectChat(chat.id);
    } else {
      router.push(`/czat/${chat.id}?role=${role}`);
    }
  };

  // 🔹 Pobieranie szczegółów rozmówców
  useEffect(() => {
    const fetchDetails = async () => {
      const details: Record<string, any> = {};
      for (const chat of chats) {
        for (const p of chat.participants || []) {
          if (!userDetails[p.uid]) {
            const userRef = doc(db, "users", p.uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
              const data = snap.data();
              const spec = data?.roles?.specjalista;
              const wlasc = data?.roles?.wlasciciel;

              details[p.uid] = {
                firstName: spec?.firstName || wlasc?.firstName || "",
                lastName: spec?.lastName || wlasc?.lastName || "",
                role: spec
                  ? "Specjalista"
                  : wlasc
                  ? "Właściciel"
                  : "Użytkownik",
              };
            }
          }
        }
      }
      if (Object.keys(details).length > 0) {
        setUserDetails((prev) => ({ ...prev, ...details }));
      }
    };

    if (chats.length > 0) fetchDetails();
  }, [chats]);

  return (
    <div style={{ padding: "16px" }}>
      <h3>
        Twoje czaty ({role === "wlasciciel" ? "Właściciel" : "Specjalista"})
      </h3>
      {chats.length === 0 && <p>Brak rozpoczętych czatów</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {userUid &&
          chats.map((chat) => {
            const isActive = chat.id === activeChatId;

            let dataZgloszenia: string | null = null;
            if (chat.dataZgloszenia instanceof Timestamp) {
              dataZgloszenia = chat.dataZgloszenia
                .toDate()
                .toLocaleDateString();
            } else if (typeof chat.dataZgloszenia === "string") {
              dataZgloszenia = new Date(
                chat.dataZgloszenia
              ).toLocaleDateString();
            }

            const other =
              Array.isArray(chat.participants) && chat.participants.length > 0
                ? chat.participants.find((p: any) => p.uid !== userUid)
                : null;

            return (
              <li
                key={chat.id}
                onClick={() => handleClick(chat)}
                style={{
                  cursor: "pointer",
                  marginBottom: "8px",
                  padding: "10px",
                  borderRadius: "8px",
                  backgroundColor: "#f9f9f9",
                  color: isActive ? "#0D1F40" : "black",
                  border: isActive ? "2px solid #0D1F40" : "1px solid #ddd",
                }}
              >
                <div>
                  <strong>Temat:</strong> {chat.temat || "Bez tematu"}
                  {chat.hasUnread && (
                    <span style={{ color: "red", marginLeft: "6px" }}>❗</span>
                  )}
                </div>
                <small>Data zgłoszenia: {dataZgloszenia || "—"}</small>
                <br />
                {other ? (
                  <small>
                    {userDetails[other.uid] ? (
                      <>
                        {userDetails[other.uid].firstName}{" "}
                        {userDetails[other.uid].lastName} –{" "}
                        {userDetails[other.uid].role}
                      </>
                    ) : (
                      <>{other.uid} – uczestnik</>
                    )}
                  </small>
                ) : (
                  <small style={{ color: "#999" }}>
                    <em>Brak danych rozmówcy</em>
                  </small>
                )}
              </li>
            );
          })}
      </ul>
    </div>
  );
}
