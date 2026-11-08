import type { Lang } from '@/lib/i18n';

type Op = 'compare' | 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed';

interface CurriculumText {
  grades: [string, string, string[]][];
  ops: Record<Op, string>;
  upTo: (n: string) => string;
  thousand: string;
  mulBy: (n: number) => string;
  tableMul: string;
  tableDiv: string;
  withIntegers: string;
  withDecimals: string;
  newChallenge: string;
  bigNumbers: string;
  descCompare: string;
  descTable: string;
  descDefault: string;
  introCompare: string;
  introTable: string;
  introDefault: string;
  promptCompare: string;
  promptDefault: string;
  diff: Record<string, string>;
  msgFailed: string;
  msgPerfect: string;
  msgComplete: string;
  msgCorrect: string;
  msgWrong: (answer: number, lives: number) => string;
}

const SQ: CurriculumText = {
  grades: [
    ['Hapat e parë', 'Njih numrat dhe zbulo kënaqësinë e matematikës.', ['Krahasimi', 'Mbledhja deri në 20', 'Zbritja deri në 20']],
    ['Miq me numrat', 'Mblidh dhe zbrit me numra deri në 100.', ['Mbledhja', 'Zbritja', 'Numrat deri në 100']],
    ['Zbuluesit e vegjël', 'Numra më të mëdhenj dhe shumëzimet e para.', ['Mbledhja deri në 1 000', 'Zbritja', 'Shumëzimi i lehtë']],
    ['Bota e shumëzimit', 'Mëso tabelat, pastaj provo veten me ushtrime.', ['Mbledhja dhe zbritja', 'Tabela e shumëzimit', 'Tabela e pjesëtimit']],
    ['Një hap më lart', 'Shumëzime më sfiduese dhe pjesëtime të lehta.', ['Shumëzimi me dy shifra', 'Pjesëtimi pa mbetje']],
    ['Mjeshtrit e numrave', 'Sfido veten me shumëzime dhe pjesëtime të vështira.', ['Shumëzime të vështira', 'Pjesëtime të vështira']],
    ['Numra pa kufij', 'Zbulo numrat negativë dhe veprimet me ta.', ['Numrat e plotë', 'Katër veprimet', 'Numrat negativë']],
    ['Ekspertët e vegjël', 'Bëhu i sigurt me numrat dhjetorë.', ['Mbledhja dhjetore', 'Zbritja dhjetore', 'Shumëzimi dhe pjesëtimi']],
    ['Kampionët e matematikës', 'Përforco katër veprimet me sfida të avancuara.', ['Numra me shenjë', 'Numra dhjetorë', 'Sfida të përziera']],
  ],
  ops: { compare: 'Cili numër është më i madh?', addition: 'Mbledhja', subtraction: 'Zbritja', multiplication: 'Shumëzimi', division: 'Pjesëtimi', mixed: 'Sfida e kampionëve' },
  upTo: (n) => `deri në ${n}`,
  thousand: '1 000',
  mulBy: (n) => `Shumëzimi me ${n}`,
  tableMul: 'Tabela dhe shumëzime',
  tableDiv: 'Tabela dhe pjesëtime',
  withIntegers: ' me numra të plotë',
  withDecimals: ' me numra dhjetorë',
  newChallenge: ' — sfidë e re',
  bigNumbers: ' me numra të mëdhenj',
  descCompare: 'Gjej numrin më të madh nga dy numrat.',
  descTable: 'Mëso tabelën dhe vazhdo me 12 ushtrime.',
  descDefault: 'Zgjidh 12 ushtrime dhe fito deri në 3 yje.',
  introCompare: 'Shiko dy numrat dhe shkruaj numrin më të madh. Për shembull: midis 3 dhe 7, më i madhi është 7.',
  introTable: 'Lexo tabelën përpara se të fillosh. Shumëzimi është mbledhje e përsëritur, ndërsa pjesëtimi e ndan numrin në pjesë të barabarta. Ke 3 jetë. Çdo gabim humbet një jetë dhe një yll. Nëse humben të tria, e nis sërish këtë mësim. Provoje përsëri për t\'i marrë të tre yjet!',
  introDefault: 'Numrat janë vendosur njëri nën tjetrin, si në fletoren tënde. Shkruaj përgjigjen poshtë vijës. Ke 3 jetë: çdo gabim humbet një jetë dhe një yll. Pas 3 gabimeve, ky mësim nis nga e para. Fito 3 yje duke i zgjidhur të gjitha pa gabime!',
  promptCompare: 'Cili numër është më i madh?',
  promptDefault: 'Shkruaj përgjigjen e saktë.',
  diff: { Fillestar: 'Fillestar', Mesatar: 'Mesatar', 'I avancuar': 'I avancuar' },
  msgFailed: 'Mos u dorëzo! Humbe 3 jetët dhe yjet e kësaj prove. Provoje të njëjtin mësim nga fillimi.',
  msgPerfect: 'Shkëlqyeshëm! Të gjitha pa gabime. Fitove 3 yje!',
  msgComplete: 'Mësimi përfundoi! Provoje përsëri pa gabime për të fituar 3 yje.',
  msgCorrect: 'Saktë! Vazhdo kështu!',
  msgWrong: (a, l) => `Përgjigjja e saktë është ${a}. Ke edhe ${l} jetë.`,
};

