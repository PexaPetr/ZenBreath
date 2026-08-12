# ZenBreath — Product Requirements Document (PRD)

| Pole | Hodnota |
|------|---------|
| Verze dokumentu | 1.0 |
| Stav | **NÁVRH — k potvrzení** |
| Produkt | ZenBreath (vývojová linie ve složce `ZenBreath_App`) |
| Související legacy | `../ZenBreath` — existující Vite/React implementace jako reference |

Po schválení změňte v tabulce výše **Stav** na `SCHVÁLENO` a doplňte řádek níže.

| Role | Jméno | Datum | Podpis / poznámka |
|------|-------|-------|-------------------|
| Produkt / vlastník | | | |
| Vývoj | | | |

---

## 1. Vize a problém

**Vize:** Pomoci uživateli zklidnit se před spánkem jednoduchým, hlasem vedeným dýcháním 4–7–8 v češtině i angličtině.

**Problém:** Uživatel potřebuje strukturované tempo a minimální kognitivní zátěž; vizuální a audio vodítko snižuje nutnost sledovat čas.

---

## 2. Cílová skupina a scénáře

- Dospělí uživatelé ve večerním režimu, mobil i desktop.

**Primární scénář:** výběr jazyka → nastavení délky cvičení (1–20 min) → start → opakování cyklů až do vypršení času → okamžitý návrat do klidového stavu bez outra.

**Sekundární scénáře:** předčasné ukončení uživatelem; změna jazyka před startem (znovu načíst hlasy).

---

## 3. Funkční požadavky

| ID | Požadavek | Priorita |
|----|-----------|----------|
| F1 | Přehrát sekvenci fází INHALE → HOLD → EXHALE v souladu s délkou audio bufferu (TTS nebo ekvivalent) | Must |
| F2 | Odpočet celkového času session a zobrazení čísla cyklu | Must |
| F3 | Jazyk EN/CS včetně textů TTS a UI | Must |
| F4 | Ukončení session uživatelem bez zaseknutí audia a časovačů | Must |
| F5 | Při platné konfiguraci API načíst hlasy; při chybě srozumitelná zpětná vazba (ne nekonečný loading) | Must |
| F6 | Vizuální synchronizace s průběhem fáze (kruh, indikátor průběhu) | Should |
| F7 | Ve veřejné produkci neskladovat tajný klíč v klientském bundlu (proxy nebo ekvivalent) | Should |
| F8 | Základ přístupnosti: klávesnice, částečná podpora čteček obrazovky | Should |
| F9 | Režim bez TTS (tichý / pevné časování 4–7–8) jako fallback | Could |
| F10 | PWA (instalace na plochu) | Could |

---

## 4. Nefunkční požadavky

- **Výkon:** běžné interakce UI bez znatelného zpoždění; audio inicializace v souladu s pravidly prohlížeče (user gesture kde je potřeba).
- **Spolehlivost:** po chybě API nesmí aplikace zůstat v nekonečném načítání.
- **Bezpečnost:** žádný commit skutečných API klíčů; rizika klientského klíče dokumentovat pro provozovatele.
- **Kompatibilita:** moderní prohlížeče s Web Audio API; Node.js 20+ pro toolchain buildu.

---

## 5. Metriky úspěchu (návrh)

- Poměr dokončených session k návštěvám, průměrná délka session.
- Volitelně anonymizovaná míra chyb TTS / API.

---

## 6. Mimo rozsah (verze 1 produktu dle tohoto PRD)

- Uživatelské účty a přihlášení.
- Ukládání historie na server.
- Sociální sdílení.
- Více než jedna dýchací technika v první verzi (zůstává 4–7–8).

---

## 7. Minimální životaschopný produkt (MLP)

Splnění všech **Must** požadavků (F1–F5) s použitelným UI na jedné hlavní obrazovce a možností nasadit na zvolený statický hosting s dokumentovaným nastavením proměnných prostředí.

---

*Tento PRD vychází z analýzy projektu ZenBreath a konsolidovaného plánu vývoje. Úpravy verze 1.1 zapisujte changelogem na konci souboru nebo v git historii.*

### Changelog

- **1.0** — počáteční návrh PRD pro složku `ZenBreath_App`.
