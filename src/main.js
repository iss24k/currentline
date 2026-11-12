import '@fontsource-variable/geist';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import './style.css';
import { architecture, components, glossary, sources } from './content.js';
import {
  generation, grid, modelLabels, modelPhase, modes, phases, routeFor, selectModeFor,
  server, siteEntry, siteOutput,
} from './route.js';
import { icon } from './icons.js';

const e = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const state = {
  source: 'gas', mode: 'utility', active: 'gas', playing: false,
  cutaway: false, reduced: motionPreference.matches,
};

const app = document.querySelector('#app');
app.innerHTML = `
  <header class="site-header">
    <div class="header-inner">
      <a class="brand" href="./">
        <span class="brand-icon">${icon('zap', 22)}</span>
        <span>Currentline <small>ENERGY FIELD GUIDE</small></span>
      </a>
      <nav class="header-nav" aria-label="Reference">
        <button class="quiet" data-dialog="guide">${icon('circle-help')} <span>Field guide</span></button>
        <button class="quiet" data-dialog="sources">${icon('book-open')} <span>Sources</span></button>
      </nav>
    </div>
  </header>
  <main class="shell">
    <section class="intro" aria-labelledby="experience-title">
      <div>
        <p class="eyebrow"><span></span> AN INTERACTIVE 3D JOURNEY</p>
        <h1 id="experience-title">Follow the current<span>.</span></h1>
      </div>
      <p class="intro-copy">Trace electrical energy from the place it’s generated to the processor that uses it.</p>
    </section>
    <section class="source-section" aria-labelledby="source-heading">
      <h2 id="source-heading" class="eyebrow">CHOOSE A SOURCE</h2>
      <div class="source-options" aria-label="Generation source" role="group"></div>
    </section>
    <div class="experience">
      <section class="viewer" aria-label="Interactive 3D view">
        <div id="world" class="world" aria-hidden="true"></div>
        <div id="hotspots" class="hotspots" aria-label="Components in the 3D scene"></div>
        <div class="viewer-top">
          <div><p class="viewer-section"><span class="signal"></span><span id="view-phase"></span></p><p class="trace-legend">Light traces represent energy transfer.</p></div>
          <button class="scene-button motion-button" data-action="motion" aria-pressed="false">
            ${icon('move', 15)} <span>Reduce motion</span>
          </button>
        </div>
        <div class="world-message" id="world-message" role="status">Loading 3D models…</div>
        <div class="viewer-bottom">
          <p class="view-hint">${icon('move', 15)} <span>Drag to orbit · Select a component</span></p>
          <div class="view-tools" role="group" aria-label="3D camera controls">
            <button class="scene-button icon-button" data-action="zoom-out" aria-label="Zoom out" title="Zoom out">${icon('minus')}</button>
            <button class="scene-button icon-button" data-action="zoom-in" aria-label="Zoom in" title="Zoom in">${icon('plus')}</button>
            <button class="scene-button icon-button" data-action="reset-view" aria-label="Reset view" title="Reset view">${icon('crosshair')}</button>
            <button class="scene-button" id="cutaway" data-action="cutaway" aria-pressed="false" hidden>${icon('layers', 15)} Cutaway</button>
          </div>
        </div>
      </section>
      <aside class="inspector" aria-labelledby="component-title" tabindex="0"></aside>
    </div>
    <section id="journey-map" tabindex="-1" class="journey" aria-labelledby="journey-title">
      <div class="journey-heading">
        <h2 id="journey-title">Journey map</h2>
        <div class="map-options">
          <div class="route-select">${icon('git-fork', 15)}
            <label class="sr-only" for="mode">Power path</label>
            <select id="mode">${Object.entries(modes).map(([id, mode]) => `<option value="${id}">${e(mode.title)}</option>`).join('')}</select>
            ${icon('chevron-down', 14)}
          </div>
          <button class="quiet diagram-trigger" data-dialog="diagram">${icon('maximize', 14)} Full diagram</button>
        </div>
      </div>
      <nav class="phase-nav" aria-label="Journey stages"></nav>
      <div class="journey-controls">
        <div class="transport" role="group" aria-label="Guided playback">
          <button data-action="prev" class="quiet icon-button" aria-label="Previous component" title="Previous component">${icon('arrow-left')}</button>
          <button data-action="play" id="play" class="play"></button>
          <button data-action="next" class="quiet icon-button" aria-label="Next component" title="Next component">${icon('arrow-right')}</button>
        </div>
        <nav class="step-nav" aria-label="Full component route"></nav>
        <span class="step-count" aria-hidden="true"></span>
      </div>
      <p id="scenario-note" class="scenario-note" hidden></p>
    </section>
    <footer class="footer">
      <p>Illustrative U.S. 60 Hz example · Equipment and distances are simplified.</p>
      <button class="quiet" data-dialog="guide">How to read this model ${icon('arrow-up-right', 14)}</button>
    </footer>
  </main>
  <dialog id="dialog" aria-labelledby="dialog-title">
    <div class="dialog-head">
      <h2 id="dialog-title" tabindex="-1"></h2>
      <button class="quiet icon-button" data-action="close" aria-label="Close dialog">${icon('x', 22)}</button>
    </div>
    <div class="dialog-body"></div>
  </dialog>
  <p class="sr-only" id="announcement" role="status"></p>
`;

