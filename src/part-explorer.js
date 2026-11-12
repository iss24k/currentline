import { generationParts } from './parts-generation.js';
import { downstreamParts } from './parts-downstream.js';
import { components, sources } from './content.js';
import { createConversionVisual, partDiagram } from './conversion-visuals.js';
import { icon } from './icons.js';

const catalog = { ...generationParts, ...downstreamParts };
const escape = (text) => String(text).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

const photography = {
  'gas-turbine': {
    file: '/reference/axial-compressor.webp',
    title: 'Axial compressor rotor',
    description: 'Rows of blades surround a shared shaft. The rows change size along the rotor.',
    author: 'Wilfredor · Deutsches Museum',
    source: 'https://commons.wikimedia.org/wiki/File:Axial_compressor_rotor_of_a_gas_turbine,_Deutsches_Museum.jpg',
    license: 'https://creativecommons.org/publicdomain/zero/1.0/',
    licenseName: 'CC0 1.0',
  },
  chip: {
    file: '/reference/processor-dies.webp',
    title: 'Exposed processor dies',
    description: 'The metal lid was removed to reveal the silicon pieces inside this AMD EPYC package.',
    author: 'Fritzchens Fritz · AMD EPYC 7702',
    source: 'https://commons.wikimedia.org/wiki/File:AMD_Epyc_7702_delidded.jpg',
    license: 'https://creativecommons.org/publicdomain/zero/1.0/',
    licenseName: 'CC0 1.0',
  },
  'rack-pdu': {
    file: '/reference/server-cabinets.webp',
    title: 'Cabinets in a real computing hall',
    description: 'Rows of cabinets group equipment into aisles so it can be supplied, serviced, and cooled.',
    author: 'Oak Ridge National Laboratory · Frontier',
    source: 'https://commons.wikimedia.org/wiki/File:Frontier_supercomputer_(12).jpg',
    license: 'https://creativecommons.org/licenses/by/2.0/',
    licenseName: 'CC BY 2.0',
  },
};

function referenceLinks(refs) {
  return refs.map(({ title, url }) =>
    `<a class="inline-link" href="${escape(url)}" target="_blank" rel="noreferrer">${escape(title)} ${icon('arrow-up-right', 12)}</a>`,
  ).join('');
}

function makerLinks(vendors) {
  if (!vendors?.length) return '';
  return `<p class="inline-label">Supplier examples</p>${vendors.map(({ name, url, note }) => `
    <a class="inline-link" href="${escape(url)}" target="_blank" rel="noreferrer">${escape(name)} ${icon('arrow-up-right', 12)}</a>
    <p class="maker-note">${escape(note)}</p>`).join('')}`;
}

