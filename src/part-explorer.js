import { generationParts } from './parts-generation.js';
import { downstreamParts } from './parts-downstream.js';
import { components, sources } from './content.js';
import { icon } from './icons.js';

const catalog = { ...generationParts, ...downstreamParts };
const escape = (text) => String(text).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
const number = (index) => String(index + 1).padStart(2, '0');

function references(entries) {
  return entries.map(({ title, url }) =>
    `<a class="part-link" href="${escape(url)}" target="_blank" rel="noreferrer">${escape(title)} ${icon('arrow-up-right', 13)}</a>`,
  ).join('');
}

function supplierCards(vendors) {
  if (!vendors?.length) return '';
  return `<div class="supplier-list">
    <h4>Supplier examples</h4>
    <p>Public catalog examples for this part type.</p>
    ${vendors.map(({ name, url, note }) => `<div class="supplier-card">
      <a class="part-link" href="${escape(url)}" target="_blank" rel="noreferrer">${escape(name)} ${icon('arrow-up-right', 13)}</a>
      <span>${escape(note)}</span>
    </div>`).join('')}
  </div>`;
}

export function createPartExplorer({ onClose }) {
  const dialog = document.createElement('dialog');
  dialog.className = 'part-explorer';
  dialog.setAttribute('aria-labelledby', 'assembly-title');
  dialog.innerHTML = `
    <div class="assembly-bar">
      <button type="button" class="plain" data-part-action="close">${icon('arrow-left', 17)} Journey</button>
      <span>Exploded view</span>
    </div>
    <div class="assembly-content">
      <header class="assembly-header">
        <nav class="part-breadcrumb" aria-label="Assembly levels"></nav>
        <h2 id="assembly-title" tabindex="-1"></h2>
      </header>
      <div class="assembly-layout">
        <section class="assembly-visual" aria-label="Exploded model and part index">
          <div class="assembly-viewport">
            <div class="assembly-world" aria-hidden="true"></div>
            <div class="part-markers"></div>
            <span class="assembly-model-note">Schematic geometry · Scale varies</span>
          </div>
          <div class="part-rail" role="group" aria-label="Parts in this assembly"></div>
        </section>
        <aside class="part-information" aria-label="Selected part"></aside>
      </div>
    </div>
  `;
  document.body.append(dialog);
  const breadcrumbs = dialog.querySelector('.part-breadcrumb');
  const title = dialog.querySelector('#assembly-title');
  const rail = dialog.querySelector('.part-rail');
  const info = dialog.querySelector('.part-information');
  const world = dialog.querySelector('.assembly-world');
  const markers = dialog.querySelector('.part-markers');
  let path = [];
  let index = 0;
  let id;
  let reduced = false;
  let renderer;
  let rendererLoading;

  function selectedPart() {
    const node = path.at(-1);
    return node.children?.length ? node.children[index] : node;
  }

  function renderInfo() {
    const node = path.at(-1);
    const part = selectedPart();
    const original = components[id];
    const direct = part.refs?.length ? part.refs : [...path].reverse().find((ancestor) => ancestor.refs?.length)?.refs;
    const refs = direct?.length ? direct : original.sources.map((key) => ({ title: sources[key].title, url: sources[key].url }));
    const canExpand = Boolean(part !== node && part.children?.length);
    info.innerHTML = `
      <p class="part-level">${node.children?.length ? `Part ${number(index)} of ${number(node.children.length - 1)}` : 'Component detail'}</p>
      <h3 id="part-name" tabindex="-1">${escape(part.name)}</h3>
      <dl class="part-facts">
        <div><dt>What it does</dt><dd>${escape(part.job)}</dd></div>
        <div><dt>Typical material</dt><dd>${escape(part.material)}</dd></div>
      </dl>
      ${canExpand ? `<button class="primary part-enter" data-part-action="enter">Expand this part ${icon('arrow-right', 16)}</button>` : ''}
      ${supplierCards(part.vendors)}
      <details class="part-references"><summary>Technical references ${icon('chevron-down', 14)}</summary>${references(refs)}</details>
      ${path.length === 1 ? `<details class="part-references"><summary>About the assembly ${icon('chevron-down', 14)}</summary>
        <dl class="part-facts assembly-facts"><div><dt>How it works</dt><dd>${escape(original.works)}</dd></div>
        <div><dt>Assembly</dt><dd>${escape(original.assembly)}</dd></div>
        <div><dt>Connections</dt><dd>${escape(original.connection)}</dd></div></dl>
        ${node !== part ? supplierCards(node.vendors) : ''}
      </details>` : ''}
    `;
  }

  function select(indexToSelect, announce = false) {
    const node = path.at(-1);
    if (!node?.children?.[indexToSelect]) return;
    index = indexToSelect;
    renderInfo();
    for (const button of rail.children) button.setAttribute('aria-pressed', String(Number(button.dataset.part) === index));
    renderer?.highlight(index);
    if (announce) info.querySelector('h3').focus({ preventScroll: true });
  }

  function renderLevel(focus = true) {
    const node = path.at(-1);
    breadcrumbs.hidden = path.length < 2;
    breadcrumbs.innerHTML = path.map((level, levelIndex) => {
      const label = escape(level.name);
      return levelIndex === path.length - 1
        ? `<span aria-current="location">${label}</span>`
        : `<button data-level="${levelIndex}">${label}</button>`;
    }).join('<span class="breadcrumb-divider" aria-hidden="true">/</span>');
    title.textContent = node.name;
    rail.hidden = !node.children?.length;
    rail.innerHTML = (node.children ?? []).map((part, partIndex) =>
      `<button data-part="${partIndex}" aria-pressed="${partIndex === index}">
        <span>${number(partIndex)}</span><strong>${escape(part.name)}</strong>
      </button>`,
    ).join('');
    renderInfo();
    renderer?.show(node, reduced);
    renderer?.highlight(index);
    if (focus) title.focus({ preventScroll: true });
  }

  function open(componentId, options) {
    const root = catalog[componentId];
    if (!root) return false;
    id = componentId;
    path = [root];
    index = 0;
    reduced = options.reduced;
    dialog.showModal();
    dialog.querySelector('.assembly-content').scrollTop = 0;
    renderLevel();
    rendererLoading ??= import('./exploded-scene.js').then(({ createExplodedScene }) => {
      renderer = createExplodedScene(world, markers, select);
      if (dialog.open) renderLevel(false);
    }).catch(() => {
      world.innerHTML = '<p class="assembly-fallback">Select a part below to explore the assembly.</p>';
      dialog.classList.add('parts-without-webgl');
    });
    return true;
  }

  dialog.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.partAction === 'close') dialog.close();
    if (button.dataset.partAction === 'enter') {
      const part = selectedPart();
      if (!part.children?.length) return;
      path.push(part);
      index = 0;
      renderLevel();
    }
    if (button.dataset.part !== undefined) select(Number(button.dataset.part));
    if (button.dataset.level !== undefined) {
      const level = Number(button.dataset.level);
      path = path.slice(0, level + 1);
      index = 0;
      renderLevel();
    }
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || !renderer) return;
    if (event.key === '+' || event.key === '=' || event.key === '-') {
      event.preventDefault();
      renderer.zoomBy(event.key === '-' ? 1.14 : .88);
    }
  });
  dialog.addEventListener('close', onClose);

  return { open, has: (componentId) => Boolean(catalog[componentId]) };
}
