# Currentline

Currentline is a scroll-led journey from **Eleven Mile Solar Center** in Pinal County, Arizona, to **Meta’s Mesa Data Center** and the processor inside a representative server. Scroll to fly between real aerial locations and follow the illustrated power path through connected equipment. Drag the view to look around. Open **How it works** to separate the parts in place and see each part’s position in the circuit.

![Currentline’s aerial opening above central Arizona](docs/currentline.webp)

## Run locally

Use Node.js 22 LTS or newer. The build was also verified on Node.js 20.18.0.

```sh
git clone https://github.com/iss24k/currentline.git
cd currentline
npm ci
npm run dev
```

Open the loopback URL Vite prints, usually `http://127.0.0.1:5173`. The app bundles its imagery, terrain, models, and fonts locally and needs no account, API key, or backend. WebGL 2 enables terrain relief and 3D equipment. On devices without it, the aerial photographs and diagrams use a 2D view. The journey follows the operating system’s reduced-motion preference. The aerial view supports drag or arrow keys. Home resets the aerial view when it has focus.

**Compare other generation sources** in the footer opens the separate field guide, which covers natural gas, nuclear, solar, wind and hydroelectric generation, including the utility, battery and generator modes.

## What the aerial flight shows

SRP, Ørsted and Meta documented the relationship between the Eleven Mile project and Meta’s Arizona data center. The site close-ups use 2025 USDA aerial imagery. The regional view uses 2023 imagery, with 6,144 × 4,096 pixels of regional coverage and 4,800 × 3,200 site textures. The camera flies over public USGS elevation data. [SRP project announcement](https://media.srpnet.com/meta-teams-up-with-srp-and-rsted-to-support-data-center-with-clean-energy-from-new-solar-and-battery--project/) · [Imagery credits and geographic evidence](docs/atlas-sources.md)

- **Eleven Mile.** First Solar thin-film panels make DC. Inverters produce AC. The site’s collection and step-up equipment takes it to 230 kV for the connection to Pinal Central Substation. The short highlighted route is an approximate alignment from Ørsted’s public siting plan. [Interconnection filing](https://cdn.orsted.com/-/media/www/docs/corp/eleven-mile-transmission/eleven-mile-solar-transmission-application.pdf)
- **Shared grid.** The dotted line follows the camera between the sites, which are about 54 km apart in a straight line. Electrical power mixes across the interconnected network and flows along many available paths. Glowing beads in equipment models visualize energy transfer. [EIA electricity delivery overview](https://www.eia.gov/energyexplained/electricity/delivery-to-consumers.php)
- **Mesa.** SRP’s Project Huckleberry connects the regional grid to the Prickly Pear substation serving the campus with a half-mile 230 kV line. The exterior is real, and the equipment scenes use a representative design. [SRP Project Huckleberry](https://www.srpnet.com/grid-water-management/grid-management/improvement-projects/project-huckleberry)

## Connected equipment

The 3D tour starts with a detailed thin-film panel row and follows DC to a central inverter. A separate pad transformer sends 34.5 kV AC through the collection circuit to the main 230 kV transformer. The representative 3D stages shorten physical distances so cables and handoffs stay visible. The moving light illustrates energy transfer. A dashed cyan trace represents the magnetic field between electrically isolated transformer windings.

The original solar equipment models reference First Solar’s Series 6 mechanical drawings, SMA’s Sunny Central enclosure and terminal layout, and Hitachi Energy’s description of core-type transformer windings. The site’s installed equipment models are unverified. [First Solar user guide](https://www.firstsolar.com/-/media/First-Solar/Technical-Documents/User-Guides/Series-6-User-Guide.pdf) · [SMA product data](https://files.sma.de/downloads/SCXXXXUP-US-DS-en-27.pdf) · [Hitachi Energy core-type transformers](https://www.hitachienergy.com/ca/en/products-and-solutions/transformers/power-transformers/generator-step-up-transformers-gsu/core-type-transformers)

## Representative interior

A typical U.S. AC path provides the teaching example. Facility layouts, backup schemes, voltages and hardware vary.

- **Intake and backup.** Utility AC passes through switchgear and a building transformer to 480 V AC. The transfer switch selects utility or generator power. An online UPS rectifies AC to DC, then makes clean AC. The battery temporarily feeds the DC link while standby generation starts.
- **Rack and server.** The floor distribution transformer lowers voltage to 208 V AC. Busway, rack outlets and cords feed the server. The server supply makes 12 V DC, and a board regulator lowers it to about 1 V DC in the reference example.
- **Processor.** Transistors use electrical energy to process data. Almost all of the energy drawn by the chip leaves as heat. The journey ends at the heat spreader.

**Sources and imagery credits** at the end of the journey lists the component references. Chapter details link to manufacturers’ examples where documented. The geometry is educational, and illustrated catalog examples do not establish the inventory installed at either site. [DOE data center design guide](https://www.energy.gov/sites/default/files/2024-07/best-practice-guide-data-center-design.pdf) · [Eaton UPS manual](https://www.eaton.com/content/dam/eaton/products/backup-power-ups-surge-it-power-distribution/backup-power-ups/eaton-93pm-ups/manuals/eaton-93pm-150-cap-4w-ups-P-164000515.pdf) · [Texas Instruments board regulator reference](https://www.ti.com/tool/PMP21872)

## Project structure

[Three.js](https://threejs.org/docs/pages/WebGLRenderer) handles the aerial camera and equipment lighting. [Vite](https://v6.vite.dev/guide/) builds two local static pages. Native scrolling and HTML controls keep the lessons accessible independently of the renderer.

| Files | Purpose |
| --- | --- |
| `src/main.js`, `src/atlas.css` | Scroll-led journey, captions, chapter index, bibliography |
| `src/atlas-data.js`, `public/atlas/` | Georeferenced photographs, relief, documented points |
| `src/atlas-camera.js`, `src/atlas-render.js` | Camera choreography, bounded pan and 2D fallback |
| `src/essential-components.js`, `src/atlas-diagrams.js` | Component records and visual power diagrams |
| `src/equipment-camera.js`, `src/equipment-scene.js` | Connected equipment scene, camera, and handoff cables |
| `src/equipment-flow.js`, `src/journey-power.js` | Illustrated energy paths and explanations of each conversion |
| `src/solar-equipment.js` | Detailed original panel, inverter and transformer geometry |
| `src/generation-models.js`, `src/infrastructure-models.js` | Original procedural equipment models |
| `src/field-guide.js`, `src/parts-*.js` | Five-source field guide and deeper parts records |

Field guide photography is credited in [travel sources](docs/travel-sources.md). Its compressor and processor photographs by [Wilfredor](https://commons.wikimedia.org/wiki/File:Axial_compressor_rotor_of_a_gas_turbine,_Deutsches_Museum.jpg) and [Fritzchens Fritz](https://commons.wikimedia.org/wiki/File:AMD_Epyc_7702_delidded.jpg) are CC0 1.0. The [ORNL Frontier photograph](https://commons.wikimedia.org/wiki/File:Frontier_supercomputer_(12).jpg) is CC BY 2.0. These are contextual references, distinct from the Arizona sites.

## Verify the build

```sh
npm test
npm run build
npm run preview -- --port 4173 --strictPort
```

With preview running, use another terminal to run the browser suites.

```sh
npx playwright install chromium
npm run test:browser
npm run test:field-guide
```

Set `CURRENTLINE_BROWSER=chrome` to use an installed Google Chrome. The atlas suite verifies the aerial textures, 4K rendering, scrolling, map pan, accessible controls, the inline diagrams and 37 component selections and reversible equipment handoffs. The field guide suite covers the five generation routes and backup power. Screenshots go to the ignored `test-results/` directory.