const EN: CurriculumText = {
  grades: [
    ['First steps', 'Meet the numbers and discover the joy of maths.', ['Comparing', 'Addition up to 20', 'Subtraction up to 20']],
    ['Friends with numbers', 'Add and subtract with numbers up to 100.', ['Addition', 'Subtraction', 'Numbers up to 100']],
    ['Little explorers', 'Bigger numbers and the first multiplications.', ['Addition up to 1,000', 'Subtraction', 'Easy multiplication']],
    ['The world of multiplication', 'Learn the tables, then test yourself with exercises.', ['Addition and subtraction', 'Multiplication table', 'Division table']],
    ['One step higher', 'Trickier multiplication and easy division.', ['Two-digit multiplication', 'Division without remainder']],
    ['Number masters', 'Challenge yourself with hard multiplication and division.', ['Hard multiplication', 'Hard division']],
    ['Numbers without limits', 'Discover negative numbers and how to work with them.', ['Integers', 'The four operations', 'Negative numbers']],
    ['Young experts', 'Become confident with decimal numbers.', ['Decimal addition', 'Decimal subtraction', 'Multiplication and division']],
    ['Maths champions', 'Strengthen all four operations with advanced challenges.', ['Signed numbers', 'Decimal numbers', 'Mixed challenges']],
  ],
  ops: { compare: 'Which number is bigger?', addition: 'Addition', subtraction: 'Subtraction', multiplication: 'Multiplication', division: 'Division', mixed: "Champions' challenge" },
  upTo: (n) => `up to ${n}`,
  thousand: '1,000',
  mulBy: (n) => `Multiplying by ${n}`,
  tableMul: 'Table and multiplication',
  tableDiv: 'Table and division',
  withIntegers: ' with integers',
  withDecimals: ' with decimals',
  newChallenge: ' — a new challenge',
  bigNumbers: ' with big numbers',
  descCompare: 'Find the bigger of two numbers.',
  descTable: 'Learn the table, then carry on with 12 exercises.',
  descDefault: 'Solve 12 exercises and win up to 3 stars.',
  introCompare: 'Look at the two numbers and write the bigger one. For example: between 3 and 7, the bigger one is 7.',
  introTable: 'Read the table before you start. Multiplication is repeated addition, and division splits a number into equal parts. You have 3 lives. Every mistake costs one life and one star. If you lose all three, this lesson starts again. Try again to win all three stars!',
  introDefault: 'The numbers are written one under the other, just like in your exercise book. Write the answer below the line. You have 3 lives: every mistake costs one life and one star. After 3 mistakes, this lesson starts from the beginning. Win 3 stars by solving them all without mistakes!',
  promptCompare: 'Which number is bigger?',
  promptDefault: 'Write the correct answer.',
  diff: { Fillestar: 'Beginner', Mesatar: 'Intermediate', 'I avancuar': 'Advanced' },
  msgFailed: "Don't give up! You lost your 3 lives and this round's stars. Try the same lesson again from the start.",
  msgPerfect: 'Brilliant! All correct with no mistakes. You won 3 stars!',
  msgComplete: 'Lesson finished! Try again with no mistakes to win 3 stars.',
  msgCorrect: 'Correct! Keep it up!',
  msgWrong: (a, l) => `The correct answer is ${a}. You have ${l} ${l === 1 ? 'life' : 'lives'} left.`,
};

