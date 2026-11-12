import '@fontsource-variable/instrument-sans';
import '@fontsource/ibm-plex-mono/latin-400.css';
import './atlas.css';
import { atlas as geography } from './atlas-data.js';
import { essentials } from './essential-components.js';
import { diagramMarkup, highlightDiagram } from './atlas-diagrams.js';

const components = Object.fromEntries(essentials.map((component) => [component.id, component]));
const journal = {
  agreement: ['SRP · Eleven Mile Solar Center and Meta', 'https://media.srpnet.com/meta-teams-up-with-srp-and-rsted-to-support-data-center-with-clean-energy-from-new-solar-and-battery--project/'],
  plant: ['SRP · Eleven Mile project commissioning', 'https://media.srpnet.com/rsted-and-srp-celebrate-commencement-of-largest-co-located-solar-and-battery-storage-project-on-salt-river-project-power-grid/'],
  storage: ['Sargent & Lundy · plant design and AC-coupled storage', 'https://www.sargentlundy.com/projects/eleven-mile-solar-center/'],
  mesa: ['SRP · Project Huckleberry', 'https://www.srpnet.com/grid-water-management/grid-management/improvement-projects/project-huckleberry'],
  imagery: ['USGS · National Agriculture Imagery Program', 'https://www.usgs.gov/centers/eros/science/usgs-eros-archive-aerial-photography-national-agriculture-imagery-program-naip'],
  relief: ['USGS · 3D Elevation Program', 'https://www.usgs.gov/3d-elevation-program'],
};

const distribution = {
  title: 'Power to the rack', model: 'floor-pdu', short: '480 V AC → 208 V AC',
  description: 'A floor transformer lowers the voltage. Breakers, metal bars and cables carry protected power to the outlets in each rack.',
  parts: [
    { name: 'Floor transformer', target: 'Isolation transformer', role: 'Lowers the AC voltage from 480 V to 208 V between phases in this example.' },
    { name: 'Breaker', target: 'Distribution section', role: 'Opens a circuit when it is carrying too much current.' },
    { name: 'Busway', model: 'busway', target: 'Busway rail', role: 'An enclosed run of metal conductors carries AC above or below the racks.' },
    { name: 'Rack outlets', model: 'rack-pdu', target: 'Protected outlet bank', role: 'Distribute AC to the cords plugged into the servers.' },
  ],
  sources: components.server.sources.slice(0, 2),
};

const chapters = [
  { id: 'start', group: 'Source', shot: 'atlas', title: 'From sunlight\nto silicon', place: 'Arizona, United States',
    description: 'Follow electricity from a solar field to the chip inside a data center.' },
  { id: 'eleven-mile', group: 'Source', shot: 'atlas', title: 'Eleven Mile Solar Center', place: 'Pinal County, Arizona',
    description: 'This solar field turns sunlight into electricity. Batteries beside the panels store some of that energy for later.',
    links: [journal.plant, journal.storage] },
  { id: 'solar', group: 'Source' },
  { id: 'inverter', group: 'Source' },
  { id: 'transformer', group: 'Source' },
  { id: 'grid', group: 'Grid', shot: 'atlas', title: 'Across the shared grid', place: 'Pinal County → Mesa',
    description: `Eleven Mile feeds Pinal Central. From there, power mixes with other sources across the grid. The two sites are ${Math.round(geography.distanceKm)} km apart as the crow flies.`,
    links: [journal.agreement, journal.mesa] },
  { id: 'mesa', group: 'Grid', shot: 'atlas', title: 'Mesa Data Center', place: 'Mesa, Arizona',
    description: 'A half-mile 230 kV line connects the regional grid to the campus’s Prickly Pear substation. The next chapters show a representative layout inside.',
    links: [journal.mesa] },
  { id: 'intake', group: 'Data center' },
  { id: 'ups', group: 'Data center' },
  { id: 'distribution', group: 'Data center', component: distribution },
  { id: 'server', group: 'Server' },
  { id: 'regulator', group: 'Server' },
  { id: 'chip', group: 'Server' },
].map((chapter) => {
  const component = chapter.component ?? components[chapter.id];
  return component
    ? { ...chapter, ...component, component, shot: 'equipment', place: chapter.group === 'Source' ? 'Solar plant equipment' : 'Representative data center' }
    : chapter;
});