const sourceOptions = app.querySelector('.source-options');
sourceOptions.innerHTML = Object.entries(generation).map(([id, source]) => `
  <button class="source-button" data-source="${id}" aria-pressed="false">
    ${icon(source.icon, 18)} <span>${e(source.title)}</span>
  </button>`).join('');

const inspector = app.querySelector('.inspector');
const phaseNav = app.querySelector('.phase-nav');
const stepNav = app.querySelector('.step-nav');
const powerSelect = app.querySelector('#mode');
const dialog = app.querySelector('#dialog');
const dialogBody = dialog.querySelector('.dialog-body');
const cutaway = app.querySelector('#cutaway');
const viewer = app.querySelector('.viewer');
const worldMessage = app.querySelector('#world-message');
const play = app.querySelector('#play');
const previous = app.querySelector('[data-action="prev"]');
const next = app.querySelector('[data-action="next"]');
let stage;
let playbackTimer;
let dialogTrigger;
let dialogKind;

const count = (number) => String(number).padStart(2, '0');

function links(ids) {
  return ids.map((id) => {
    const source = sources[id];
    return `<a class="source-link" href="${e(source.url)}" target="_blank" rel="noreferrer">${e(source.organization)} · ${e(source.title)} ${icon('arrow-up-right', 13)}</a>`;
  }).join('');
}

function renderInspector() {
  const item = components[state.active];
  const phase = phases.find(({ id }) => id === modelPhase[state.active]);
  const stageNumber = phases.indexOf(phase) + 1;
  inspector.innerHTML = `
    <div class="inspector-inner">
      <p class="eyebrow panel-kicker"><span>${count(stageNumber)}</span> ${e(phase.title)} <span class="panel-separator">/</span> COMPONENT</p>
      <h2 id="component-title" tabindex="-1">${e(item.title)}</h2>
      <p class="summary">${e(item.summary)}</p>
      <dl class="flow">
        <div><dt>INPUT</dt><dd>${e(item.input)}</dd></div>
        <div><dt>OUTPUT</dt><dd>${e(item.output)}</dd></div>
      </dl>
      <section class="how">
        <h3>How it works</h3>
        <p>${e(item.works)}</p>
      </section>
      <details class="deep">
        <summary>${icon('layers', 16)} Explore deeper ${icon('chevron-down', 15)}</summary>
        <div>
          <h3>Inside the component</h3><p>${e(item.parts)}</p>
          <h3>How it’s made</h3><p>${e(item.assembly)}</p>
          <h3>In the chain</h3><p>${e(item.connection)}</p>
          <h3>A closer look</h3><p>${e(item.deeper)}</p>
        </div>
      </details>
      <div class="inspector-sources"><h3>Component sources</h3>${links(item.sources)}</div>
    </div>`;
  inspector.scrollTop = 0;
}

