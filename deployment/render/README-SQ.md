# Ylli i Matematikës — Render Free + Neon Free

Kjo paketë përgatit platformën për jashtë Replit. **Nuk është publikuar ende.**
Render shërben faqen dhe API-n nga e njëjta adresë HTTPS; Neon ruan të dhënat.
Nuk kërkohet Wix apo Clerk për këtë kopje. SQ / EN / GR / IT dhe hyrja me
pseudonim + PIN mbeten aktive. Hyrja e vjetër me email nuk aktivizohet në Render.

## 1. Krijo databazën falas

**Për këtë transferim, ky hap është kryer:** projekti Neon Free
`ylli-matematikes`, databaza `ylli`, dega `production`, rajoni Frankfurt.
Tabelat fillestare janë krijuar pa profile fëmijësh. Të dhënat jo-sekrete të
destinacionit janë në `target.json`. Për vazhdimin e këtij transferimi zgjidh
këtë projekt, mos krijo një tjetër; kopjo adresën nga **Connect** vetëm te Render.
Udhëzimet më poshtë vlejnë nëse po krijon një instalim tjetër nga e para.

1. Hape https://neon.com dhe krijo llogari/projekt me planin **Free**.
2. Zgjidh një rajon evropian afër Frankfurtit, nëse është i disponueshëm.
3. Përdor një **databazë bosh vetëm për këtë platformë**.
4. Te **Connect**, kopjo adresën PostgreSQL; ruaj parametrin `sslmode=require`
   (dhe çdo parametër tjetër të dhënë nga Neon).
5. Mos e dërgo adresën në bisedë dhe mos e fut në GitHub: përmban fjalëkalimin.

## 2. Vendos kodin në GitHub

Për këtë platformë, pronari ka zgjedhur që kodi të jetë publik në
`petagogumallakastriot-cyber/ylli-matematikes`. Kjo publikon vetëm kodin,
jo databazën, profilet, PIN-et apo sekretet e shërbimit.

Për një instalim tjetër rekomandohet depo private. Nxirre
`ylli-render-neon.zip` dhe ngarko përmbajtjen në depon e zgjedhur,
me `render.yaml` dhe `package.json` drejtpërdrejt në rrënjë, jo brenda një
dosjeje shtesë. Mos ngarko `.env`, kopje databaze, çelësa, PIN-e apo të dhëna fëmijësh.
Paketimi nuk përfshin këto të dhëna dhe as `node_modules`.

## 3. Krijo shërbimin Render

1. Krijo llogari te https://render.com dhe lidhe depon e mësipërme.
2. Zgjidh **New → Blueprint**, zgjidh depon dhe përdor `render.yaml`.
3. Kontrollo se krijohet vetëm një **Web Service, Free**. Nuk ka databazë
   Render në këtë konfigurim. Mos mirato ndonjë plan me pagesë.
4. Për `DATABASE_URL`, vendos adresën sekrete të Neon vetëm në formularin
   e variablave të Render.
5. `SESSION_SECRET` krijohet automatikisht. Mos e ndrysho: PIN-et e ruajtura
   varen nga kjo vlerë. Ruaje privatisht në një menaxhues fjalëkalimesh.
6. Mirato krijimin/publikimin vetë në Render. Kjo mund ta bëjë faqen publike:
   mos përdor të dhëna reale fëmijësh për provën fillestare.

Alternativë nëse krijon shërbimin manualisht:

- Runtime: Node, versioni `24.22.1`; root directory bosh (rrënja e depos).
- Plan: **Free**; region: Frankfurt.
- Build: `pnpm install --frozen-lockfile --prod=false && pnpm run build:render`
- Start: `pnpm run start:render`
- Health check: `/api/healthz`
- Env: `NODE_ENV=production`, `SERVE_WEB=true`, `PIN_ONLY=true`,
  `DATABASE_URL` nga Neon, `SESSION_SECRET` i rastësishëm me të paktën 32 karaktere.
- Mos vendos `PORT`: Render e cakton vetë. Mos vendos çelësa Clerk apo Replit.
- Mos shto `corepack enable`: ai përpiqet të ndryshojë skedarë sistemi që
  Render i mban vetëm për lexim. Komanda përdor `pnpm` ekzistues.

Nisja krijon tabelat vetëm në Neon dhe vetëm në një databazë të re pa tabela
`math_*`. Ndryshimet ruhen në një transaksion. Rinisjet nuk e fshijnë progresin.
Mospërputhjet ndalojnë nisjen, në vend që të mbishkruajnë të dhënat.
Për ndryshime të ardhshme skeme, shto migrime të reja SQL të numëruara;
mos ndrysho migrimin e aplikuar dhe mos përdor `push-force` në databazën reale.

## 4. Provo para se t'ua japësh fëmijëve

- Hap adresën HTTPS që jep Render. Mos përdor adresën e zhvillimit Replit.
- Regjistro një profil prove pa të dhëna reale, dil dhe hyr sërish me PIN.
- Provo një mësim, rifresko faqen dhe kontrollo progresin.
- Ndërro gjuhët, provo nga telefoni dhe hape direkt `/profili`.
- Provo fshirjen e profilit të provës me PIN.
- Kontrollo që një tjetër përdorues nuk sheh emrin, moshën apo të dhënat private.

## Profilet që ekzistojnë këtu

**Paketa përmban kod, jo profile apo progres.** Mos e fshi databazën e vjetër
dhe mos e anulo shërbimin e vjetër para se të vendosësh çfarë do të ndodhë me to.
Transferimi i të dhënave ekzistuese është hap më vete, me kopje rezervë dhe
miratim. Për të ruajtur PIN-et duhet edhe i njëjti `SESSION_SECRET`; një vlerë
e re nuk i verifikon hash-et e vjetra. Mos e vendos këtë sekret në arkiv ose chat.
Profilet e vjetra vetëm me email duhet të vendosin PIN në faqen e vjetër përpara
një transferimi të ardhshëm. Seancat aktive nuk duhen transferuar.

## Kufijtë falas

- Render Free ndalon pas 15 minutash pa vizitorë; hapja pasuese mund të marrë
  rreth një minutë. Ka kufij mujorë orësh, trafiku dhe ndërtimesh.
- Neon Free ka kufij ruajtjeje, trafiku dhe përpunimi. Arritja e kufijve mund
  të ndalojë përkohësisht shërbimin. Këto kufizime nuk janë backup.
- Mos aktivizo automatikisht plane me pagesë. Kontrollo përdorimin në të dy
  llogaritë dhe mbaj kopje rezervë të sigurta jashtë depos së kodit.
- Nuk garantohet funksionim pa ndërprerje, pa kufij, apo falas përgjithmonë.
- Mos ruaj të dhëna në diskun lokal të Render; ai nuk është i përhershëm.

Burime: https://render.com/docs/free · https://render.com/docs/blueprint-spec ·
https://neon.com/faqs/free-plan-limits-and-quotas