const icon = {
  down: '<path d="M12 5v14m-5-5 5 5 5-5"/>',
  up: '<path d="M12 19V5m-5 5 5-5 5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  link: '<path d="M7 17 17 7M7 7h10v10"/>',
  cross: '<path d="m6 6 12 12M6 18 18 6"/>',
  move: '<path d="M4 12h16m-12-4-4 4 4 4m8-8 4 4-4 4"/>',
  menu: '<path d="M5 8h14M5 16h14"/>',
};
const glyph = (name) => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon[name]}</svg>`;
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const external = (label, url) => `<a href="${escape(url)}" target="_blank" rel="noreferrer">${escape(label)} ${glyph('link')}</a>`;

function componentDetails(chapter) {
  const partList = chapter.parts.map((part, index) =>
    `<button type="button" class="part-button" data-part="${index}" aria-pressed="false">${escape(part.name)}</button>`).join('');
  return `<details class="component-details">
    <summary>${glyph('plus')} How it works</summary>
    <div class="component-body">
      ${diagramMarkup(chapter.id)}
      <div class="part-list" aria-label="Parts of ${escape(chapter.title)}">${partList}</div>
      <p class="part-role" aria-live="polite"></p>
      ${chapter.example ? `<p class="equipment-example">${external(chapter.example.title, chapter.example.url)}<small>${escape(chapter.example.note)}</small></p>` : ''}
      <div class="source-links">${chapter.sources.map(({ label, url }) => external(label, url)).join('')}</div>
    </div>
  </details>`;
}

function chapterMarkup(chapter, index) {
  const heading = chapter.id === 'start' ? 'h1' : 'h2';
  const details = chapter.component ? componentDetails(chapter) : chapter.links ? `<details class="field-notes">
    <summary>${glyph('plus')} ${chapter.id === 'eleven-mile' ? 'Plant facts' : 'Sources'}</summary>
    ${chapter.id === 'eleven-mile' ? `<dl class="plant-facts"><div><dt>Rated solar power</dt><dd>300 MW</dd></div><div><dt>Rated battery energy</dt><dd>1,200 MWh</dd></div></dl>
      <p class="plant-note">Power is how fast energy moves. Energy is how much can be delivered or stored.</p>` : ''}
    <div class="source-links">${chapter.links.map(([label, url]) => external(label, url)).join('')}</div>
  </details>` : '';
  return `<section id="${chapter.id}" class="chapter chapter--${chapter.id} chapter--${chapter.shot}" aria-labelledby="title-${chapter.id}">
    <div class="caption">
      <p class="eyebrow">${escape(chapter.place)}</p>
      <${heading} id="title-${chapter.id}" tabindex="-1">${escape(chapter.title).replace('\n', '<br>')}</${heading}>
      <p class="chapter-description">${escape(chapter.description)}</p>
      ${chapter.short ? `<p class="conversion-label">${escape(chapter.short)}</p>` : ''}
      ${chapter.id === 'start' ? `<a class="begin" href="#eleven-mile">Begin the journey ${glyph('down')}</a>` : ''}
      ${details}
      ${index === chapters.length - 1 ? `<a class="restart" href="#start">Back to the start ${glyph('up')}</a>` : ''}
    </div>
  </section>`;
}

const sources = [...new Map([
  ...Object.values(journal),
  ...chapters.flatMap((chapter) => chapter.sources?.map(({ label, url }) => [label, url]) ?? []),
].map(([label, url]) => [url, [label, url]])).values()];

const chapterIndex = ['Source', 'Grid', 'Data center', 'Server'].map((group) =>
  `<div class="index-group"><h3>${group}</h3>${chapters.filter((chapter) => chapter.group === group && chapter.id !== 'start').map((chapter) =>
    `<a href="#${chapter.id}">${escape(chapter.title)} ${glyph('link')}</a>`).join('')}</div>`).join('');

const app = document.querySelector('#app');
app.innerHTML = `
  <header class="top-bar">
    <a href="#start" class="wordmark" aria-label="Currentline, back to the start"><span></span>Currentline</a>
    <button type="button" class="index-toggle" aria-haspopup="dialog">Chapters ${glyph('menu')}</button>
  </header>
  <main id="journey">
    <div class="film-stage" data-shot="atlas" aria-label="Journey visuals">
      <div id="atlas-viewport" class="atlas-viewport"></div>
      <div id="equipment-viewport" class="equipment-viewport" inert><div class="equipment-fallback" hidden></div></div>
      <div class="film-shade" aria-hidden="true"></div>
      <div class="map-evidence" aria-hidden="true"><span class="map-evidence-dot"></span><span id="map-evidence-label">Arizona</span></div>
      <div class="visual-caption" aria-hidden="true"><span id="visual-source"></span><span class="look-hint">${glyph('move')} <span>Drag to look</span></span></div>
      <div class="film-progress" aria-hidden="true"></div>
    </div>
    <div class="narrative">${chapters.map(chapterMarkup).join('')}</div>
    <footer class="credits">
      <div><span class="eyebrow">Currentline</span><h2>About this journey</h2></div>
      <div class="credits-copy">
        <p>Eleven Mile supports Meta’s Mesa campus through Salt River Project. The aerial flight shows their geographic relationship. Electricity from many sources mixes across the grid, and the dotted map line shows the camera route. Glowing beads in equipment models illustrate energy transfer. The equipment models and voltages inside the data center are representative examples.</p>
        <details class="bibliography"><summary>${glyph('plus')} Sources and imagery credits</summary>
          <p>${escape(geography.credits)}. Regional coverage from 2023 and site close-ups from 2025.</p>
          <div class="source-links">${sources.map(([label, url]) => external(label, url)).join('')}</div>
        </details>
        <a class="legacy-link" href="./field-guide.html">Compare other generation sources ${glyph('link')}</a>
      </div>
    </footer>
  </main>
  <dialog class="chapter-index" aria-labelledby="index-title">
    <div class="index-head"><h2 id="index-title">Chapters</h2><button type="button" class="index-close" aria-label="Close chapters">${glyph('cross')}</button></div>
    <nav aria-label="Jump to a chapter">${chapterIndex}</nav>
    <a class="legacy-link" href="./field-guide.html">Five-source field guide ${glyph('link')}</a>
  </dialog>