function renderMap() {
  const route = routeFor(state.source, state.mode);
  const activePhase = modelPhase[state.active];
  phaseNav.innerHTML = phases.map((phase, index) => {
    const first = route.find((id) => modelPhase[id] === phase.id);
    const selected = phase.id === activePhase;
    const passed = index < phases.findIndex(({ id }) => id === activePhase);
    return `<button class="phase-button ${passed ? 'phase-passed' : ''}" data-go="${first}" ${selected ? 'aria-current="step"' : ''}>
      <span class="phase-icon">${icon(phase.icon, 20)}</span>
      <span><strong>${e(phase.title)}</strong><small>${e(phase.caption)}</small></span>
      <span class="phase-number">${count(index + 1)}</span>
    </button>`;
  }).join('');
  const firstLive = state.mode === 'utility' ? 0 : route.indexOf(modes[state.mode].branch[0]);
  stepNav.innerHTML = route.map((id, index) => {
    const classes = ['step-button'];
    if (index && modelPhase[id] !== modelPhase[route[index - 1]]) classes.push('phase-start');
    if (index < firstLive) classes.push('upstream');
    return `<button class="${classes.join(' ')}" data-go="${id}" ${id === state.active ? 'aria-current="step"' : ''}>${e(modelLabels[id])}</button>`;
  }).join('');
  const selectedStep = stepNav.querySelector('[aria-current]');
  if (selectedStep) {
    const left = selectedStep.offsetLeft;
    const right = left + selectedStep.offsetWidth;
    if (left < stepNav.scrollLeft + 3 || right > stepNav.scrollLeft + stepNav.clientWidth - 5) {
      stepNav.scrollLeft = Math.max(0, left - stepNav.clientWidth * .33);
    }
  }
  const note = app.querySelector('#scenario-note');
  note.hidden = state.mode === 'utility';
  note.textContent = modes[state.mode].note;
}

function renderTransport() {
  const route = routeFor(state.source, state.mode);
  const index = route.indexOf(state.active);
  const atEnd = index === route.length - 1;
  const label = state.playing ? 'Pause' : atEnd ? 'Replay' : 'Play tour';
  play.innerHTML = `${icon(state.playing ? 'pause' : atEnd ? 'reset' : 'play', 14)} ${label}`;
  previous.disabled = index === 0;
  next.disabled = atEnd;
  app.querySelector('.step-count').textContent = `${count(index + 1)} / ${count(route.length)}`;
}

function renderViewerControls() {
  const phase = phases.find(({ id }) => id === modelPhase[state.active]);
  app.querySelector('#view-phase').textContent = `${count(phases.indexOf(phase) + 1)} / ${phase.title.toUpperCase()}`;
  app.querySelector('[data-action="motion"]').setAttribute('aria-pressed', String(state.reduced));
  cutaway.hidden = !stage?.canCutaway(state.active);
  cutaway.setAttribute('aria-pressed', String(state.cutaway));
}

function renderNavigation() {
  for (const button of sourceOptions.children) {
    button.setAttribute('aria-pressed', String(button.dataset.source === state.source));
  }
  powerSelect.value = state.mode;
  renderMap();
  renderTransport();
  renderViewerControls();
}

function setSelection(id, { source = state.source, mode = selectModeFor(id, state.mode), fromTour = false } = {}) {
  if (!routeFor(source, mode).includes(id)) return;
  if (!fromTour) pauseTour();
  const changed = id !== state.active || source !== state.source || mode !== state.mode;
  if (!changed) return;
  state.cutaway = false;
  Object.assign(state, { active: id, source, mode });
  renderInspector();
  renderNavigation();
  stage?.update(state);
  app.querySelector('#announcement').textContent = `${components[id].title}. ${modes[mode].title}.`;
}

function changeMode(mode) {
  if (mode === state.mode) return;
  setSelection(modes[mode].branch[0], { mode });
}

function moveStep(direction, fromTour = false) {
  const route = routeFor(state.source, state.mode);
  const index = route.indexOf(state.active);
  const id = route[index + direction];
  if (id) setSelection(id, { fromTour });
}

function pauseTour() {
  clearTimeout(playbackTimer);
  if (!state.playing) return;
  state.playing = false;
  renderTransport();
}

function scheduleTour() {
  clearTimeout(playbackTimer);
  const route = routeFor(state.source, state.mode);
  if (state.active === route.at(-1)) {
    pauseTour();
    return;
  }
  playbackTimer = setTimeout(() => {
    moveStep(1, true);
    scheduleTour();
  }, 8500);
}

function toggleTour() {
  if (state.playing) {
    pauseTour();
    return;
  }
  const route = routeFor(state.source, state.mode);
  if (state.active === route.at(-1)) setSelection(route[0]);
  state.playing = true;
  renderTransport();
  scheduleTour();
}

