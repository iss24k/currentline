import '@fontsource-variable/instrument-sans';
import '@fontsource/ibm-plex-mono/latin-400.css';
import './style.css';
import './transit.css';
import { architecture, components, glossary, sources } from './content.js';
import { energy } from './energy.js';
import { stepsFor } from './guide-steps.js';
import { createConversionVisual } from './conversion-visuals.js';
import { createTransit, travelFor } from './transit.js';
import { generation, grid, modelLabels, modelPhase, modes, phases, routeFor, selectModeFor, server, siteEntry, siteOutput } from './route.js';
import { icon } from './icons.js';

const e = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const state = {
  source: 'gas', mode: 'utility', active: 'gas', step: 0, started: false,
  busy: false, reduced: motionPreference.matches,
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
        <p>Take the path energy takes, from the power plant to the processor.</p>
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
        <div id="hotspots" class="hotspots" aria-label="Parts in the 3D scene"></div>
        <div class="world-message" id="world-message" role="status">Loading the scene…</div>
      </div>
      <div id="transit" hidden></div>
      <header class="masthead tour-header">
        <button class="wordmark" data-action="home" aria-label="Currentline home">Currentline</button>
        <button class="plain route-trigger" data-dialog="diagram">Route ${icon('arrow-up-right', 15)}</button>
      </header>
      <div class="scene-caption" id="guided-caption">
        <p id="view-phase" class="phase-label"></p>
        <h2 id="component-title" tabindex="-1"></h2>
        <section class="conversion" aria-labelledby="conversion-title">
          <h3 id="conversion-title"></h3>
          <figure class="conversion-visual">
            <canvas aria-hidden="true"></canvas>
            <figcaption><span id="conversion-input"></span>${icon('arrow-right', 13)}<span id="conversion-output"></span></figcaption>
          </figure>
          <p id="conversion-note"></p>
        </section>
        <button class="text-action" id="expand-parts" data-action="expand">Expand parts ${icon('layers', 15)}</button>
      </div>
      <aside id="parts-inline" class="parts-inline" aria-labelledby="inline-part-title" hidden></aside>
      <div class="transport" role="group" aria-label="Guided steps">
        <button data-action="prev" class="icon-button" aria-label="Previous step" title="Previous step">${icon('arrow-left', 19)}</button>
        <div class="sequence">
          <span class="stop-count"></span><span class="sequence-dot" aria-hidden="true">/</span><span class="step-count"></span><span class="leg-distance" hidden></span>
        </div>
        <button data-action="next" class="primary" id="next-step"></button>
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
const captionTitle = app.querySelector('#component-title');
const guidedCaption = app.querySelector('#guided-caption');
const expandButton = app.querySelector('#expand-parts');
const dialog = app.querySelector('#dialog');
const dialogBody = dialog.querySelector('.dialog-body');
const worldMessage = app.querySelector('#world-message');
const previous = app.querySelector('[data-action="prev"]');
const next = app.querySelector('#next-step');
const routeButton = app.querySelector('.route-trigger');
const partPanel = app.querySelector('#parts-inline');
const visual = createConversionVisual(app.querySelector('.conversion-visual canvas'));
const transit = createTransit(app.querySelector('#transit'));
let stage;
let stageLoading;
let dialogTrigger;
let dialogKind;
let partExplorer;
let explorerLoading;
let partGeometry;
let flight = 0;
let inspectionRequest = 0;

function links(ids) {
  return ids.map((id) => {
    const source = sources[id];
    return `<a class="source-link" href="${e(source.url)}" target="_blank" rel="noreferrer">${e(source.organization)} · ${e(source.title)} ${icon('arrow-up-right', 13)}</a>`;
  }).join('');
}

const beats = () => stepsFor(state.active, state.mode);
const currentBeat = () => beats()[state.step];

function renderTransport() {
  const route = routeFor(state.source, state.mode);
  const stop = route.indexOf(state.active);
  const lastBeat = state.step === beats().length - 1;
  const end = stop === route.length - 1 && lastBeat;
  const label = end ? 'Replay tour' : lastBeat ? 'Continue journey' : 'Next step';
  next.innerHTML = `${label} ${icon(end ? 'reset' : 'arrow-right', 17)}`;
  next.dataset.nextKind = end ? 'replay' : lastBeat ? 'travel' : 'local';
  next.disabled = state.busy;
  previous.disabled = state.busy || (stop === 0 && state.step === 0);
  routeButton.disabled = state.busy;
  app.querySelector('.stop-count').textContent = `Stop ${count(stop + 1)} of ${count(route.length)}`;
  app.querySelector('.step-count').textContent = `Step ${state.step + 1} of ${beats().length}`;
  const leg = lastBeat && !end ? travelFor(state.active, route[stop + 1]) : null;
  const distance = app.querySelector('.leg-distance');
  distance.hidden = !leg?.distance;
  distance.textContent = leg?.distance ? `${leg.distance} · ${leg.source ? 'documented example' : 'illustrative'}` : '';
}

function updateScene() {
  if (!stage || !state.started) return;
  stage.inspect(partGeometry ?? { beat: currentBeat() });
}

function renderBeat() {
  const beat = currentBeat();
  app.querySelector('#view-phase').textContent = energy[state.active].place;
  captionTitle.textContent = components[state.active].title;
  app.querySelector('#conversion-title').textContent = beat.name;
  app.querySelector('#conversion-note').textContent = beat.explanation;
  app.querySelector('#conversion-input').textContent = beat.input;
  app.querySelector('#conversion-output').textContent = beat.output;
  app.querySelector('.conversion-visual').dataset.form = beat.form;
  visual.show(beat, state.reduced);
  renderTransport();
  updateScene();
}

function setSelection(id, { source = state.source, mode = selectModeFor(id, state.mode), step = 0 } = {}) {
  if (!routeFor(source, mode).includes(id)) return;
  inspectionRequest += 1;
  partExplorer?.close(false);
  const changed = id !== state.active || source !== state.source || mode !== state.mode;
  Object.assign(state, { active: id, source, mode, step });
  if (changed) stage?.update({ ...state, reduced: state.reduced || state.busy });
  renderBeat();
  app.querySelector('#announcement').textContent = `${components[id].title}. ${currentBeat().name}.`;
}

function changeMode(mode) {
  if (mode !== state.mode) setSelection(modes[mode].branch[0], { mode });
}

function previousStep() {
  if (state.busy) return;
  if (state.step > 0) {
    setSelection(state.active, { step: state.step - 1 });
    return;
  }
  const route = routeFor(state.source, state.mode);
  const id = route[route.indexOf(state.active) - 1];
  if (id) setSelection(id, { step: stepsFor(id, selectModeFor(id, state.mode)).length - 1 });
}

async function nextStep() {
  if (state.busy) return;
  if (state.step < beats().length - 1) {
    setSelection(state.active, { step: state.step + 1 });
    return;
  }
  const route = routeFor(state.source, state.mode);
  const id = route[route.indexOf(state.active) + 1];
  if (!id) {
    setSelection(route[0]);
    return;
  }
  const leg = travelFor(state.active, id, state.source, state.mode);
  const request = ++flight;
  state.busy = true;
  viewer.classList.add('is-traveling');
  stage?.update({ ...state, reduced: true });
  renderTransport();
  let revealed = false;
  const reveal = () => {
    if (revealed || request !== flight || !state.started) return;
    revealed = true;
    setSelection(id);
  };
  try {
    if (leg) await transit.play(leg, { reduced: state.reduced, onReveal: reveal });
    else reveal();
  } catch (error) {
    console.warn('Currentline could not play a travel segment.', error);
    reveal();
  } finally {
    if (request === flight) {
      state.busy = false;
      viewer.classList.remove('is-traveling');
      stage?.update(state);
      updateScene();
      renderTransport();
      next.focus({ preventScroll: true });
    }
  }
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
    <p class="dialog-intro">Use Next step to follow energy through each machine. Continue journey takes you to the next location. Expand parts opens the machine in place.</p>
    <section><h3>Following the bead</h3><p>The bead marks the path energy takes. It can stand for fuel, heat, motion, or power. On the AC grid, electrons move back and forth near where they started. The highlight follows one phase to keep the route readable.</p>
    <p>The tour combines a representative power system with distances that are labeled as examples. The long transmission leg uses the length of Bonneville Power Administration’s 230 kV McNary–Roundup line, about 62 km. Travel time is compressed. <a class="source-link" href="${travelFor('lines', 'substation').source}" target="_blank" rel="noreferrer">BPA line and length ${icon('arrow-up-right', 12)}</a></p></section>
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
  if (state.busy) return;
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
  if (state.started) {
    stage?.update(state);
    renderBeat();
    partExplorer?.refresh();
  }
  const motionControl = dialogBody.querySelector('#reduce-motion');
  if (motionControl) motionControl.checked = value;
}

function showUnavailable() {
  viewer.classList.remove('with-3d');
  viewer.classList.add('without-3d');
  worldMessage.textContent = 'The 3D scene needs WebGL 2. The guided diagrams and parts are available here.';
  worldMessage.hidden = false;
}

function startTour(event) {
  event.preventDefault();
  cover.hidden = true;
  viewer.hidden = false;
  const source = coverSelect.value;
  Object.assign(state, { source, active: generation[source].stops[0], mode: 'utility', started: true, step: 0, busy: false });
  viewer.toggleAttribute('data-reduced', state.reduced);
  stage?.update(state);
  renderBeat();
  captionTitle.focus({ preventScroll: true });
  stageLoading ??= import('./stage.js').then(({ createStage }) => {
    stage = createStage({
      mount: app.querySelector('#world'), hotspots: app.querySelector('#hotspots'),
      select: () => {}, selectPart: (index) => partExplorer?.select(index), onUnavailable: showUnavailable,
    });
    worldMessage.hidden = true;
    viewer.classList.add('with-3d');
    if (state.started) {
      stage.update(state);
      updateScene();
    }
  }).catch((error) => {
    console.warn('Currentline could not start the 3D view.', error);
    showUnavailable();
  });
}

function showCover() {
  flight += 1;
  inspectionRequest += 1;
  transit.cancel();
  partExplorer?.close(false);
  state.started = false;
  state.busy = false;
  viewer.classList.remove('is-traveling');
  stage?.update({ ...state, reduced: true });
  coverSelect.value = state.source;
  viewer.hidden = true;
  cover.hidden = false;
  coverForm.querySelector('button').focus({ preventScroll: true });
}

async function openParts() {
  if (state.busy || !state.started) return;
  const request = ++inspectionRequest;
  expandButton.disabled = true;
  try {
    explorerLoading ??= import('./part-explorer.js');
    const { createPartExplorer } = await explorerLoading;
    if (request !== inspectionRequest || !state.started) return;
    partExplorer ??= createPartExplorer(partPanel, {
      reduced: () => state.reduced,
      onGeometry(geometry) {
        partGeometry = geometry;
        updateScene();
      },
      onClose(restoreFocus) {
        partGeometry = null;
        viewer.classList.remove('parts-open');
        guidedCaption.hidden = false;
        renderBeat();
        if (restoreFocus) expandButton.focus({ preventScroll: true });
      },
    });
    viewer.classList.add('parts-open');
    guidedCaption.hidden = true;
    partExplorer.open(state.active);
  } catch (error) {
    console.warn('Currentline could not load the parts view.', error);
    app.querySelector('#announcement').textContent = 'The parts view could not load.';
  } finally {
    expandButton.disabled = false;
  }
}

coverForm.addEventListener('submit', startTour);
motionPreference.addEventListener('change', (event) => setReduced(event.matches));
dialog.addEventListener('close', () => {
  dialogKind = null;
  dialogTrigger?.focus({ preventScroll: true });
});
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
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
  if (go && dialogKind === 'diagram') {
    dialog.close();
    setSelection(go, { mode: goMode ?? selectModeFor(go, state.mode) });
  }
  if (mode) {
    changeMode(mode);
    const scroll = dialogBody.scrollTop;
    renderDiagram();
    dialogBody.querySelector(`[data-mode="${mode}"]`)?.focus({ preventScroll: true });
    dialogBody.scrollTop = scroll;
  }
  if (action === 'home') showCover();
  if (action === 'close') dialog.close();
  if (action === 'prev') previousStep();
  if (action === 'next') nextStep();
  if (action === 'expand') openParts();
});
