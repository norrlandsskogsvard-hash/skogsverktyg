# Skotselkollen: bonitering och SI som faltstod

## Syfte

Detta steg lagger in bonitering och standortsindex som faltmetod, metodbegransning och osakerhetsstod i Skotselkollen. Stodet ska hjalpa anvandaren att forsta nar ett manuellt SI-varde ar rimligt att anvanda som underlag och nar gallringsjamforelsen bor betraktas som osakrare.

Stodet aktiverar inte auto-SI, digitaliserar inte hojdutvecklingskurvor och skapar inte nya harda gransvarden.

## Kallor

- `bonitering-ac`: Bonitering AC, falt_hafte for Vasterbottens lan.
- `bonitering-bd`: Bonitering BD, falt_hafte for Norrbottens lan.
- `b69-si-internlankar-tabeller`: B69 SI, diagram- och tabellunderlag.

AC- och BD-hafterna beskriver praktisk bonitering med hojdutvecklingskurvor, interceptmetoden, standortsegenskaper och byte av bonitetsvisande tradslag. B69-kallan behandlas i detta steg som diagram-/tabellkalla utan inlagda diagramvarden.

## Inlagt stod

`data/site-index-field-rules.json` innehaller 12 granskade regler for:

- nar hojdutvecklingskurvor kan anvandas som faltmetod,
- vilka bestandkrav som ska kontrolleras innan SI anvands,
- krav pa ovrehojdstrad och definition av ovre hojd,
- interceptmetoden for yngre tall- och granbestand,
- art- och regionomfang for tall, gran, vartbjork och contorta,
- hur osakra, avvikande eller heterogena bestand ska markeras,
- att AC/BD/B69 ar stodkallor, inte aktiverade appkurvor.

## Appbeteende

Skotselkollen anvander SI-stodet for att lagga till kontrollpunkter, kallanteckningar och osakerhetsflaggor. Om SI saknas sanks sakerheten och anvandaren far en faltkontroll om manuell bonitering. Om SI ar manuellt visas det som underlag som ska kontrolleras mot faltmetod och regional kalla.

For bjork/lov betonas att tall- eller granbaserade SI- och gallringsmallar inte ar facit. Lovsparet vags fortsatt mot det separata bjork/lov-stodet.

## Sparrar

Detta steg far inte:

- rakna ut SI automatiskt,
- digitalisera eller aktivera hojdutvecklingskurvor,
- lagga in diagramvarden fran AC, BD eller B69,
- skapa nya gallringskurvor,
- gora juridiska beslut,
- andra priser eller rojnings-/gallringskalkylernas ekonomiska logik,
- gora andra Norra-mallar aktiva an T20-piloten.

Sparrarna valideras av `scripts/validate-site-index-field-rules.mjs`.

## Senare arbete

Auto-SI kan bara bli aktuellt i ett separat steg med verifierade tabeller eller kurvor, tydlig datamodell, testfall och manuellt aktiveringsprotokoll. Diagramdigitalisering fran AC/BD/B69 ska behandlas som ett eget granskningsarbete och far inte smyga in via detta faltstod.
