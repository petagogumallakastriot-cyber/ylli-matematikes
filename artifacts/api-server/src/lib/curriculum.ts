import { randomInt } from "node:crypto";
import type { StoredExercise } from "@workspace/db";

export type Operation = "compare" | "addition" | "subtraction" | "multiplication" | "division" | "mixed";
const gradeInfo = [
  ["Hapat e parë", "Njih numrat dhe zbulo kënaqësinë e matematikës.", ["Krahasimi", "Mbledhja deri në 20", "Zbritja deri në 20"]],
  ["Miq me numrat", "Mblidh dhe zbrit me numra deri në 100.", ["Mbledhja", "Zbritja", "Numrat deri në 100"]],
  ["Zbuluesit e vegjël", "Numra më të mëdhenj dhe shumëzimet e para.", ["Mbledhja deri në 1 000", "Zbritja", "Shumëzimi i lehtë"]],
  ["Bota e shumëzimit", "Mëso tabelat, pastaj provo veten me ushtrime.", ["Mbledhja dhe zbritja", "Tabela e shumëzimit", "Tabela e pjesëtimit"]],
  ["Një hap më lart", "Shumëzime më sfiduese dhe pjesëtime të lehta.", ["Shumëzimi me dy shifra", "Pjesëtimi pa mbetje"]],
  ["Mjeshtrit e numrave", "Sfido veten me shumëzime dhe pjesëtime të vështira.", ["Shumëzime të vështira", "Pjesëtime të vështira"]],
  ["Numra pa kufij", "Zbulo numrat negativë dhe veprimet me ta.", ["Numrat e plotë", "Katër veprimet", "Numrat negativë"]],
  ["Ekspertët e vegjël", "Bëhu i sigurt me numrat dhjetorë.", ["Mbledhja dhjetore", "Zbritja dhjetore", "Shumëzimi dhe pjesëtimi"]],
  ["Kampionët e matematikës", "Përforco katër veprimet me sfida të avancuara.", ["Numra me shenjë", "Numra dhjetorë", "Sfida të përziera"]],
] as const;

export function operationFor(grade: number, lesson: number): Operation {
  if (grade === 1) return lesson <= 3 ? "compare" : lesson <= 9 ? "addition" : "subtraction";
  if (grade === 2) return lesson <= 7 ? "addition" : "subtraction";
  if (grade === 3) return lesson <= 5 ? "addition" : lesson <= 10 ? "subtraction" : "multiplication";
  if (grade === 4) return lesson <= 3 ? "addition" : lesson <= 6 ? "subtraction" : lesson <= 11 ? "multiplication" : "division";
  if (grade === 5) return lesson <= 8 ? "multiplication" : "division";
  if (grade === 6) return lesson <= 7 ? "multiplication" : "division";
  return lesson === 15 ? "mixed" : lesson <= 4 ? "addition" : lesson <= 8 ? "subtraction" : lesson <= 11 ? "multiplication" : "division";
}

