from pathlib import Path

# ====== MULTILINE STRING (WKLEJ CAŁOŚĆ TUTAJ) ======
tekst = AGENT_BOOTSTRAP_BUNDLE = r"""
===============================
PROMPT STARTOWY DO CODEXA (PL) 🤖🧠
===============================

Jesteś agentem developerskim w IntelliJ. Zbootstrappuj projekt frontendowy React (JS, bez TypeScript na start).
Cel: małe demo architektury modularnego frontendu dla przemysłu (rafinerie ropy/gazu).
Nie budujemy produktu. Budujemy koncepcyjny proof, że frontend jest client-agnostic i konfigurowalny między klientami bez forka kodu.

Kontekst domeny:
- System AI analizuje dane z czujników (ciśnienie, temperatura, przepływ, poziomy, trendy) i generuje decyzje/alerty.
- Operator nie patrzy w UI non-stop. UI służy do wyjaśnienia decyzji AI (explainability), audytu i post-mortem.
- Klienci różnią się instalacjami, namingiem sygnałów, modelami alarmów, SLA/compliance -> frontend ma być wspólny, tylko config inny.

Wymagania architektury:
1) Konfigurowalność między klientami: zmiana klienta = zmiana ClientConfig (plik JS), bez ifów typu `if (client === ...)`.
2) Feature gating: komponent FeatureGate renderuje feature’y na podstawie capabilities z configu. Zero ifów per klient w UI.
3) Domain adapters: adapter mapuje surowe eventy klienta do `NormalizedDecision` (kontrakt domenowy). UI zna tylko normalizowany kontrakt.
4) Graceful degradation: obsłuż brak danych, stale data, low confidence (UI ma być „boring but honest”).
5) Debug-first: dodaj dużo console.log (spójne prefixy). Loguj config, features, normalizedDecision, przepływ danych.
6) JS-first: brak TypeScript teraz. Używaj JSDoc w /domain żeby było TS-ready później.

Zbuduj:
- Układ: lewa kolumna „Client Config Panel” (dropdowny + minimalny JSON view) + przycisk „Simulate client” (losuje poprawny config),
  prawa kolumna „Decision Inspector”: lista decyzji (Decision History) + panel szczegółów decyzji (Decision Details).
- Dwa przykładowe klient-configi (clientA i clientB) różniące się: units, alarmModel, features (np. aiConfidence on/off, decisionHistory on/off).
- Przykładowe dane decyzji (mock) per klient, przechodzące przez adapter do NormalizedDecision.

Pliki/artefakty:
- Dodaj `agent.md` (instrukcje pracy), `FEATURE_LOG.md` (co jest zaimplementowane), `AGENT_NOTES.md` (edytowane ręcznie przeze mnie, masz czytać).
- Po każdej większej iteracji aktualizuj FEATURE_LOG.md i wypisz krótkie „Agent status” w markdown (co działa / co nie / next step).

Nie dodawaj backendu, auth, persistence. Nie rób overengineeringu. Jeden ekran, jeden flow.
Najpierw działający demo + logi. Dopiero później kosmetyka.


===========================
agent.md 🤖⚙️ (WRZUĆ DO REPO)
===========================

# agent.md 🤖⚙️ — instrukcje dla agenta Codex (JS-first, debug-first)

## 🧠 Cel demo
Budujemy **małe demo architektury** frontendu dla **industrial AI** (rafinerie ropy/gazu) 🏭🛢️🤖

✅ Pokazujemy:
- modularność między klientami (bez forka kodu)
- client-agnostic UI
- explainability decyzji AI
- FeatureGate (capabilities-based, bez ifów per klient)
- adaptery domenowe (raw → NormalizedDecision)
- graceful degradation (stale/missing/low confidence)

❌ Nie budujemy:
- produkcyjnego systemu
- backendu/auth
- dopracowanego design systemu
- 10 ekranów

## 🏭 Kontekst biznesowy (z oferty)
System AI:
- analizuje dane z czujników 📡 (ciśnienie 💨, temperatura 🌡️, przepływ 🌊, poziomy 🛢️, trendy 📈)
- generuje decyzje/alerty (anomalia, predykcja, rekomendacja)
- operator nie patrzy w UI non-stop — UI służy do zrozumienia decyzji i audytu

Frontend jest trust & explainability layer, nie „SCADA do gapienia się”.

## 🧪 Stack / podejście
- React + JavaScript ✅
- TypeScript ❌ (dodamy później)
- JSDoc ✅ (żeby TS-ready)
- debug prints ✅ (bardzo dużo)
- minimalne biblioteki UI opcjonalnie ✅

## 🧭 Zasady pracy (najważniejsze)
1) Jedna iteracja = jeden feature 🧩
2) Debug-first 🐞: loguj config, features, decyzje, przepływ danych
3) Bez ifów per klient 🚫: zero `if (client === ...)`
4) Kontrakt domenowy 📜: UI konsumuje tylko `NormalizedDecision`
5) Po każdej iteracji: aktualizuj `FEATURE_LOG.md` + dopisz „Agent status”

## 📂 Struktura katalogów (trzymać się!)
/domain        → kontrakty domenowe (JS + JSDoc)
/adapters      → normalizacja danych per klient
/features      → FeatureGate + context/features
/ui            → komponenty UI
/config        → definicje klientów
/mock          → mock raw events/decisions

## 🐞 Debug logging (wymagane)
Prefixy:
[BOOT] [CONFIG] [FEATURES] [ADAPTER] [DOMAIN] [UI] [DECISION]

Przykłady:
console.log('[CONFIG]', activeClientId, config)
console.log('[FEATURES]', features)
console.log('[ADAPTER]', 'raw->normalized', rawEvent, normalizedDecision)
console.log('[DECISION]', normalizedDecision.id, normalizedDecision)

## 🚦 FeatureGate (kluczowy koncept)
FeatureGate nie zna klienta. Wie tylko, czy capability jest dostępna.

Kontrakt features (z ClientConfig):
// /domain/clientConfig.js
/**
 * @typedef {Object} ClientConfig
 * @property {string} id
 * @property {Object} features
 * @property {boolean} features.aiConfidence
 * @property {boolean} features.decisionHistory
 * @property {boolean} features.operatorFeedback
 */

Feature context + hook:
// /features/FeatureContext.js
import React from 'react'
export const FeatureContext = React.createContext({})
export function useFeatures() { return React.useContext(FeatureContext) }

FeatureGate komponent:
// /features/FeatureGate.jsx
import React from 'react'
import { useFeatures } from './FeatureContext'
export function FeatureGate({ name, children }) {
  const features = useFeatures()
  const enabled = !!features?.[name]
  console.log('[FEATURES]', `FeatureGate(${name})`, enabled)
  if (!enabled) return null
  return <>{children}</>
}

Użycie:
<FeatureGate name="aiConfidence">
  <ConfidenceBadge value={decision.confidence} />
</FeatureGate>

## 🧩 Adaptery domenowe (raw → NormalizedDecision)
UI nie zna formatów klientów. UI zna tylko `NormalizedDecision`.

NormalizedDecision (JSDoc):
// /domain/normalizedDecision.js
/**
 * @typedef {Object} NormalizedDecision
 * @property {string} id
 * @property {string} type        // np. "PressureAnomaly"
 * @property {number} confidence  // 0..1
 * @property {string} timestamp   // ISO
 * @property {Object} window      // { minutes: number }
 * @property {Array<{name:string, trend:string, value?:number, unit?:string}>} signals
 * @property {Object} meta        // { clientId, unitId, freshnessSec, reason }
 */

Adapter (przykład):
// /adapters/decisionAdapter.js
export function adaptRawDecision(raw, clientConfig) {
  console.log('[ADAPTER]', 'adaptRawDecision input', raw, clientConfig?.id)
  const signals = (raw.signals || []).map(s => ({
    name: s.displayName || s.name,
    trend: s.trend || 'unknown',
    value: s.value,
    unit: s.unit,
  }))
  const normalized = {
    id: raw.id || `${clientConfig.id}-${Date.now()}`,
    type: raw.type || 'UnknownDecision',
    confidence: typeof raw.confidence === 'number' ? raw.confidence : 0,
    timestamp: raw.timestamp || new Date().toISOString(),
    window: raw.window || { minutes: 15 },
    signals,
    meta: {
      clientId: clientConfig.id,
      unitId: raw.unitId || 'unit-unknown',
      freshnessSec: raw.freshnessSec ?? null,
      reason: raw.reason || 'n/a',
    },
  }
  console.log('[ADAPTER]', 'adaptRawDecision output', normalized)
  return normalized
}

## 🖥️ UI: Decision Inspector (jeden ekran)
Układ:
- lewa kolumna: Client Config Panel 🧾 + “Simulate client” 🎲
- prawa kolumna: Decision Inspector 🔍
  - DecisionHistoryList 📜
  - DecisionDetailsPanel 🧠

Graceful degradation:
- stale data → badge „STALE”
- missing signals → „No signals”
- low confidence → „Low confidence” + zachowawcze renderowanie

## 🧾 Client Config Panel (edytowalne)
Ma umożliwić:
- wybór klienta (dropdown)
- togglowanie features (checkboxy)
- podgląd configu (JSON)

Opcjonalnie:
- „Simulate client” (losuje poprawny config) 🎲
  Nazwa: Simulate client (nie “Shuffle lol”)

## 📋 Feature Log (obowiązkowo)
Agent aktualizuje `FEATURE_LOG.md` po każdej iteracji.

Szablon:
## ✅ Implemented
- …

## 🚧 In progress
- …

## ❌ Not implemented
- …

## ✍️ Twoje instrukcje (override)
Plik `AGENT_NOTES.md` edytuje człowiek.
Agent ma go czytać na początku każdej iteracji i traktować jako nadrzędne polecenia.

## 🧾 Agent status (po każdej iteracji)
- What works ✅
- What is partial 🚧
- What is missing ❌
- Next step ▶️

## ⏭️ TypeScript później
Teraz JS-first.
Kod ma być TS-ready przez:
- JSDoc kontrakty w /domain
- klarowne granice modułów

## 🏁 Definicja sukcesu
- zmiana klienta = zmiana configu 🧾
- FeatureGate działa 🚦
- adapter działa 🧩
- Decision history + details działają 🔍
- logi pokazują przepływ danych 🐞


===================
FEATURE_LOG.md 📋
===================

## ✅ Implemented
- Project bootstrapped (React)
- ClientConfig loader
- FeatureGate + FeatureContext
- Decision Inspector layout

## 🚧 In progress
- DecisionHistoryList
- DecisionDetailsPanel

## ❌ Not implemented
- Operator feedback
- TS migration
- Cypress tests


===================
AGENT_NOTES.md ✍️
===================

## Owner overrides
- Na razie skup się tylko na: FeatureGate + config panel + 2 klientów + decision adapter + history/details.
- Nie dodawaj nowych feature’ów bez polecenia.
- Zostaw dużo console.log.


========================================
BROWSER AUTOMATION / CYPRESS — STRATEGIA 🧪🌐
========================================

- Nie polegamy na tym, że agent przejmie kontrolę nad przeglądarką (to bywa niepewne zależnie od integracji).
- Iteracje 1–2: ręczne klikanie + console.log (najkrótsza pętla feedbacku).
- Iteracja 3: Cypress smoke tests (2–3 testy max) jeśli chcemy powtarzalność i logi:
  1) przełącz klienta -> zmieniają się features -> UI nie pęka
  2) simulate client -> UI nadal działa
  3) low confidence / missing signals -> graceful degradation


===============================
ITERATION 1 (OPCJONALNE PO agent.md) 🚀
===============================

ITERATION 1:
- Zbootstrapuj React app (JS)
- Dodaj strukturę katalogów /domain /adapters /features /ui /config /mock
- Utwórz 2 configi klientów (clientA, clientB) różniące się features i alarmModel
- Utwórz FeatureContext + FeatureGate (z logami)
- Utwórz mock raw decisions dla obu klientów i adapter raw->NormalizedDecision (z logami)
- Zrób UI layout: lewa kolumna Config Panel (dropdown+checkboxy+JSON) + prawa kolumna Decision Inspector (lista + details placeholder)
- Wygeneruj agent.md, FEATURE_LOG.md, AGENT_NOTES.md
- Zaktualizuj FEATURE_LOG.md i wypisz Agent status
"""

