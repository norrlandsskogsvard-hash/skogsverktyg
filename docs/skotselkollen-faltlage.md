# Skotselkollen: faltlage

## Syfte

Faltlage gor Skotselkollen snabbare att anvanda pa mobil ute i skogen. Fokus ar snabb inmatning, tydlig status, risk-/hansynssnabbval, faltanteckning, lokalt sparade bedomningar och enkel atkomst till faltprotokoll.

## Sa anvands faltlage

Faltlage visas direkt i Skotselkollen. De viktigaste faltvarden ligger forst: tradslag, region, hojd, grundyta, alder, stamantal, DGV och manuell SI. Snabbvalen for risk/hansyn fyller bara i befintliga falt och triggar befintliga kontrollflaggor.

## Lokal sparning

Knappen `Spara faltbedomning` sparar bedomningen i localStorage pa den aktuella enheten. Sparningen innehaller datum/tid, objektnamn/yta, huvudtradslag, samlad bedomning, sakerhet, hansyn/risk, juridikstatus, input, resultat och faltanteckningar.

Listan `Sparade faltbedomningar` visar de senaste lokala bedomningarna. De kan oppnas, tas bort eller rensas lokalt. Ingen data skickas till kundarkiv eller offert.

## Offline och status

Skotselkollen visar enkel status for online/offline, lokalt utkast och senast sparad bedomning. Draft och sparade bedomningar ligger lokalt och fungerar utan extern tjanst.

## Faltanteckning och position

Faltanteckningen kan innehalla objektnamn/yta, platsbeskrivning, fri anteckning och koordinater. Knappen `Hamta position` anvander webblasaren geolocation om anvandaren tillater det. Om position nekas eller saknas kan plats skrivas manuellt.

## Faltprotokoll

Faltprotokollet tar med objektnamn/yta, platsbeskrivning, koordinater, faltanteckning och sparad tid tillsammans med befintlig Skotselkollen-bedomning.

## Begransningar

Faltlage gor inte:

- offertkoppling,
- kundarkivkoppling,
- juridiskt beslut,
- nya gallrings- eller SI-kurvor,
- diagramdigitalisering,
- prisandringar,
- harda produktionsgransvarden.
