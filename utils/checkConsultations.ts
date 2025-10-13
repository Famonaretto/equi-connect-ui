'use client';
import {
  doc,
  getFirestore,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { formatISO, format } from 'date-fns';
import { pl } from 'date-fns/locale';

type Role = 'specjalista' | 'wlasciciel';

interface ShowDialogWithActionsFn {
  (
    message: string,
    actions: { label: string; value: string }[],
    onSelect: (value: string) => void
  ): void;
}

interface ShowDatePickerFn {
  (message: string, onConfirm: (date: string) => void): void;
}

export async function checkConsultationsAfterLogin(
  uid: string,
  role: Role,
  showDialogWithActions: ShowDialogWithActionsFn,
  showDatePicker: ShowDatePickerFn
): Promise<void> {
  const db = getFirestore(app);
  const konsultacjeRef = collection(db, 'konsultacje');
  const now = new Date();

  const baseQuery = where(
    role === 'wlasciciel' ? 'ownerUid' : 'specjalistaUid',
    '==',
    uid
  );

  const planowaneQuery = query(
    konsultacjeRef,
    baseQuery,
    where('status', 'in', ['planowane', 'odbytaW', 'odbytaS']),
    where('proponowanyTermin', '<=', formatISO(now))
  );

  const results = await getDocs(planowaneQuery);
  const docsToCheck = results.docs;

  for (const docSnap of docsToCheck) {
    const data = docSnap.data();
    const konsultacjaId = docSnap.id;
    const docRef = doc(db, 'konsultacje', konsultacjaId);

    const otherPersonName =
      role === 'wlasciciel'
        ? data.specjalistaImieNazwisko || data.specjalista || 'specjalistą'
        : data.ownerImieNazwisko || data.ownerName || 'właścicielem';

    const formattedDate = data.proponowanyTermin
      ? format(new Date(data.proponowanyTermin), "PPPP 'o' HH:mm", {
          locale: pl,
        })
      : 'nieznany termin';

    // Jeśli już jest rozbieżność → tylko komunikat, ale poczekaj aż user kliknie
    if (data.discrepancy) {
      await new Promise<void>((resolve) => {
        if (data.discrepancyReason === 'różne_odpowiedzi') {
          showDialogWithActions(
            `❗ Odpowiedzi właściciela i specjalisty dla konsultacji z ${otherPersonName} (${formattedDate}) są różne. Skontaktuj się, aby wyjaśnić.`,
            [{ label: 'OK', value: 'ok' }],
            () => resolve()
          );
} else if (data.discrepancyReason === 'różne_terminy') {
  const ownerDate = data.ownerDate
    ? format(new Date(data.ownerDate), "PPPP 'o' HH:mm", { locale: pl })
    : 'brak daty';
  const specialistDate = data.specialistDate
    ? format(new Date(data.specialistDate), "PPPP 'o' HH:mm", { locale: pl })
    : 'brak daty';

  showDialogWithActions(
    `📅 Terminy przeniesienia konsultacji z ${otherPersonName} są różne:\n\n` +
      `👤 Właściciel: ${ownerDate}\n` +
      `👨‍⚕️ Specjalista: ${specialistDate}\n\n` +
      `Skontaktujcie się, aby ustalić wspólny termin.`,
    [{ label: 'OK', value: 'ok' }],
    () => resolve()
  );
}

 else {
          resolve();
        }
      });
      continue;
    }

    const message = `🗓 Czy konsultacja z ${otherPersonName} planowana na ${formattedDate} się odbyła?`;

    await new Promise<void>((resolve) => {
      showDialogWithActions(
        message,
        [
          { label: '✅ Tak, odbyła się', value: 'odbyta' },
          { label: '❌ Została odwołana', value: 'odwolana' },
          { label: '📅 Przeniesiono', value: 'przeniesiona' },
        ],
        async (choice) => {
          const responseField =
            role === 'wlasciciel' ? 'ownerResponse' : 'specialistResponse';
          const dateField =
            role === 'wlasciciel' ? 'ownerDate' : 'specialistDate';

          if (choice === 'odbyta' || choice === 'odwolana') {
            await updateDoc(docRef, { [responseField]: choice, noDecision: false });
            const updated = (await getDoc(docRef)).data();
            if (!updated) return resolve();

            if (updated.ownerResponse && updated.specialistResponse) {
              if (updated.ownerResponse === updated.specialistResponse) {
                await updateDoc(docRef, {
                  finalStatus: updated.ownerResponse,
                  status: updated.ownerResponse,
                  discrepancy: false,
                  discrepancyReason: null,
                });
              } else {
                showDialogWithActions(
                  `⚠️ Twoja odpowiedź: „${choice}” różni się od odpowiedzi drugiej strony (${otherPersonName}: „${updated.ownerResponse || updated.specialistResponse}”). 
                   Konsultacja była planowana na ${formattedDate}. Co chcesz zrobić?`,
                  [
                    { label: '✏️ Zmień odpowiedź', value: 'change' },
                    { label: '✅ Potwierdzam moją odpowiedź', value: 'confirm' },
                    { label: '⏳ Odpowiem później', value: 'later' },
                  ],
                  async (decision) => {
                    if (decision === 'confirm') {
                      await updateDoc(docRef, {
                        discrepancy: true,
                        discrepancyReason: 'różne_odpowiedzi',
                        finalStatus: null,
                        noDecision: false,
                      });
                    }
                    if (decision === 'later') {
                      await updateDoc(docRef, {
                        [responseField]: 'brak',
                        noDecision: true,
                      });
                    }
                    if (decision === 'change') {
                      showDialogWithActions(
                        `🔄 Wybierz ponownie status konsultacji z ${otherPersonName} (planowana na ${formattedDate}):`,
                        [
                          { label: '✅ Odbyła się', value: 'odbyta' },
                          { label: '❌ Odwołana', value: 'odwolana' },
                          { label: '📅 Przeniesiono', value: 'przeniesiona' },
                        ],
                        async (newChoice) => {
                          await updateDoc(docRef, {
                            [responseField]: newChoice,
                            noDecision: false,
                          });
                          resolve();
                        }
                      );
                      return; // poczekaj aż user wybierze
                    }
                    resolve();
                  }
                );
                return; // ważne: poczekaj aż user odpowie
              }
            }
            return resolve();
          }

          if (choice === 'przeniesiona') {
            showDatePicker(
              '📅 Wybierz nowy termin konsultacji:',
              async (newDate) => {
                await updateDoc(docRef, {
                  [responseField]: 'przeniesiona',
                  [dateField]: newDate,
                  noDecision: false,
                });
                const updated = (await getDoc(docRef)).data();
                if (!updated) return resolve();

                if (
                  updated.ownerResponse === 'przeniesiona' &&
                  updated.specialistResponse === 'przeniesiona'
                ) {
                  if (updated.ownerDate === updated.specialistDate) {
                    await updateDoc(docRef, {
                      finalStatus: 'przeniesiona',
                      status: 'przeniesiona',
                      proponowanyTermin: updated.ownerDate,
                      discrepancy: false,
                      discrepancyReason: null,
                    });
                    resolve();
                  } else {
                    showDialogWithActions(
                      `⚠️ Twój termin (${newDate}) różni się od odpowiedzi drugiej strony (${otherPersonName}: ${updated.ownerDate || updated.specialistDate}). 
                       Konsultacja była planowana na ${formattedDate}. Co chcesz zrobić?`,
                      [
                        { label: '✏️ Zmień termin', value: 'change' },
                        { label: '✅ Potwierdzam mój termin', value: 'confirm' },
                        { label: '⏳ Odpowiem później', value: 'later' },
                      ],
                      async (decision) => {
                        if (decision === 'confirm') {
                          await updateDoc(docRef, {
                            discrepancy: true,
                            discrepancyReason: 'różne_terminy',
                            finalStatus: null,
                            noDecision: false,
                          });
                        }
                        if (decision === 'later') {
                          await updateDoc(docRef, {
                            [responseField]: 'brak',
                            noDecision: true,
                          });
                        }
                        if (decision === 'change') {
                          showDatePicker(
                            `🔄 Wybierz ponownie termin konsultacji z ${otherPersonName}:`,
                            async (retryDate) => {
                              await updateDoc(docRef, {
                                [responseField]: 'przeniesiona',
                                [dateField]: retryDate,
                                noDecision: false,
                              });
                              resolve();
                            }
                          );
                          return; // czekamy aż user wybierze nowy termin
                        }
                        resolve();
                      }
                    );
                  }
                } else {
                  resolve();
                }
              }
            );
            return; // czekamy na wybór daty
          }

          resolve(); // fallback
        }
      );
    });
  }
}