const titles: Record<Operation, string> = {
  compare: "Cili numër është më i madh?",
  addition: "Mbledhja",
  subtraction: "Zbritja",
  multiplication: "Shumëzimi",
  division: "Pjesëtimi",
  mixed: "Sfida e kampionëve",
};
type Progress = { grade: number; lesson: number; stars: number };
export function lessonFor(grade: number, id: number, progress: Progress[] = []) {
  const operation = operationFor(grade, id);
  const stars = progress.find(p => p.grade === grade && p.lesson === id)?.stars ?? 0;
  const hasTable = grade === 4 && (operation === "multiplication" || operation === "division");
  let title = titles[operation];
  if (grade === 1) {
    if (operation === "addition") title = id <= 6 ? "Mbledhja deri në 10" : "Mbledhja deri në 20";
    if (operation === "subtraction") title = id <= 12 ? "Zbritja deri në 10" : "Zbritja deri në 20";
  } else if (grade === 2) title += " deri në 100";
  else if (grade === 3 && operation !== "multiplication") title += " deri në 1 000";
  else if (grade === 3) title = `Shumëzimi me ${[2, 3, 4, 5, 10][id - 11]}`;
  else if (grade === 4 && hasTable) title = operation === "multiplication" ? "Tabela dhe shumëzime" : "Tabela dhe pjesëtime";
  else if (grade >= 7 && operation !== "mixed") title += grade === 7 ? " me numra të plotë" : " me numra dhjetorë";
  else title += grade >= 5 ? " — sfidë e re" : " me numra të mëdhenj";
  const description = operation === "compare" ? "Gjej numrin më të madh nga dy numrat." :
    hasTable ? "Mëso tabelën dhe vazhdo me 12 ushtrime." :
    "Zgjidh 12 ushtrime dhe fito deri në 3 yje.";
  return { id, grade, title, description, operation, difficulty: grade <= 2 ? "Fillestar" : grade <= 4 ? "Mesatar" : "I avancuar", stars, completed: stars > 0, locked: false, exerciseCount: 12, hasTable };
}
export function gradesFor(progress: Progress[] = []) {
  return gradeInfo.map(([title, description, topics], i) => ({
    grade: i + 1, title, description, topics: [...topics], totalLessons: 15,
    completedLessons: progress.filter(p => p.grade === i + 1 && p.stars > 0).length,
    stars: progress.filter(p => p.grade === i + 1).reduce((s, p) => s + p.stars, 0),
  }));
}
export function lessonDetail(grade: number, id: number, progress: Progress[] = []) {
  const lesson = lessonFor(grade, id, progress);
  const table: { a: number; b: number; operator: string; result: number }[] = [];
  if (lesson.hasTable) {
    for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++)
      table.push(lesson.operation === "multiplication" ?
        { a, b, operator: "×", result: a * b } : { a: a * b, b: a, operator: "÷", result: b });
  }
  return {
    lesson,
    introduction: lesson.operation === "compare" ? "Shiko dy numrat dhe shkruaj numrin më të madh. Për shembull: midis 3 dhe 7, më i madhi është 7." :
      lesson.hasTable ? "Lexo tabelën përpara se të fillosh. Shumëzimi është mbledhje e përsëritur, ndërsa pjesëtimi e ndan numrin në pjesë të barabarta. Ke 3 jetë. Çdo gabim humbet një jetë dhe një yll. Nëse humben të tria, e nis sërish këtë mësim. Provoje përsëri për t'i marrë të tre yjet!" :
        "Numrat janë vendosur njëri nën tjetrin, si në fletoren tënde. Shkruaj përgjigjen poshtë vijës. Ke 3 jetë: çdo gabim humbet një jetë dhe një yll. Pas 3 gabimeve, ky mësim nis nga e para. Fito 3 yje duke i zgjidhur të gjitha pa gabime!",
    table,
  };
}
const r = (min: number, max: number) => randomInt(min, max + 1);
const round = (n: number) => Math.round(n * 100) / 100;
export function generateExercises(grade: number, lesson: number): StoredExercise[] {
  return Array.from({ length: 12 }, (_, id) => {
    let operation = operationFor(grade, lesson);
    if (operation === "mixed") operation = (["addition", "subtraction", "multiplication", "division"] as const)[id % 4]!;
    let a = 0, b = 0, answer = 0, operator = "";
    if (operation === "compare") {
      a = r(1, lesson === 1 ? 10 : 20); b = r(1, lesson === 1 ? 10 : 20);
      while (a === b) b = r(1, 20);
      operator = ">"; answer = Math.max(a, b);
    } else if (operation === "addition" || operation === "subtraction") {
      const max = grade === 1 ? ((operation === "addition" ? lesson <= 6 : lesson <= 12) ? 10 : 20) : grade === 2 ? 100 : grade === 3 ? 1000 : 10000;
      if (grade <= 6) {
        if (operation === "addition") { a = r(1, max - 1); b = r(1, max - a); }
        else { a = r(2, max); b = r(1, a); }
      } else if (grade === 7) { a = r(-200, 200); b = r(-200, 200); }
      else { a = r(grade === 9 ? -99999 : 1, 99999) / 100; b = r(grade === 9 ? -99999 : 1, 99999) / 100; }
      operator = operation === "addition" ? "+" : "−";
      answer = round(operation === "addition" ? a + b : a - b);
    } else if (operation === "multiplication") {
      if (grade === 3) { a = r(1, 10); b = [2, 3, 4, 5, 10][lesson - 11]!; }
      else if (grade === 4) { a = r(1, 10); b = r(1, 10); }
      else if (grade === 5) { a = r(11, 99); b = r(2, lesson <= 4 ? 9 : 25); }
      else if (grade === 6) { a = r(100, 999); b = r(11, lesson <= 3 ? 99 : 299); }
      else if (grade === 7) { a = r(-30, 30); b = r(-12, 12); }
      else { a = r(grade === 9 ? -999 : 1, 999) / 10; b = r(grade === 9 ? -99 : 1, 99) / 10; }
      operator = "×"; answer = round(a * b);
    } else {
      if (grade === 4) { b = r(1, 10); answer = r(1, 10); }
      else if (grade === 5) { b = r(2, 10); answer = r(2, 30); }
      else if (grade === 6) { b = r(12, 99); answer = r(12, 99); }
      else if (grade === 7) { b = r(2, 12) * (r(0, 1) ? 1 : -1); answer = r(-30, 30); }
      else { b = r(2, 20) / 10 * (grade === 9 && r(0, 1) ? -1 : 1); answer = r(grade === 9 ? -100 : 1, 100) / 10; }
      a = round(b * answer); operator = "÷";
    }
    return { id, a: round(a), b: round(b), operator, answer: round(answer), prompt: operation === "compare" ? "Cili numër është më i madh?" : "Shkruaj përgjigjen e saktë." };
  });
}
