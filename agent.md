===============================

ITERATION 1:
- Zbootstrapuj React app (JS)
- Dodaj strukturę katalogów /domain /adapters /features /ui /config /mock
- Utwórz 2 configi klientów (clientA, clientB) różniące się features i alarmModel
- Utwórz FeatureContext + FeatureGate (z logami)
- Utwórz mock raw decisions dla obu klientów i adapter raw->NormalizedDecision (z logami)
- Zrób UI layout: lewa kolumna Config Panel (dropdown+checkboxy+JSON) + prawa kolumna Decision Inspector (lista + details placeholder)