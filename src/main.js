import '@fontsource-variable/instrument-sans';
import '@fontsource/ibm-plex-mono/latin-400.css';
import './style.css';
import { architecture, components, glossary, sources } from './content.js';
import { generation, grid, modelLabels, modelPhase, modes, phases, routeFor, selectModeFor, server, siteEntry, siteOutput } from './route.js';
import { icon } from './icons.js';

const e = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const state = {
  source: 'gas', mode: 'utility', active: 'gas', playing: false, started: false,
  cutaway: false, reduced: motionPreference.matches,
};
const count = (number) => String(number).padStart(2, '0');
const sourceOptions = Object.entries(generation).map(([id, source]) => `<option value="${id}">${e(source.title)}</option>`).join('');

const app = document.querySelector('#app');
app.innerHTML = `
  <main>
    <section class="cover" aria-labelledby="experience-title">
      <div class="cover-image" aria-hidden="true"></div>
      <header class="masthead">
        <span class="wordmark">Currentline</span>
        <button class="plain" data-dialog="guide">About</button>
      </header>
      <div class="cover-copy">
        <h1 id="experience-title">From source<br>to silicon<span>.</span></h1>
        <p>Follow electricity from the power plant to the processor.</p>
        <form class="cover-actions">
          <label class="select-wrap"><span class="sr-only">Energy source</span>
            <select id="cover-source">${sourceOptions}</select>${icon('chevron-down', 15)}
          </label>
          <button class="primary" type="submit">Begin tour ${icon('arrow-right', 17)}</button>
        </form>
      </div>
      <p class="cover-credit">Photograph by Charles Devaux</p>
    </section>
    <section class="viewer" aria-label="Currentline interactive tour" hidden>
      <div class="scene">
        <div id="world" class="world" aria-hidden="true"></div>
        <div class="scene-shade" aria-hidden="true"></div>
        <div id="hotspots" class="hotspots" aria-label="Components in the 3D scene"></div>
        <div class="world-message" id="world-message" role="status">Loading the scene…</div>
      </div>
      <header class="masthead tour-header">
        <button class="wordmark" data-action="home" aria-label="Currentline home">Currentline</button>
        <button class="plain route-trigger" data-dialog="diagram">Route ${icon('arrow-up-right', 15)}</button>
      </header>
      <div class="scene-caption">
        <p id="view-phase" class="phase-label"></p>
        <h2 id="component-title" tabindex="-1"></h2>
        <p class="summary"></p>
        <div class="caption-actions">
          <button class="text-action" data-action="details" aria-controls="inspector" aria-expanded="false">Details ${icon('arrow-up-right', 13)}</button>
          <button class="text-action" id="cutaway" data-action="cutaway" aria-pressed="false" hidden>Cutaway</button>
        </div>
      </div>
      <aside class="inspector" id="inspector" aria-labelledby="inspector-title" hidden></aside>
      <div class="transport" role="group" aria-label="Tour playback">
        <div class="transport-buttons">
          <button data-action="prev" class="icon-button" aria-label="Previous component" title="Previous component">${icon('arrow-left', 19)}</button>
          <button data-action="play" id="play" class="play icon-button"></button>
          <button data-action="next" class="icon-button" aria-label="Next component" title="Next component">${icon('arrow-right', 19)}</button>
        </div>
        <div class="timeline">
          <input type="range" id="scrubber" aria-label="Tour position" min="0" max="16" value="0">
          <span class="step-count" aria-hidden="true"></span>
        </div>
      </div>
    </section>
  </main>
  <dialog id="dialog" aria-labelledby="dialog-title">
    <div class="dialog-head">
      <h2 id="dialog-title" tabindex="-1"></h2>
      <button class="icon-button" data-action="close" aria-label="Close dialog">${icon('x', 21)}</button>
    </div>
    <div class="dialog-body"></div>
  </dialog>
  <p class="sr-only" id="announcement" role="status"></p>
`;

