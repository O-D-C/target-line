# Target Line – Foundry VTT Modul

Zeigt eine **leuchtend blaue, animierte Strichlinie** vom kontrollierten Token zum anvisierten Ziel-Token.

## Features

- Blaue Doppellinie: breiter Glow-Kanal + schmaler Kern
- Animierter Lauflicht-Effekt (Dashes wandern zur Ziel-Richtung)
- Pulsierender Endpunkt-Kreis am Ziel
- Unterstützt **mehrere Ziele** gleichzeitig
- Verschwindet automatisch, wenn kein Token kontrolliert oder kein Ziel gesetzt ist

## Installation

1. Den Ordner `target-line` in `Data/modules/` kopieren.
2. In Foundry VTT unter **Add-on-Module** → **Module verwalten** das Modul aktivieren.

## Anpassung

Die visuellen Parameter können direkt oben im Script (`scripts/target-line.mjs`) im `CONFIG`-Objekt geändert werden:

| Eigenschaft    | Standard   | Beschreibung                          |
|----------------|-----------|---------------------------------------|
| `lineColor`    | `0x00aaff` | Farbe der Kernlinie (Hex)             |
| `lineAlpha`    | `0.85`     | Deckkraft der Kernlinie               |
| `lineWidth`    | `2`        | Breite der Kernlinie                  |
| `glowColor`    | `0x55ccff` | Farbe des Glow-Kanals                 |
| `glowAlpha`    | `0.35`     | Deckkraft des Glow-Kanals             |
| `glowWidth`    | `8`        | Breite des Glow-Kanals                |
| `pulseSpeed`   | `0.04`     | Pulsgeschwindigkeit der Endpunkte     |
| `dashLength`   | `24`       | Länge eines Dash-Segments (px)        |
| `gapLength`    | `10`       | Lücke zwischen Segmenten (px)         |
| `animateOffset`| `true`     | Lauflicht-Effekt an/aus               |
| `offsetSpeed`  | `2`        | Geschwindigkeit des Lauflichts (px/Frame) |

## Kompatibilität

- Foundry VTT v11+
- Foundry VTT v12 (verifiziert)