const EL: CurriculumText = {
  grades: [
    ['Τα πρώτα βήματα', 'Γνώρισε τους αριθμούς και ανακάλυψε τη χαρά των μαθηματικών.', ['Σύγκριση', 'Πρόσθεση έως το 20', 'Αφαίρεση έως το 20']],
    ['Φίλοι με τους αριθμούς', 'Πρόσθεσε και αφαίρεσε με αριθμούς έως το 100.', ['Πρόσθεση', 'Αφαίρεση', 'Αριθμοί έως το 100']],
    ['Μικροί εξερευνητές', 'Μεγαλύτεροι αριθμοί και οι πρώτοι πολλαπλασιασμοί.', ['Πρόσθεση έως το 1.000', 'Αφαίρεση', 'Εύκολος πολλαπλασιασμός']],
    ['Ο κόσμος του πολλαπλασιασμού', 'Μάθε τους πίνακες και μετά δοκίμασε τον εαυτό σου με ασκήσεις.', ['Πρόσθεση και αφαίρεση', 'Πίνακας πολλαπλασιασμού', 'Πίνακας διαίρεσης']],
    ['Ένα βήμα πιο ψηλά', 'Πιο απαιτητικοί πολλαπλασιασμοί και εύκολες διαιρέσεις.', ['Πολλαπλασιασμός με διψήφιους', 'Διαίρεση χωρίς υπόλοιπο']],
    ['Μάστορες των αριθμών', 'Προκάλεσε τον εαυτό σου με δύσκολους πολλαπλασιασμούς και διαιρέσεις.', ['Δύσκολοι πολλαπλασιασμοί', 'Δύσκολες διαιρέσεις']],
    ['Αριθμοί χωρίς όρια', 'Ανακάλυψε τους αρνητικούς αριθμούς και τις πράξεις με αυτούς.', ['Ακέραιοι αριθμοί', 'Οι τέσσερις πράξεις', 'Αρνητικοί αριθμοί']],
    ['Μικροί ειδικοί', 'Γίνε σίγουρος με τους δεκαδικούς αριθμούς.', ['Πρόσθεση δεκαδικών', 'Αφαίρεση δεκαδικών', 'Πολλαπλασιασμός και διαίρεση']],
    ['Πρωταθλητές των μαθηματικών', 'Ενίσχυσε τις τέσσερις πράξεις με προχωρημένες προκλήσεις.', ['Προσημασμένοι αριθμοί', 'Δεκαδικοί αριθμοί', 'Μικτές προκλήσεις']],
  ],
  ops: { compare: 'Ποιος αριθμός είναι μεγαλύτερος;', addition: 'Πρόσθεση', subtraction: 'Αφαίρεση', multiplication: 'Πολλαπλασιασμός', division: 'Διαίρεση', mixed: 'Η πρόκληση των πρωταθλητών' },
  upTo: (n) => `έως το ${n}`,
  thousand: '1.000',
  mulBy: (n) => `Πολλαπλασιασμός με το ${n}`,
  tableMul: 'Πίνακας και πολλαπλασιασμοί',
  tableDiv: 'Πίνακας και διαιρέσεις',
  withIntegers: ' με ακέραιους αριθμούς',
  withDecimals: ' με δεκαδικούς αριθμούς',
  newChallenge: ' — νέα πρόκληση',
  bigNumbers: ' με μεγάλους αριθμούς',
  descCompare: 'Βρες τον μεγαλύτερο από δύο αριθμούς.',
  descTable: 'Μάθε τον πίνακα και συνέχισε με 12 ασκήσεις.',
  descDefault: 'Λύσε 12 ασκήσεις και κέρδισε έως 3 αστέρια.',
  introCompare: 'Κοίτα τους δύο αριθμούς και γράψε τον μεγαλύτερο. Για παράδειγμα: ανάμεσα στο 3 και το 7, μεγαλύτερος είναι το 7.',
  introTable: 'Διάβασε τον πίνακα πριν ξεκινήσεις. Ο πολλαπλασιασμός είναι επαναλαμβανόμενη πρόσθεση, ενώ η διαίρεση μοιράζει έναν αριθμό σε ίσα μέρη. Έχεις 3 ζωές. Κάθε λάθος κοστίζει μία ζωή και ένα αστέρι. Αν χάσεις και τις τρεις, το μάθημα ξεκινά ξανά. Δοκίμασε ξανά για να κερδίσεις και τα τρία αστέρια!',
  introDefault: 'Οι αριθμοί είναι γραμμένοι ο ένας κάτω από τον άλλον, όπως στο τετράδιό σου. Γράψε την απάντηση κάτω από τη γραμμή. Έχεις 3 ζωές: κάθε λάθος κοστίζει μία ζωή και ένα αστέρι. Μετά από 3 λάθη, το μάθημα ξεκινά από την αρχή. Κέρδισε 3 αστέρια λύνοντάς τα όλα χωρίς λάθη!',
  promptCompare: 'Ποιος αριθμός είναι μεγαλύτερος;',
  promptDefault: 'Γράψε τη σωστή απάντηση.',
  diff: { Fillestar: 'Αρχάριο', Mesatar: 'Μεσαίο', 'I avancuar': 'Προχωρημένο' },
  msgFailed: 'Μην τα παρατάς! Έχασες τις 3 ζωές και τα αστέρια αυτής της προσπάθειας. Ξεκίνα το ίδιο μάθημα από την αρχή.',
  msgPerfect: 'Υπέροχα! Όλα σωστά χωρίς λάθη. Κέρδισες 3 αστέρια!',
  msgComplete: 'Το μάθημα τελείωσε! Δοκίμασε ξανά χωρίς λάθη για να κερδίσεις 3 αστέρια.',
  msgCorrect: 'Σωστά! Συνέχισε έτσι!',
  msgWrong: (a, l) => `Η σωστή απάντηση είναι ${a}. Σου ${l === 1 ? 'έμεινε 1 ζωή' : `έμειναν ${l} ζωές`}.`,
};

