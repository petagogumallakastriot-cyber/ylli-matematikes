import type { Profile } from '@workspace/api-client-react';
import type { Lang } from '@/lib/i18n';

export function isProfileComplete(p: Profile | null | undefined): boolean {
  return !!p && p.firstName.trim().length > 0 && p.lastName.trim().length > 0 && p.age != null && p.gender != null;
}

/** Private first name for greetings; falls back to nickname only for old profiles. */
export function greetName(p: Profile | null | undefined): string {
  if (!p) return '';
  return p.firstName.trim() || p.nickname.trim();
}

type Pair = [string, string];
interface Lines { correct: Pair[]; wrong: Pair[]; retry: Pair[]; complete3: Pair; complete: Pair }

const LINES: Record<Lang, Lines> = {
  sq: {
    correct: [
      ['Bravo, {n}! Saktësisht.', 'Bravo! Saktësisht.'],
      ['Shkëlqyeshëm, {n}! Ky yll është yti.', 'Shkëlqyeshëm! Ky yll është yti.'],
      ['E qëllove, {n}! Vazhdo kështu.', 'E qëllove! Vazhdo kështu.'],
      ['Ti po fluturon, {n}!', 'Po fluturon!'],
      ['Llogari e pastër, {n}. Të lumtë!', 'Llogari e pastër. Të lumtë!'],
      ['Mendje e mprehtë, {n}!', 'Mendje e mprehtë!'],
    ],
    wrong: [
      ['Afër ishe, {n}. Shiko përgjigjen dhe vazhdojmë bashkë.', 'Afër ishe. Shiko përgjigjen dhe vazhdojmë bashkë.'],
      ['S’ka gjë, {n}. Gabimet na mësojnë rrugën.', 'S’ka gjë. Gabimet na mësojnë rrugën.'],
      ['Merr frymë thellë, {n}. Tjetra do dalë më mirë.', 'Merr frymë thellë. Tjetra do dalë më mirë.'],
      ['Çdo matematikan gabon ndonjëherë, {n}. Vazhdo!', 'Çdo matematikan gabon ndonjëherë. Vazhdo!'],
    ],
    retry: [
      ['Hajde, {n}, një fletë e re të pret. Ti mundesh!', 'Një fletë e re të pret. Ti mundesh!'],
      ['Tani i njeh më mirë këto llogari, {n}. Provo sërish!', 'Tani i njeh më mirë këto llogari. Provo sërish!'],
    ],
    complete3: ['Tre yje pa asnjë gabim! Je yll i vërtetë, {n}.', 'Tre yje pa asnjë gabim! Je yll i vërtetë.'],
    complete: ['Urime, {n}! E përfundove mësimin. Provoje pa gabime për të tre yjet.', 'Urime! E përfundove mësimin. Provoje pa gabime për të tre yjet.'],
  },
  en: {
    correct: [
      ['Well done, {n}! Exactly right.', 'Well done! Exactly right.'],
      ['Brilliant, {n}! This star is yours.', 'Brilliant! This star is yours.'],
      ['You got it, {n}! Keep going.', 'You got it! Keep going.'],
      ['You are flying, {n}!', 'You are flying!'],
      ['A clean sum, {n}. Great job!', 'A clean sum. Great job!'],
      ['Sharp thinking, {n}!', 'Sharp thinking!'],
    ],
    wrong: [
      ['So close, {n}. Look at the answer and we carry on together.', 'So close. Look at the answer and we carry on together.'],
      ['No worries, {n}. Mistakes show us the way.', 'No worries. Mistakes show us the way.'],
      ['Take a deep breath, {n}. The next one will go better.', 'Take a deep breath. The next one will go better.'],
      ['Every mathematician makes mistakes sometimes, {n}. Keep going!', 'Every mathematician makes mistakes sometimes. Keep going!'],
    ],
    retry: [
      ['Come on, {n}, a fresh page is waiting. You can do it!', 'A fresh page is waiting. You can do it!'],
      ['You know these sums better now, {n}. Try again!', 'You know these sums better now. Try again!'],
    ],
    complete3: ['Three stars with no mistakes! You are a real star, {n}.', 'Three stars with no mistakes! You are a real star.'],
    complete: ['Congratulations, {n}! You finished the lesson. Try it with no mistakes for all three stars.', 'Congratulations! You finished the lesson. Try it with no mistakes for all three stars.'],
  },
  el: {
    correct: [
      ['Μπράβο, {n}! Ακριβώς.', 'Μπράβο! Ακριβώς.'],
      ['Υπέροχα, {n}! Αυτό το αστέρι είναι δικό σου.', 'Υπέροχα! Αυτό το αστέρι είναι δικό σου.'],
      ['Το βρήκες, {n}! Συνέχισε έτσι.', 'Το βρήκες! Συνέχισε έτσι.'],
      ['Πετάς, {n}!', 'Πετάς!'],
      ['Καθαρός λογαριασμός, {n}. Μπράβο σου!', 'Καθαρός λογαριασμός. Μπράβο σου!'],
      ['Κοφτερό μυαλό, {n}!', 'Κοφτερό μυαλό!'],
    ],
    wrong: [
      ['Πολύ κοντά, {n}. Δες την απάντηση και συνεχίζουμε μαζί.', 'Πολύ κοντά. Δες την απάντηση και συνεχίζουμε μαζί.'],
      ['Δεν πειράζει, {n}. Τα λάθη μάς δείχνουν τον δρόμο.', 'Δεν πειράζει. Τα λάθη μάς δείχνουν τον δρόμο.'],
      ['Πάρε μια βαθιά ανάσα, {n}. Το επόμενο θα πάει καλύτερα.', 'Πάρε μια βαθιά ανάσα. Το επόμενο θα πάει καλύτερα.'],
      ['Κάθε μαθηματικός κάνει λάθη μερικές φορές, {n}. Συνέχισε!', 'Κάθε μαθηματικός κάνει λάθη μερικές φορές. Συνέχισε!'],
    ],
    retry: [
      ['Έλα, {n}, μια καινούργια σελίδα σε περιμένει. Μπορείς!', 'Μια καινούργια σελίδα σε περιμένει. Μπορείς!'],
      ['Τώρα ξέρεις καλύτερα αυτές τις πράξεις, {n}. Δοκίμασε ξανά!', 'Τώρα ξέρεις καλύτερα αυτές τις πράξεις. Δοκίμασε ξανά!'],
    ],
    complete3: ['Τρία αστέρια χωρίς κανένα λάθος! Είσαι αληθινό αστέρι, {n}.', 'Τρία αστέρια χωρίς κανένα λάθος! Είσαι αληθινό αστέρι.'],
    complete: ['Συγχαρητήρια, {n}! Τελείωσες το μάθημα. Δοκίμασέ το χωρίς λάθη για τα τρία αστέρια.', 'Συγχαρητήρια! Τελείωσες το μάθημα. Δοκίμασέ το χωρίς λάθη για τα τρία αστέρια.'],
  },
  it: {
    correct: [
      ['Bravo, {n}! Esatto.', 'Bravo! Esatto.'],
      ['Fantastico, {n}! Questa stella è tua.', 'Fantastico! Questa stella è tua.'],
      ['Centrato, {n}! Continua così.', 'Centrato! Continua così.'],
      ['Stai volando, {n}!', 'Stai volando!'],
      ['Un calcolo pulito, {n}. Complimenti!', 'Un calcolo pulito. Complimenti!'],
      ['Mente brillante, {n}!', 'Mente brillante!'],
    ],
    wrong: [
      ['Ci sei andato vicino, {n}. Guarda la risposta e continuiamo insieme.', 'Ci sei andato vicino. Guarda la risposta e continuiamo insieme.'],
      ['Non fa niente, {n}. Gli errori ci mostrano la strada.', 'Non fa niente. Gli errori ci mostrano la strada.'],
      ['Fai un bel respiro, {n}. Il prossimo andrà meglio.', 'Fai un bel respiro. Il prossimo andrà meglio.'],
      ['Ogni matematico sbaglia ogni tanto, {n}. Avanti!', 'Ogni matematico sbaglia ogni tanto. Avanti!'],
    ],
    retry: [
      ['Dai, {n}, ti aspetta una pagina nuova. Ce la puoi fare!', 'Ti aspetta una pagina nuova. Ce la puoi fare!'],
      ['Ora conosci meglio questi calcoli, {n}. Riprova!', 'Ora conosci meglio questi calcoli. Riprova!'],
    ],
    complete3: ['Tre stelle senza nessun errore! Sei una vera stella, {n}.', 'Tre stelle senza nessun errore! Sei una vera stella.'],
    complete: ['Complimenti, {n}! Hai finito la lezione. Riprova senza errori per tutte e tre le stelle.', 'Complimenti! Hai finito la lezione. Riprova senza errori per tutte e tre le stelle.'],
  },
};

export type LineRef = { kind: 'correct' | 'wrong' | 'retry' | 'complete3' | 'complete'; i: number };

export function pickLine(kind: LineRef['kind']): LineRef {
  const len = kind === 'complete3' || kind === 'complete' ? 1 : LINES.sq[kind].length;
  return { kind, i: Math.floor(Math.random() * len) };
}

export function renderLine(ref: LineRef, name: string, lang: Lang): string {
  const l = LINES[lang];
  const pair: Pair = ref.kind === 'complete3' || ref.kind === 'complete' ? l[ref.kind] : l[ref.kind][ref.i] ?? l[ref.kind][0];
  return name ? pair[0].replace('{n}', name) : pair[1];
}