const cover = app.querySelector('.cover');
const coverSelect = app.querySelector('#cover-source');
const coverForm = app.querySelector('.cover-actions');
const viewer = app.querySelector('.viewer');
const inspector = app.querySelector('.inspector');
const captionTitle = app.querySelector('#component-title');
const detailButton = app.querySelector('[data-action="details"]');
const cutaway = app.querySelector('#cutaway');
const dialog = app.querySelector('#dialog');
const dialogBody = dialog.querySelector('.dialog-body');
const worldMessage = app.querySelector('#world-message');
const play = app.querySelector('#play');
const previous = app.querySelector('[data-action="prev"]');
const next = app.querySelector('[data-action="next"]');
const scrubber = app.querySelector('#scrubber');
let stage;
let stageLoading;
let playbackTimer;
let dialogTrigger;
let dialogKind;

function links(ids) {
  return ids.map((id) => {
    const source = sources[id];
    return `<a class="source-link" href="${e(source.url)}" target="_blank" rel="noreferrer">${e(source.organization)} · ${e(source.title)} ${icon('arrow-up-right', 13)}</a>`;
  }).join('');
}

function renderInspector() {
  const item = components[state.active];
  inspector.innerHTML = `
    <div class="inspector-head">
      <h2 id="inspector-title" tabindex="-1">${e(item.title)}</h2>
      <button class="icon-button" data-action="details-close" aria-label="Close details">${icon('x', 20)}</button>
    </div>
    <dl class="flow">
      <div><dt>Input</dt><dd>${e(item.input)}</dd></div>
      <div><dt>Output</dt><dd>${e(item.output)}</dd></div>
    </dl>
    <section class="how"><h3>How it works</h3><p>${e(item.works)}</p></section>
    <details class="deep">
      <summary>Explore deeper ${icon('chevron-down', 15)}</summary>
      <div>
        <h3>Inside the component</h3><p>${e(item.parts)}</p>
        <h3>How it’s made</h3><p>${e(item.assembly)}</p>
        <h3>In the chain</h3><p>${e(item.connection)}</p>
        <h3>A closer look</h3><p>${e(item.deeper)}</p>
      </div>
    </details>
    <div class="inspector-sources"><h3>Component sources</h3>${links(item.sources)}</div>
  `;
  inspector.scrollTop = 0;
}

function showDetails(open, restoreFocus = true) {
  if (open) {
    pauseTour();
    renderInspector();
  }
  inspector.hidden = !open;
  viewer.classList.toggle('details-open', open);
  detailButton.setAttribute('aria-expanded', String(open));
  if (restoreFocus) (open ? inspector.querySelector('h2') : detailButton).focus({ preventScroll: true });
}

function renderTransport() {
  const route = routeFor(state.source, state.mode);
  const index = route.indexOf(state.active);
  const atEnd = index === route.length - 1;
  const label = state.playing ? 'Pause' : atEnd ? 'Replay' : 'Play tour';
  play.innerHTML = icon(state.playing ? 'pause' : atEnd ? 'reset' : 'play', 17);
  play.setAttribute('aria-label', label);
  play.title = label;
  previous.disabled = index === 0;
  next.disabled = atEnd;
  scrubber.max = route.length - 1;
  updateTimeline(index);
}

function updateTimeline(index) {
  const route = routeFor(state.source, state.mode);
  scrubber.value = index;
  scrubber.setAttribute('aria-valuetext', `${components[route[index]].title}, stop ${index + 1} of ${route.length}`);
  scrubber.style.setProperty('--progress', `${index / (route.length - 1) * 100}%`);
  app.querySelector('.step-count').textContent = `${count(index + 1)} / ${count(route.length)}`;
}

function renderSceneCaption() {
  const phase = phases.find(({ id }) => id === modelPhase[state.active]);
  const title = state.mode === 'utility' || phase.id === 'generation' || phase.id === 'grid'
    ? phase.title : `${phase.title} / ${modes[state.mode].short}`;
  app.querySelector('#view-phase').textContent = title;
  captionTitle.textContent = components[state.active].title;
  app.querySelector('.summary').textContent = components[state.active].summary;
  cutaway.hidden = !stage?.canCutaway(state.active);
  cutaway.setAttribute('aria-pressed', String(state.cutaway));
}

