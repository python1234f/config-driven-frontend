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