const IT: CurriculumText = {
  grades: [
    ['I primi passi', 'Conosci i numeri e scopri il piacere della matematica.', ['Confronto', 'Addizione fino a 20', 'Sottrazione fino a 20']],
    ['Amici dei numeri', 'Addiziona e sottrai con i numeri fino a 100.', ['Addizione', 'Sottrazione', 'Numeri fino a 100']],
    ['Piccoli esploratori', 'Numeri più grandi e le prime moltiplicazioni.', ['Addizione fino a 1.000', 'Sottrazione', 'Moltiplicazione facile']],
    ['Il mondo della moltiplicazione', 'Impara le tabelline, poi mettiti alla prova con gli esercizi.', ['Addizione e sottrazione', 'Tabellina della moltiplicazione', 'Tabellina della divisione']],
    ['Un passo più in alto', 'Moltiplicazioni più impegnative e divisioni facili.', ['Moltiplicazione a due cifre', 'Divisione senza resto']],
    ['Maestri dei numeri', 'Sfida te stesso con moltiplicazioni e divisioni difficili.', ['Moltiplicazioni difficili', 'Divisioni difficili']],
    ['Numeri senza confini', 'Scopri i numeri negativi e le operazioni con essi.', ['Numeri interi', 'Le quattro operazioni', 'Numeri negativi']],
    ['Piccoli esperti', 'Diventa sicuro con i numeri decimali.', ['Addizione decimale', 'Sottrazione decimale', 'Moltiplicazione e divisione']],
    ['Campioni di matematica', 'Rafforza le quattro operazioni con sfide avanzate.', ['Numeri relativi', 'Numeri decimali', 'Sfide miste']],
  ],
  ops: { compare: 'Quale numero è più grande?', addition: 'Addizione', subtraction: 'Sottrazione', multiplication: 'Moltiplicazione', division: 'Divisione', mixed: 'La sfida dei campioni' },
  upTo: (n) => `fino a ${n}`,
  thousand: '1.000',
  mulBy: (n) => `Moltiplicare per ${n}`,
  tableMul: 'Tabellina e moltiplicazioni',
  tableDiv: 'Tabellina e divisioni',
  withIntegers: ' con i numeri interi',
  withDecimals: ' con i numeri decimali',
  newChallenge: ' — nuova sfida',
  bigNumbers: ' con i numeri grandi',
  descCompare: 'Trova il più grande tra due numeri.',
  descTable: 'Impara la tabellina e continua con 12 esercizi.',
  descDefault: 'Risolvi 12 esercizi e vinci fino a 3 stelle.',
  introCompare: 'Guarda i due numeri e scrivi quello più grande. Per esempio: tra 3 e 7, il più grande è 7.',
  introTable: 'Leggi la tabellina prima di iniziare. La moltiplicazione è un’addizione ripetuta, mentre la divisione divide un numero in parti uguali. Hai 3 vite. Ogni errore costa una vita e una stella. Se le perdi tutte e tre, la lezione ricomincia. Riprova per conquistare tutte e tre le stelle!',
  introDefault: 'I numeri sono scritti uno sotto l’altro, proprio come nel tuo quaderno. Scrivi la risposta sotto la linea. Hai 3 vite: ogni errore costa una vita e una stella. Dopo 3 errori, la lezione ricomincia dall’inizio. Vinci 3 stelle risolvendoli tutti senza errori!',
  promptCompare: 'Quale numero è più grande?',
  promptDefault: 'Scrivi la risposta corretta.',
  diff: { Fillestar: 'Principiante', Mesatar: 'Intermedio', 'I avancuar': 'Avanzato' },
  msgFailed: 'Non arrenderti! Hai perso le 3 vite e le stelle di questa prova. Riprova la stessa lezione dall’inizio.',
  msgPerfect: 'Fantastico! Tutto giusto senza errori. Hai vinto 3 stelle!',
  msgComplete: 'Lezione finita! Riprova senza errori per vincere 3 stelle.',
  msgCorrect: 'Giusto! Continua così!',
  msgWrong: (a, l) => `La risposta corretta è ${a}. Ti ${l === 1 ? 'resta 1 vita' : `restano ${l} vite`}.`,
};

