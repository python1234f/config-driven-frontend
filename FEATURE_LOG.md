===================

## ✅ Implemented
- Project bootstrapped (React + Vite, JS-first)
- ClientConfig loader (clientA/clientB) + Simulate client
- FeatureGate + FeatureContext (capabilities-based, z logami)
- Domain adapters (clientA/clientB raw → NormalizedDecision)
- Mock raw decisions per klient
- UI: Client Config Panel (dropdown + checkboxy + JSON view)
- UI: Decision Inspector (DecisionHistoryList + DecisionDetailsPanel)
- Graceful degradation: NO SIGNALS + STALE + low confidence (gated)

## 🚧 In progress
- —

## ❌ Not implemented
- Operator feedback
- TS migration
- Cypress tests

## Agent status
- What works ✅: przełączanie klienta zmienia config/features + normalizację danych; FeatureGate ukrywa/pokazuje sekcje; lista decyzji i szczegóły działają; dużo logów `[CONFIG]/[FEATURES]/[ADAPTER]/[DECISION]`.
- What is partial 🚧: UI jest celowo minimalistyczny; brak filtrowania/sortowania historii.
- What is missing ❌: operator feedback; TS; Cypress.
- Next step ▶️: (opcjonalnie) dopracować „boring but honest” komunikaty dla missing/stale/low-confidence w Details + dodać 2–3 smoke testy Cypress w Iteration 3.


===================