function setSelection(id, { source = state.source, mode = selectModeFor(id, state.mode), fromTour = false } = {}) {
  if (!routeFor(source, mode).includes(id)) return;
  if (!fromTour) pauseTour();
  if (id === state.active && source === state.source && mode === state.mode) return;
  Object.assign(state, { active: id, source, mode, cutaway: false });
  renderSceneCaption();
  renderTransport();
  if (!inspector.hidden) renderInspector();
  stage?.update(state);
  app.querySelector('#announcement').textContent = components[id].title;
}

function changeMode(mode) {
  if (mode !== state.mode) setSelection(modes[mode].branch[0], { mode });
}

function moveStep(direction, fromTour = false) {
  const route = routeFor(state.source, state.mode);
  const nextId = route[route.indexOf(state.active) + direction];
  if (nextId) setSelection(nextId, { fromTour });
}

function pauseTour() {
  clearTimeout(playbackTimer);
  if (!state.playing) return;
  state.playing = false;
  renderTransport();
}

function scheduleTour() {
  clearTimeout(playbackTimer);
  if (state.active === routeFor(state.source, state.mode).at(-1)) {
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
  if (!inspector.hidden) showDetails(false, false);
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
    <div class="diagram-intro">
      <p>${e(architecture.title)}. Select a stop to jump there.</p>
      <label class="select-wrap"><span class="sr-only">Change energy source</span><select id="route-source">${sourceOptions}</select>${icon('chevron-down', 15)}</label>
    </div>
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
    <div class="reference-links"><button class="text-action" data-dialog="guide">Field guide ${icon('arrow-up-right', 13)}</button>
    <button class="text-action" data-dialog="sources">Sources ${icon('arrow-up-right', 13)}</button></div>
  `;
  dialogBody.querySelector('#route-source').value = state.source;
}

function renderGuide() {
  dialogBody.innerHTML = `
    <p class="dialog-intro">Drag to orbit, scroll to zoom, or use Route to jump to a stop. While exploring, press + or − to zoom and 0 to reset. Double-clicking the scene also resets the view.</p>
    <div class="reference-links">
      <label class="motion-setting"><input id="reduce-motion" type="checkbox" ${state.reduced ? 'checked' : ''}> Reduce motion</label>
      <button class="text-action" data-dialog="sources">Sources ${icon('arrow-up-right', 13)}</button>
    </div>
    <section><h3>${e(architecture.title)}</h3><p>${e(architecture.description)}</p></section>
    <section><h3>Normal and backup power</h3><p>${e(architecture.normal)}</p><p>${e(architecture.backup)}</p></section>
    <section><h3>What changes at other sites</h3><p>${e(architecture.alternatives)}</p></section>
    <section><h3>Reading the 3D model</h3><p>${e(architecture.simplifications)}</p>
      <p>The tour is for learning. The models, voltage examples and simplified connections are unsuitable for infrastructure design or operation.</p>
      <div class="guide-sources">${links(architecture.sources)}</div></section>
    <section><h3>Cover photograph</h3><p>Charles Devaux, <a class="text-action" href="https://commons.wikimedia.org/wiki/File:Power_lines_(Unsplash).jpg" target="_blank" rel="noreferrer">Power lines</a> · CC0 1.0.</p></section>
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
  if (!dialog.open) dialogTrigger = trigger;
  dialogKind = kind;
  dialog.querySelector('h2').textContent = { diagram: 'Journey route', guide: 'About Currentline', sources: 'Sources' }[kind];
  ({ diagram: renderDiagram, guide: renderGuide, sources: renderSources })[kind]();
  if (!dialog.open) dialog.showModal();
  dialogBody.scrollTop = 0;
  dialog.querySelector('h2').focus();
}

function setReduced(value) {
  state.reduced = value;
  viewer.toggleAttribute('data-reduced', value);
  if (state.started) stage?.update(state);
  const motionControl = dialogBody.querySelector('#reduce-motion');
  if (motionControl) motionControl.checked = value;
}

function showUnavailable() {
  viewer.classList.remove('with-3d');
  viewer.classList.add('without-3d');
  worldMessage.textContent = 'The scene needs WebGL 2. The route and component notes are available.';
  worldMessage.hidden = false;
  cutaway.hidden = true;
}

function startTour(event) {
  event.preventDefault();
  cover.hidden = true;
  viewer.hidden = false;
  const source = coverSelect.value;
  Object.assign(state, { source, active: generation[source].stops[0], mode: 'utility', started: true, cutaway: false, playing: !state.reduced });
  viewer.toggleAttribute('data-reduced', state.reduced);
  renderSceneCaption();
  renderTransport();
  captionTitle.focus({ preventScroll: true });
  if (stage) stage.update(state);
  stageLoading ??= import('./stage.js').then(({ createStage }) => {
    stage = createStage({
      mount: app.querySelector('#world'), hotspots: app.querySelector('#hotspots'),
      select: setSelection, onUnavailable: showUnavailable, onInteract: pauseTour,
    });
    worldMessage.hidden = true;
    viewer.classList.add('with-3d');
    if (state.started) {
      stage.update(state);
      renderSceneCaption();
    }
  }).catch((error) => {
    console.warn('Currentline could not start the 3D view.', error);
    showUnavailable();
  });
  stageLoading.then(() => {
    if (state.started && state.playing) scheduleTour();
  });
}

function showCover() {
  pauseTour();
  showDetails(false, false);
  state.started = false;
  stage?.update({ ...state, reduced: true });
  coverSelect.value = state.source;
  viewer.hidden = true;
  cover.hidden = false;
  coverForm.querySelector('button').focus({ preventScroll: true });
}

coverForm.addEventListener('submit', startTour);
motionPreference.addEventListener('change', (event) => setReduced(event.matches));
scrubber.addEventListener('input', () => {
  const index = Number(scrubber.value);
  pauseTour();
  updateTimeline(index);
});
scrubber.addEventListener('change', () => {
  setSelection(routeFor(state.source, state.mode)[Number(scrubber.value)]);
});
dialog.addEventListener('close', () => {
  dialogKind = null;
  dialogTrigger?.focus({ preventScroll: true });
});
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
viewer.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !inspector.hidden && !dialog.open) showDetails(false);
  if (!stage || event.ctrlKey || event.metaKey || event.target.matches('input, select, textarea')) return;
  if (event.key === '+' || event.key === '=' || event.key === '-' || event.key === '0') {
    event.preventDefault();
    pauseTour();
    if (event.key === '0') stage.reset();
    else stage.zoom(event.key === '-' ? 1.2 : .83);
  }
});
dialogBody.addEventListener('change', (event) => {
  const input = event.target;
  if (input.id === 'route-source') {
    const source = input.value;
    setSelection(generation[source].stops[0], { source });
    dialog.close();
  }
  if (input.id === 'reduce-motion') setReduced(input.checked);
});

app.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const { action, dialog: kind, go, goMode, mode } = button.dataset;
  if (kind) openDialog(kind, button);
  if (go) {
    if (dialogKind === 'diagram') dialog.close();
    setSelection(go, { mode: goMode ?? selectModeFor(go, state.mode) });
    if ('hotspot' in button.dataset && !button.isConnected && event.detail === 0) {
      const heading = inspector.hidden ? captionTitle : inspector.querySelector('h2');
      heading.focus({ preventScroll: true });
    }
  }
  if (mode) {
    changeMode(mode);
    const scroll = dialogBody.scrollTop;
    renderDiagram();
    dialogBody.querySelector(`[data-mode="${mode}"]`)?.focus({ preventScroll: true });
    dialogBody.scrollTop = scroll;
  }
  if (!action) return;
  if (action === 'home') showCover();
  if (action === 'close') dialog.close();
  if (action === 'details') showDetails(true);
  if (action === 'details-close') showDetails(false);
  if (action === 'play') toggleTour();
  if (action === 'prev' || action === 'next') moveStep(action === 'prev' ? -1 : 1);
  if (action === 'cutaway') {
    pauseTour();
    state.cutaway = !state.cutaway;
    stage?.update(state);
    renderSceneCaption();
  }
});