const diagramOutputs = {
  'solar': 'DC', 'solar-inverter': 'AC', 'wind-converter': 'AC', 'step-up': '230 kV AC',
  substation: '13.8 kV AC', 'site-transformer': '480 V AC', battery: 'DC',
  generator: '480 V AC', ups: '480 V AC', 'floor-pdu': '208Y/120 V AC',
  cord: '208 V AC', psu: '12 V DC', vrm: '≈1 V DC',
};

function diagramNodes(ids, activeIds, branchMode) {
  return ids.map((id) => {
    const current = id === state.active && (!branchMode || branchMode === state.mode);
    const output = diagramOutputs[id];
    return `<button data-go="${id}" ${branchMode ? `data-go-mode="${branchMode}"` : ''}
      class="diagram-node ${activeIds.includes(id) ? 'on-route' : ''}" ${current ? 'aria-current="step"' : ''}>
      ${e(modelLabels[id])}${output ? `<small aria-label="Output ${e(output)}">${e(output)}</small>` : ''}
    </button>`;
  }).join('');
}

function renderDiagram() {
  const route = routeFor(state.source, state.mode);
  const upstream = state.mode === 'utility' ? route : [];
  dialogBody.innerHTML = `
    <p class="dialog-intro">${e(architecture.title)}. The highlighted path shows ${e(modes[state.mode].short.toLowerCase())}. Choose any component to jump to it.</p>
    <div class="diagram-topline">
      <section><h3>01 / ${e(generation[state.source].title)}</h3><div class="diagram-row">${diagramNodes(generation[state.source].stops, upstream)}</div></section>
      <section><h3>02 / Grid</h3><div class="diagram-row">${diagramNodes(grid, upstream)}</div></section>
    </div>
    <section class="diagram-facility">
      <h3>03 / Data center · three supply states</h3>
      <div class="branch-rows">
        <div class="branch ${state.mode === 'utility' ? 'selected' : ''}">
          <button class="branch-name" data-mode="utility" aria-pressed="${state.mode === 'utility'}">${icon('utility-pole', 16)} Utility</button>
          <div class="diagram-row">${diagramNodes([...siteEntry, 'transfer'], upstream, 'utility')}</div>
        </div>
        <div class="branch ${state.mode === 'battery' ? 'selected' : ''}">
          <button class="branch-name" data-mode="battery" aria-pressed="${state.mode === 'battery'}">${icon('battery-charging', 16)} Battery bridge</button>
          <div class="diagram-row">${diagramNodes(['battery'], route, 'battery')}<span class="branch-detail">DC link to inverter</span></div>
        </div>
        <div class="branch ${state.mode === 'generator' ? 'selected' : ''}">
          <button class="branch-name" data-mode="generator" aria-pressed="${state.mode === 'generator'}">${icon('fuel', 16)} Generator online</button>
          <div class="diagram-row">${diagramNodes(['generator', 'transfer'], state.mode === 'generator' ? route : [], 'generator')}</div>
        </div>
      </div>
      <div class="merge-label">${icon('arrow-down', 16)} CONVERGE AT THE UPS</div>
      <div class="diagram-row">${diagramNodes(siteOutput, route)}</div>
    </section>
    <section><h3>04 / Rack & server</h3><div class="diagram-row">${diagramNodes(server, route)}</div></section>
    <p class="diagram-note">${e(modes[state.mode].note)}</p>
  `;
}

function renderGuide() {
  dialogBody.innerHTML = `
    <p class="dialog-intro">Choose a source, select equipment in the scene, or jump using the map. Play tour advances through the stops. Pause to spend longer at a component.</p>
    <section><h3>${e(architecture.title)}</h3><p>${e(architecture.description)}</p></section>
    <section><h3>Normal and backup power</h3><p>${e(architecture.normal)}</p><p>${e(architecture.backup)}</p></section>
    <section><h3>What changes at other sites</h3><p>${e(architecture.alternatives)}</p></section>
    <section><h3>Reading the 3D model</h3><p>${e(architecture.simplifications)}</p>
      <p>The tour is for learning. The models, voltage examples and simplified connections are unsuitable for infrastructure design or operation.</p>
      <div class="guide-sources">${links(architecture.sources)}</div></section>
    <section><h3>Glossary</h3>
      <dl class="glossary">${glossary.map((item) => `<div><dt>${e(item.term)}</dt><dd>${e(item.definition)}<details><summary>Sources</summary>${links(item.sources)}</details></dd></div>`).join('')}</dl>
    </section>
  `;
}

