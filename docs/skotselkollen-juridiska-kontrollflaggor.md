# Skötselkollen juridiska kontrollflaggor

## Syfte

De juridiska kontrollflaggorna hjälper Skötselkollen att visa när en åtgärd behöver kontrolleras mot aktuell lagtext, Skogsstyrelsens vägledning, kartunderlag eller myndighetskrav. De är kontrollstöd, inte juridiska besked.

## Källor

- Primär källa: Riksdagen/SFS, Skogsvårdslag (1979:429), `law-skogsvardslag-1979-429-riksdagen`.
- Vägledning: Skogsstyrelsen, Skogsvårdslagen i kortversion, `agency-skogsstyrelsen-skogsvardslagen`.

Onlinekällor används eftersom lagtext och myndighetsvägledning kan ändras. Därför ska juridiska uppdateringar alltid kontrollera aktuell onlineversion före ändring.

## Kontrollflaggor

| Flagga | När den används | Effekt |
| --- | --- | --- |
| Föryngrings-/slutavverkningskontroll | Slutavverkning eller föryngringsavverkning kan vara aktuell | `legal_check_required` |
| Återväxt/föryngring | Slutavverkning eller föryngringsavverkning kan vara aktuell | `regeneration_check_required` |
| Fjällnära skog | Fjällnära läge eller motsvarande markering | `permit_check_required` |
| Rennäring | Rennäring/renbetesområde är markerat eller osäkert | `legal_check_required` |
| Naturvärden/hänsyn | Naturvärden eller hänsyn är markerade/osäkra | `nature_check_required` |
| Kulturmiljö/fornminne | Kulturmiljö kan vara berörd | `cultural_heritage_check_required` |
| Markklass/specialfall | Markklass är osäker eller ej produktiv/specialfall | `land_class_check_required` |
| Gallring juridisk kontext | Gallring bedöms skogligt | `legal_context_notice` |
| Röjning juridisk kontext | Röjning bedöms skogsvårdande | `legal_context_notice` |
| Områdesskydd/okända restriktioner | Skydd, osäkerhet eller specialfall kan finnas | `legal_check_required` |

## Får påverka

- Juridisk statusrad: OK, kontroll rekommenderas eller kontroll krävs.
- Lista med juridiska kontrollflaggor.
- Samlad säkerhet genom försiktighet.
- Plantext och fältchecklistor med kontrollhänvisningar.

## Får inte påverka

- Aktivering av gallringskurvor.
- T20-värden.
- Skoglig rekommendation som juridiskt beslut.
- Hårda produktionsgränser.
- Besked om att en åtgärd är godkänd eller stoppad.

## Uppdateringsrutin

Inför juridiska ändringar ska Riksdagen/SFS och Skogsstyrelsens aktuella onlineversion kontrolleras. Regler med osäker paragraf eller osäker tillämpning ska märkas `reviewNeeded: true` och får inte blockera åtgärd.
