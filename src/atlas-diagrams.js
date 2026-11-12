const arrow = '<span class="diagram-arrow" aria-hidden="true">→</span>';

const symbols = {
  sun: '<circle cx="16" cy="16" r="5"/><path d="M16 3v4m0 18v4M3 16h4m18 0h4M7 7l3 3m12 12 3 3M25 7l-3 3M10 22l-3 3"/>',
  dc: '<path d="M4 12h24M4 21h5m4 0h6m4 0h5"/>',
  ac: '<path d="M3 16c4 0 4-8 7-8s4 8 6 8 4 8 7 8 4-8 6-8"/>',
  coil: '<path d="M3 9h3a3 3 0 0 1 0 6 3 3 0 0 1 0 6H3m26-12h-3a3 3 0 0 0 0 6 3 3 0 0 0 0 6h3M14 6v20m4-20v20"/>',
  panel: '<path d="M7 7h18l4 15H3l4-15Zm-2 9h22M13 7l-2 15M19 7l2 15M16 22v5m-6 0h12"/>',
  switch: '<circle cx="7" cy="16" r="2"/><circle cx="25" cy="16" r="2"/><path d="M9 16h14m-3-6-8 12"/>',
  transfer: '<circle cx="6" cy="9" r="2"/><circle cx="6" cy="23" r="2"/><circle cx="26" cy="16" r="2"/><path d="m8 10 16 5"/>',
  battery: '<rect x="4" y="9" width="22" height="14" rx="2"/><path d="M26 13h3v6h-3M9 16h6m-3-3v6m6-3h4"/>',
  generator: '<rect x="3" y="8" width="26" height="16" rx="2"/><path d="M6 24v3m20-3v3m-17-11c2-4 4-4 6 0s4 4 6 0m3-4h1m-1 8h1"/>',
  box: '<rect x="5" y="5" width="22" height="22" rx="2"/><path d="m9 16 4-5v10l4-5 3 3 3-5"/>',
  busway: '<rect x="3" y="6" width="26" height="9" rx="1"/><path d="M6 10.5h20m-17 4.5v5m14-5v5m-18 0h8v5H5zm14 0h8v5h-8z"/>',
  outlet: '<rect x="9" y="3" width="14" height="26" rx="2"/><path d="M12 7h8v7h-8zm0 11h8v7h-8zm2-8h4m-4 11h4"/>',
  cord: '<path d="M7 4v4m5-4v4M5 8h9v4a4.5 4.5 0 0 1-9 0V8Zm4.5 9v3a6 6 0 0 0 12 0v-2M19 11h5v7h-5zm2.5-3v3"/>',
  chip: '<rect x="8" y="8" width="16" height="16" rx="2"/><path d="M12 8V4m8 4V4m-8 24v-4m8 4v-4M4 12h4m-4 8h4m16-8h4m-4 8h4m-15-2 4-4-1 3h3l-4 4"/>',
  heat: '<path d="M8 25c-5-4 5-7 0-12m8 12c-5-4 5-7 0-12m8 12c-5-4 5-7 0-12"/>',
};