export function createPartExplorer(host, { onGeometry, onClose, reduced }) {
  host.innerHTML = `
    <div class="inline-parts-top">
      <button type="button" class="text-action" data-part-action="close">${icon('arrow-left', 15)} Assemble</button>
      <nav class="inline-breadcrumbs" aria-label="Assembly levels"></nav>
    </div>
    <h2 id="inline-part-title" tabindex="-1"></h2>
    <p class="geometry-label">Schematic detail</p>
    <div class="inline-part-picker" role="group" aria-label="Parts in this assembly"></div>
    <div class="inline-part-views" role="group" aria-label="Part views">
      <button type="button" data-part-view="diagram" aria-pressed="true">Diagram</button>
      <button type="button" data-part-view="material" aria-pressed="false">Materials</button>
      <button type="button" data-part-view="references" aria-pressed="false">References</button>
      <button type="button" data-part-view="photo" aria-pressed="false" hidden>Photo</button>
    </div>
    <div class="inline-diagram" data-part-panel="diagram">
      <canvas aria-hidden="true"></canvas>
      <p class="part-job"></p>
    </div>
    <div class="inline-part-copy" data-part-panel="material" hidden></div>
    <div class="inline-part-copy" data-part-panel="references" hidden></div>
    <div class="inline-part-photo" data-part-panel="photo" hidden></div>
    <button type="button" class="primary inline-drill" data-part-action="enter">Open this part ${icon('arrow-right', 15)}</button>
  `;
  const title = host.querySelector('h2');
  const picker = host.querySelector('.inline-part-picker');
  const breadcrumbs = host.querySelector('.inline-breadcrumbs');
  const visuals = createConversionVisual(host.querySelector('canvas'));
  let path = [];
  let id;
  let index = 0;
  let view = 'diagram';

  function selectedPart() {
    const node = path.at(-1);
    return node.children?.[index] ?? node;
  }

  function setView(next) {
    view = next;
    for (const button of host.querySelectorAll('[data-part-view]')) {
      button.setAttribute('aria-pressed', String(button.dataset.partView === view));
    }
    for (const panel of host.querySelectorAll('[data-part-panel]')) panel.hidden = panel.dataset.partPanel !== view;
    if (view === 'diagram') visuals.show(partDiagram(selectedPart()), true);
  }

  function updatePart(updateGeometry = true) {
    const node = path.at(-1);
    const part = selectedPart();
    const available = photography[id];
    const original = components[id];
    const related = part.refs?.length ? part.refs : [...path].reverse().find((ancestor) => ancestor.refs?.length)?.refs;
    const refs = related?.length ? related : original.sources.map((key) => ({ title: sources[key].title, url: sources[key].url }));
    title.textContent = part.name;
    host.querySelector('.part-job').textContent = part.job;
    host.querySelector('[data-part-panel="material"]').innerHTML = `
      <p class="inline-label">Typical material</p><p>${escape(part.material)}</p>
      ${makerLinks(part.vendors)}
      ${path.length === 1 && !part.vendors?.length && node.vendors?.length
        ? `<div class="assembly-makers"><p class="inline-label">Whole assembly</p>${makerLinks(node.vendors)}</div>` : ''}
    `;
    host.querySelector('[data-part-panel="references"]').innerHTML = referenceLinks(refs);
    host.querySelector('[data-part-view="photo"]').hidden = !available;
    host.querySelector('[data-part-panel="photo"]').innerHTML = available && view === 'photo' ? `
      <figure><img src="${available.file}" alt="${escape(available.title)}">
        <figcaption>${escape(available.description)} <a href="${available.source}" target="_blank" rel="noreferrer">${escape(available.author)}</a>
        · <a href="${available.license}" target="_blank" rel="noreferrer">${available.licenseName}</a></figcaption>
      </figure>` : '';
    host.querySelector('[data-part-action="enter"]').hidden = !part.children?.length || part === node;
    for (const button of picker.children) button.setAttribute('aria-pressed', String(Number(button.dataset.partIndex) === index));
    setView(view);
    if (updateGeometry) onGeometry({
      ancestry: path, partNames: (node.children ?? []).map((child) => child.name),
      partShapes: (node.children ?? []).map((child) => child.shape), selectedIndex: index,
    });
  }

  function renderLevel() {
    const node = path.at(-1);
    breadcrumbs.innerHTML = path.map((part, depth) => depth === path.length - 1
      ? `<span aria-current="location">${escape(part.name)}</span>`
      : `<button type="button" data-part-depth="${depth}">${escape(part.name)}</button>`,
    ).join('<span aria-hidden="true">/</span>');
    picker.hidden = !node.children?.length;
    picker.innerHTML = (node.children ?? []).map((part, partIndex) =>
      `<button type="button" data-part-index="${partIndex}" aria-pressed="${partIndex === index}">${escape(part.name)}</button>`,
    ).join('');
    updatePart();
  }

  function select(next) {
    if (!path.at(-1)?.children?.[next] || next === index) return;
    index = next;
    updatePart();
    picker.children[index]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function open(componentId) {
    if (!catalog[componentId]) return;
    id = componentId;
    path = [catalog[id]];
    index = 0;
    view = 'diagram';
    host.hidden = false;
    host.scrollTop = 0;
    renderLevel();
    title.focus({ preventScroll: true });
  }

  function close(restoreFocus = true) {
    if (host.hidden) return;
    host.hidden = true;
    path = [];
    onClose(restoreFocus);
  }

  host.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const { partAction, partView, partIndex, partDepth } = button.dataset;
    if (partAction === 'close') close();
    if (partAction === 'enter') {
      const part = selectedPart();
      if (!part.children?.length || part === path.at(-1)) return;
      path.push(part);
      index = 0;
      view = 'diagram';
      renderLevel();
      title.focus({ preventScroll: true });
    }
    if (partView) {
      view = partView;
      updatePart(false);
    }
    if (partIndex !== undefined) select(Number(partIndex));
    if (partDepth !== undefined) {
      path = path.slice(0, Number(partDepth) + 1);
      index = 0;
      view = 'diagram';
      renderLevel();
      title.focus({ preventScroll: true });
    }
  });
  host.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });

  return {
    open, close, select,
    refresh() {
      if (!host.hidden && view === 'diagram') visuals.show(partDiagram(selectedPart()), reduced());
    },
  };
}