`;

const main = document.querySelector('#journey');
const stage = document.querySelector('.film-stage');
const atlasHost = document.querySelector('#atlas-viewport');
const equipmentHost = document.querySelector('#equipment-viewport');
const sections = [...document.querySelectorAll('.chapter')];
const index = document.querySelector('.chapter-index');
const evidence = document.querySelector('#map-evidence-label');
const visualSource = document.querySelector('#visual-source');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = matchMedia('(max-width: 760px)');
const touchedParts = new Map();
const clamp = (value) => Math.min(1, Math.max(0, value));
let active = -1;
let atlas;
let equipment;
let startingEquipment = false;
let latest;
let raf = 0;
const fallback = equipmentHost.querySelector('.equipment-fallback');
let fallbackId;

function updateMapEvidence(position) {
  if (latest?.chapter.id !== 'grid') return;
  const connection = position >= .336 && position < .475;
  const label = connection ? 'Solar grid connection · route from public plans' : 'Geographic flight · shared grid';
  if (evidence.textContent !== label) evidence.textContent = label;
}

function renderEquipment() {
  if (!latest?.chapter.model || latest.chapter.shot !== 'equipment') return;
  if (!equipment && !startingEquipment) {
    startingEquipment = true;
    import('./equipment-camera.js')
      .then(({ createEquipmentCamera }) => {
        equipment = createEquipmentCamera(equipmentHost);
        equipmentHost.dataset.ready = 'true';
        renderEquipment();
      })
      .catch(() => { equipmentHost.dataset.ready = 'fallback'; renderEquipment(); });
  }
  const { chapter, progress, section } = latest;
  if (!equipment) {
    if (equipmentHost.dataset.ready === 'fallback' && fallbackId !== chapter.id) {
      fallbackId = chapter.id;
      fallback.hidden = false;
      fallback.innerHTML = diagramMarkup(chapter.id);
    }
    return;
  }
  const details = section.querySelector('.component-details');
  const part = details?.open ? chapter.parts[touchedParts.get(chapter.id)] : undefined;
  equipment.show(part?.model ?? chapter.model, { progress, quiet: motion.matches, reveal: details?.open });
  equipment.highlight(part);
}

function viewport() {
  raf = 0;
  const height = stage.offsetHeight;
  if (!height) return;
  const rects = sections.map((section) => section.getBoundingClientRect());
  const threshold = height * .29;
  const travel = Math.max(1, sections.at(-1).offsetTop - sections[0].offsetTop);
  stage.style.setProperty('--progress', clamp((window.scrollY + threshold * .7) / travel));
  let current = 0;
  rects.forEach(({ top }, at) => { if (top <= threshold) current = at; });
  const chapter = chapters[current];
  const previous = chapters[active];
  const section = sections[current];
  const rect = rects[current];
  const progress = clamp((threshold - rect.top) / Math.max(rect.height, 1));
  latest = { chapter, progress, section };
  const inspecting = String(Boolean(section.querySelector('.component-details[open]')));
  if (document.documentElement.dataset.inspecting !== inspecting) document.documentElement.dataset.inspecting = inspecting;
  if (active !== current) {
    active = current;
    document.documentElement.dataset.chapter = chapter.id;
    stage.dataset.shot = chapter.shot;
    atlasHost.inert = chapter.shot !== 'atlas';
    equipmentHost.inert = chapter.shot !== 'equipment';
    document.querySelectorAll('.chapter-index a').forEach((link) => {
      if (link.hash === '#' + chapter.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    evidence.textContent = chapter.id === 'grid' ? 'Geographic flight · shared grid' : chapter.id === 'start' ? 'Central Arizona' : chapter.place;
    visualSource.textContent = chapter.shot === 'atlas'
      ? geography.credits : 'Representative equipment model';
  }
  if (chapter.shot === 'equipment' && equipmentHost.dataset.ready === 'fallback') visualSource.textContent = 'Equipment diagram';
  if (atlas && chapter.shot === 'atlas') {
    let position = .28;
    if (chapter.id === 'start') position = motion.matches ? 0 : clamp(-rects[0].top / (rects[0].height - threshold)) * .28;
    if (chapter.id === 'grid') {
      const flight = clamp(-rect.top / (rect.height - threshold));
      position = motion.matches ? .55 : .28 + flight * .72;
      updateMapEvidence(atlas.progress ?? position);
    }
    if (chapter.id === 'mesa') position = 1;
    atlas.render(position, { reduced: motion.matches, immediate: previous?.shot !== 'atlas' });
  }
  renderEquipment();
}

function refresh() {
  if (!raf) raf = requestAnimationFrame(viewport);
}

for (const type of ['scroll', 'resize']) addEventListener(type, refresh, { passive: true });
motion.addEventListener('change', refresh);
const observer = new ResizeObserver(refresh);
observer.observe(main);

document.querySelector('.index-toggle').addEventListener('click', () => index.showModal());
document.querySelector('.index-close').addEventListener('click', () => index.close());
index.addEventListener('click', (event) => { if (event.target === index) index.close(); });

document.addEventListener('click', (event) => {
  const anchor = event.target.closest('a[href^="#"]');
  if (anchor) {
    const target = document.getElementById(anchor.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    const jump = index.open || anchor.hash === '#start';
    if (index.open) index.close();
    history.replaceState(null, '', anchor.hash === '#start' ? location.pathname + location.search : anchor.hash);
    target.scrollIntoView({ behavior: motion.matches || jump ? 'instant' : 'smooth' });
    if (jump) target.querySelector('h1, h2')?.focus({ preventScroll: true });
  }
  const button = event.target.closest('.part-button');
  if (!button) return;
  const section = button.closest('.chapter');
  const chapter = chapters.find(({ id }) => id === section.id);
  const part = Number(button.dataset.part);
  touchedParts.set(chapter.id, part);
  section.querySelectorAll('.part-button').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  section.querySelector('.part-role').textContent = chapter.parts[part].role;
  highlightDiagram(section.querySelector('.power-diagram'), chapter.id, part);
  if (latest?.chapter.id === chapter.id) renderEquipment();
});

document.querySelectorAll('.component-details').forEach((details) => {
  details.addEventListener('toggle', () => {
    if (details.open) {
      for (const other of document.querySelectorAll('.component-details[open]')) {
        if (other !== details) other.open = false;
      }
      if (narrow.matches && details.closest('.chapter') === latest?.section) {
        const rect = details.getBoundingClientRect();
        const ceiling = stage.offsetHeight * .52;
        if (rect.top > ceiling + 24) {
          window.scrollBy({ top: rect.top - ceiling, behavior: motion.matches ? 'instant' : 'smooth' });
        }
      }
    }
    refresh();
  });
});

async function startAtlas() {
  try {
    const { createAtlasCamera } = await import('./atlas-camera.js');
    atlas = createAtlasCamera(atlasHost, {
      onProgress: updateMapEvidence,
      onReady: ({ ok }) => {
        atlasHost.dataset.ready = ok ? 'true' : 'fallback';
        refresh();
      },
    });
    refresh();
  } catch {
    atlasHost.dataset.ready = 'fallback';
  }
}

refresh();
startAtlas();