function renderSources() {
  dialogBody.innerHTML = `
    <p class="dialog-intro">The component notes draw on public engineering references. Manufacturer material describes specific designs, and voltage values in the tour are illustrative.</p>
    <ol class="bibliography">${Object.values(sources).map((source) => `<li>
      <span class="eyebrow">${e(source.organization)}</span>
      <a href="${e(source.url)}" target="_blank" rel="noreferrer">${e(source.title)} ${icon('arrow-up-right', 15)}</a>
      <p>${e(source.note)}</p>
    </li>`).join('')}</ol>
  `;
}

function openDialog(kind, trigger) {
  pauseTour();
  dialogKind = kind;
  dialogTrigger = trigger;
  dialog.querySelector('h2').textContent = { diagram: 'Full journey diagram', guide: 'Field guide', sources: 'Sources & bibliography' }[kind];
  ({ diagram: renderDiagram, guide: renderGuide, sources: renderSources })[kind]();
  dialog.showModal();
  dialogBody.scrollTop = 0;
  dialog.querySelector('h2').focus();
}

function setReduced(value) {
  state.reduced = value;
  stage?.update(state);
  renderViewerControls();
}

motionPreference.addEventListener('change', (event) => setReduced(event.matches));
powerSelect.addEventListener('change', () => changeMode(powerSelect.value));
dialog.addEventListener('close', () => {
  dialogKind = null;
  dialogTrigger?.focus();
});
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
inspector.addEventListener('toggle', (event) => {
  if (event.target.matches('.deep') && event.target.open) pauseTour();
}, true);

app.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const { action, dialog: kind, go, goMode, mode, source } = button.dataset;
  if (kind) openDialog(kind, button);
  if (source) setSelection(generation[source].stops[0], { source });
  if (go) {
    const withinMap = button.closest('.phase-nav, .step-nav');
    if (dialogKind === 'diagram') dialog.close();
    const hotspot = 'hotspot' in button.dataset;
    setSelection(go, { mode: goMode ?? selectModeFor(go, state.mode) });
    if (hotspot && !button.isConnected && event.detail === 0) {
      inspector.querySelector('h2').focus({ preventScroll: true });
    }
    if (withinMap && !button.isConnected) {
      withinMap.querySelector('[aria-current="step"]')?.focus({ preventScroll: true });
    }
  }
  if (mode) {
    changeMode(mode);
    renderDiagram();
    dialogBody.querySelector(`[data-mode="${mode}"]`)?.focus();
  }
  if (!action) return;
  if (action === 'close') dialog.close();
  if (action === 'play') toggleTour();
  if (action === 'prev' || action === 'next') moveStep(action === 'prev' ? -1 : 1);
  if (action === 'motion') setReduced(!state.reduced);
  if (action === 'zoom-out' || action === 'zoom-in') stage?.zoom(action === 'zoom-in' ? 0.82 : 1.22);
  if (action === 'reset-view') stage?.reset();
  if (action === 'cutaway') {
    pauseTour();
    state.cutaway = !state.cutaway;
    stage?.update(state);
    renderViewerControls();
  }
});

renderInspector();
renderNavigation();

function showUnavailable() {
  viewer.classList.remove('with-3d');
  viewer.classList.add('without-3d');
  worldMessage.textContent = 'The 3D view needs WebGL 2. Use the journey map to explore every stop.';
  worldMessage.hidden = false;
  cutaway.hidden = true;
  for (const button of viewer.querySelectorAll('.scene-button')) button.disabled = true;
}

import('./stage.js').then(({ createStage }) => {
  stage = createStage({
    mount: app.querySelector('#world'), hotspots: app.querySelector('#hotspots'),
    select: setSelection, onUnavailable: showUnavailable, onInteract: pauseTour,
  });
  worldMessage.hidden = true;
  viewer.classList.add('with-3d');
  stage.update(state);
  renderViewerControls();
}).catch((error) => {
  console.warn('Currentline could not start the 3D view.', error);
  showUnavailable();
});
