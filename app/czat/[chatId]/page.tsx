"use client";

import { useParams, useSearchParams } from "next/navigation";
import ChatBox from "@/components/ChatBox";

export default function ChatRoomPage() {
  const params = useParams();
  const chatId = params?.chatId as string;

  const searchParams = useSearchParams();
  const role = searchParams.get("role") as "wlasciciel" | "specjalista" | null;

  if (!chatId || !role) {
    return <p>❌ Brak ID czatu lub roli.</p>;
  }

  return <ChatBox chatId={chatId} role={role} />;
}