export const diagrams = {
  solar: {
    nodes: [['sun', 'Sunlight'], ['panel', 'Thin-film panel'], ['dc', 'Direct current', 'DC to inverter']],
    note: 'The panel makes DC, the kind of current that flows in one direction.',
  },
  inverter: {
    nodes: [['dc', 'Array DC'], ['box', 'Inverter', 'Switches + filter'], ['coil', 'Pad transformer', 'Raises voltage'], ['ac', '34.5 kV AC', 'Collection cable']],
    note: 'AC changes direction repeatedly. The inverter creates AC and the separate pad transformer raises its voltage.',
  },
  transformer: {
    nodes: [['ac', 'Input coil', '34.5 kV AC'], ['coil', 'Steel core', 'Magnetic field'], ['ac', 'Output coil', '230 kV AC']],
    note: 'The coils are electrically separate. A changing magnetic field transfers power between them.',
  },
  intake: {
    nodes: [['ac', 'Utility AC'], ['switch', 'Switchgear', 'Protects the feed'], ['coil', 'Building transformer', 'Lowers voltage'], ['transfer', 'Transfer switch'], ['ac', '480 V AC', 'To the UPS']],
    branch: { after: 3, icon: 'generator', label: 'Generator', detail: 'Backup AC' },
    note: 'The equipment inside the campus is shown as a representative 480 V AC design.',
  },
  ups: {
    nodes: [['ac', '480 V AC'], ['box', 'Rectifier', 'AC to DC'], ['dc', 'DC link'], ['box', 'Inverter', 'DC to AC'], ['ac', '480 V AC', 'To distribution']],
    branch: { after: 2, icon: 'battery', label: 'Battery bank', detail: 'Feeds the DC link in an outage' },
    note: 'The UPS is an uninterruptible power supply. Its batteries hold up the inverter while backup generation starts.',
  },
  distribution: {
    nodes: [['ac', '480 V AC', 'From the UPS'], ['coil', 'Floor transformer', 'Lowers to 208 V AC'], ['busway', 'Busway', 'Metal bars and taps'], ['outlet', 'Rack outlets', '208 V AC'], ['cord', 'Power cord', 'To the server']],
    note: 'The floor unit also has breakers that protect the feeds to the racks. Other facilities use different voltages.',
  },
  server: {
    nodes: [['ac', '208 V AC', 'From the rack outlet'], ['box', 'Server power supply'], ['dc', '12 V DC', 'To the motherboard']],
    note: 'The supply converts AC to DC and provides electrical isolation. A connector carries the 12 V output into the server.',
  },
  regulator: {
    nodes: [['dc', '12 V DC'], ['box', 'Board regulator'], ['dc', 'About 1 V DC', 'To the processor core']],
    note: 'Switches, coils and capacitors keep the output steady as the chip’s demand changes.',
  },
  chip: {
    nodes: [['dc', 'Low-voltage DC'], ['chip', 'Transistors switch'], ['heat', 'Data signals + heat']],
    note: 'The switches process information. Almost all of the electrical energy ends up as heat and leaves through the cooler.',
  },
};

function symbol(name) {
  return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${symbols[name]}</svg>`;
}

export function diagramMarkup(id) {
  const diagram = diagrams[id];
  if (!diagram) return '';
  const nodes = diagram.nodes.map(([type, label, detail], index) => {
    const branch = diagram.branch?.after === index ? diagram.branch : null;
    return `<li class="diagram-cell"><div class="diagram-node">${symbol(type)}<span>${label}</span>${detail ? `<small>${detail}</small>` : ''}</div>
      ${branch ? `<div class="diagram-branch">${symbol(branch.icon)}<span>${branch.label}</span><small>${branch.detail}</small></div>` : ''}
      ${index === diagram.nodes.length - 1 ? '' : arrow}</li>`;
  }).join('');
  return `<figure class="power-diagram" data-diagram="${id}"><ol>${nodes}</ol><figcaption>${diagram.note}</figcaption></figure>`;
}

const partNodes = {
  solar: [1, 1, 1, 2],
  inverter: [0, 1, 1, 1, 2],
  transformer: [0, 1, 1, 2],
  intake: [1, 1, 1, 1],
  ups: [1, 'branch', 3, 2],
  distribution: [1, 1, 2, 3],
  server: [0, 1, 1, 2],
  regulator: [1, 1, 1, 1],
  chip: [0, 1, 1, 2],
};

export function highlightDiagram(diagram, id, part) {
  const key = partNodes[id]?.[part];
  const branch = diagram.querySelector('.diagram-branch');
  if (branch) branch.toggleAttribute('data-selected', key === 'branch');
  [...diagram.querySelectorAll('.diagram-node')].forEach((node, index) => {
    node.toggleAttribute('data-selected', index === key);
  });
}