const C: Record<Lang, CurriculumText> = { sq: SQ, en: EN, el: EL, it: IT };

export function operationFor(grade: number, lesson: number): Op {
  if (grade === 1) return lesson <= 3 ? 'compare' : lesson <= 9 ? 'addition' : 'subtraction';
  if (grade === 2) return lesson <= 7 ? 'addition' : 'subtraction';
  if (grade === 3) return lesson <= 5 ? 'addition' : lesson <= 10 ? 'subtraction' : 'multiplication';
  if (grade === 4) return lesson <= 3 ? 'addition' : lesson <= 6 ? 'subtraction' : lesson <= 11 ? 'multiplication' : 'division';
  if (grade === 5) return lesson <= 8 ? 'multiplication' : 'division';
  if (grade === 6) return lesson <= 7 ? 'multiplication' : 'division';
  return lesson === 15 ? 'mixed' : lesson <= 4 ? 'addition' : lesson <= 8 ? 'subtraction' : lesson <= 11 ? 'multiplication' : 'division';
}

const hasTableFor = (grade: number, op: Op) => grade === 4 && (op === 'multiplication' || op === 'division');

export function lessonTitle(grade: number, id: number, lang: Lang): string {
  const c = C[lang];
  const op = operationFor(grade, id);
  const table = hasTableFor(grade, op);
  let title = c.ops[op];
  if (grade === 1) {
    if (op === 'addition') title = `${c.ops.addition} ${c.upTo(id <= 6 ? '10' : '20')}`;
    if (op === 'subtraction') title = `${c.ops.subtraction} ${c.upTo(id <= 12 ? '10' : '20')}`;
  } else if (grade === 2) title += ` ${c.upTo('100')}`;
  else if (grade === 3 && op !== 'multiplication') title += ` ${c.upTo(c.thousand)}`;
  else if (grade === 3) title = c.mulBy([2, 3, 4, 5, 10][id - 11] ?? 2);
  else if (grade === 4 && table) title = op === 'multiplication' ? c.tableMul : c.tableDiv;
  else if (grade >= 7 && op !== 'mixed') title += grade === 7 ? c.withIntegers : c.withDecimals;
  else title += grade >= 5 ? c.newChallenge : c.bigNumbers;
  return title;
}

/** Translate an Albanian lesson title coming from the API (e.g. recent activity). */
export function translateLessonTitle(sqTitle: string, grade: number, lang: Lang): string {
  if (lang === 'sq') return sqTitle;
  for (let id = 1; id <= 15; id++) if (lessonTitle(grade, id, 'sq') === sqTitle) return lessonTitle(grade, id, lang);
  return sqTitle;
}

export function lessonDescription(op: string, hasTable: boolean, lang: Lang) {
  const c = C[lang];
  return op === 'compare' ? c.descCompare : hasTable ? c.descTable : c.descDefault;
}
export function lessonIntro(op: string, hasTable: boolean, lang: Lang) {
  const c = C[lang];
  return op === 'compare' ? c.introCompare : hasTable ? c.introTable : c.introDefault;
}
export function exercisePrompt(operator: string, lang: Lang) {
  return operator === '>' ? C[lang].promptCompare : C[lang].promptDefault;
}
export function difficultyLabel(d: string, lang: Lang) {
  return C[lang].diff[d] ?? d;
}
export function gradeTitle(g: number, lang: Lang, fallback: string) {
  return C[lang].grades[g - 1]?.[0] ?? fallback;
}
export function gradeDescription(g: number, lang: Lang, fallback: string) {
  return C[lang].grades[g - 1]?.[1] ?? fallback;
}
export function gradeTopics(g: number, lang: Lang, fallback: string[]) {
  return C[lang].grades[g - 1]?.[2] ?? fallback;
}
export function feedbackMessage(r: { correct: boolean; correctAnswer: number; session: { status: string; lives: number } }, lang: Lang) {
  const c = C[lang];
  if (r.session.status === 'failed') return c.msgFailed;
  if (r.session.status === 'completed') return r.session.lives === 3 ? c.msgPerfect : c.msgComplete;
  return r.correct ? c.msgCorrect : c.msgWrong(r.correctAnswer, r.session.lives);
}