# ==================================================

OUTPUT_FILES = {
    "PROMPT_CODEX.txt": "PROMPT STARTOWY DO CODEXA",
    "agent.md": "agent.md",
    "FEATURE_LOG.md": "FEATURE_LOG.md",
    "AGENT_NOTES.md": "AGENT_NOTES.md",
}


def split_sections(text: str):
    sections = {}
    current_key = None
    buffer = []

    for line in text.splitlines():
        stripped = line.strip()

        # wykrywanie separatorów sekcji
        for filename, marker in OUTPUT_FILES.items():
            if marker in stripped:
                if current_key and buffer:
                    sections[current_key] = "\n".join(buffer).strip()
                current_key = filename
                buffer = []
                break
        else:
            if current_key:
                buffer.append(line)

    if current_key and buffer:
        sections[current_key] = "\n".join(buffer).strip()

    return sections


def write_files(sections):
    for filename, content in sections.items():
        Path(filename).write_text(content, encoding="utf-8")
        print(f"[OK] zapisano {filename} ({len(content.splitlines())} linii)")


if __name__ == "__main__":
    sections = split_sections(tekst)

    if not sections:
        raise RuntimeError("Nie znaleziono żadnych sekcji – sprawdź markery.")

    write_files(sections)

    print("\nGotowe ✅")
    print("Możesz teraz:")
    print("- otworzyć PROMPT_CODEX.txt i wkleić do Codexa")
    print("- edytować agent.md / AGENT_NOTES.md")
    print("- commitować FEATURE_LOG.md")
