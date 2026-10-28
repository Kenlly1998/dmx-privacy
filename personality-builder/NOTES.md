# Estudio: Avolites Personality Builder

## Ejecución (actualizado)

1. Usuario aportó `Personality Builder SetupV3.4.1.msi`.
2. Instalado en Wine (`~/.wine`) con `msiexec /i … /qn`.
3. App = .NET Framework 4.7.2 (VB.NET WinForms). Wine Mono **no** basta (crash al crear `PersWiz`).
4. Con **winetricks dotnet48** la app arranca: ventana `Fixture 1 * - Personality Builder`.
5. Abrir `.d4` por CLI funciona:  
   `wine "…\Personality Builder.exe" C:\users\ubuntu\Documents\Demo_RGBWash.d4`  
   → título `DemoCo RGB Wash Demo - Personality Builder`.
6. Interacción densa (doble clic / PropertyGrid) es inestable bajo Wine; capturas principales OK.

Ruta instalada:

`C:\Program Files (x86)\Avolites\Personality Builder\Personality Builder.exe`

Plantilla de catálogo:

`Templates\Standard.d4t` (XML: 73 Attribute, 11 Mode, macros/palettes).

## UI real (3.4.1)

Menú: File, Edit, View, Tools, Help.

Árbol: Fixture → History, Manual, Physical, Attributes, Modes, Macros, Palettes.

Attribute Pane tabs: Attributes, Functions, Created Attributes, Current Functions, History, Modes, Macros, Palettes, Swatch.

Properties Pane tabs: Properties, DMX Values, Channels, Wheel Mapping, Locate Values, Cells.

Fixture properties: Display Name, Manufacturer, Name, Personality Version, Tags, UpdateVersionOnDirty, AtlaBase, RDM.

Attribute mapping: Group, Maximum Resolution, Bank, Page, Wheel (+ Attribute ID / Name).

## Corpus `.d4` (personalities.avolites.com)

Fuente pública: [Avolites Personality Library](https://personalities.avolites.com/) — listados por fabricante + `ViewPersonality.aspx?FileID=…&source=true` (XML completo en textarea). La descarga directa `/PersonalityFiles/Downloads/d4/*.d4` responde **404**; el instalador Compact Titan (~604 MB) sigue disponible.

**No redistribuimos** personalities oficiales en el repo. Estudio local en `/tmp/avo-d4-study` + muestras Generic previas.

### Hallazgos (≈135 fixtures parseados)

| Elemento | Observación |
| --- | --- |
| Groups | C ≫ I ≫ E ≫ S ≫ G ≫ P ≫ B |
| Modes | 1–512 ch (mediana ~8); muchos fixtures con varios modos |
| `ChannelOffset` | `"1"` 8-bit, `"1,2"` 16-bit Pan/Tilt |
| `VirtualControl` | Dimmer sin offset; RGB llevan `VirtualControl="Dimmer"` (p.ej. Generic RGB 3 DMX) |
| `Condition` / `Else` | ColourFunc/GoboFunc: `If="'Colour1Func'==1"` + IDs de Function |
| `Cells` | `Master` + `Cell` con `X`/`Y`/`ChannelOffset`/`ModeLink` + `AttributeLink SourceId/TargetId` |
| Extras | Palettes (~70%), AtlaBase, Macros, Swatch/Thumbnail |

### Eurolite / “Stormi”

- **Eurolite Stormi**: no aparece en el catálogo Eurolite (366 fixtures). El `.d4` subido por el usuario era un stub vacío (`Fixture 1` / `Unknown`).
- Cercanos por nombre: **Art Wizard / STORMI 3000CC LED** (FileID 47198) — 14 attrs, 8 modes, 2 con cells (18/25 DMX); **Taurus / STORMI 5000CC**.
- Eurolite útiles para referencia: LED IP T-Bar 16 QCL, LED TMH-W375 (cells 25), TMH BSW-380 (Condition + Colour1Func/GoboFunc).

### Gaps de la réplica vs corpus real

1. Wizard **Condition** (ColourFunc / GoboFunc) — hoy solo aviso en linter.
2. Export/import completo de **AttributeLink**, **ModeLink** a modos-celda, **VirtualControl**.
3. Palettes / Macros / Swatch / AtlaBase.
4. Locate extendido (`PowerOn`, `Highlight`, `Lowlight`).

## Réplica

`catalog.json` deriva IDs/nombres/grupos/wheels observados (interop). No se redistribuye el MSI ni `Standard.d4t` ni `.d4` oficiales de Avolites.

Capturas en `/opt/cursor/artifacts/screenshots/`.
