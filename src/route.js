export const phases = [
  { id: 'generation', title: 'Generation', caption: 'Make electricity', icon: 'flame' },
  { id: 'grid', title: 'The grid', caption: 'Move it long distances', icon: 'utility-pole' },
  { id: 'facility', title: 'Data center', caption: 'Protect and distribute it', icon: 'building-2' },
  { id: 'server', title: 'Rack & server', caption: 'Deliver it to the chip', icon: 'cpu' },
];

export const generation = {
  gas: { title: 'Natural gas', icon: 'flame', stops: ['gas', 'gas-turbine', 'alternator'] },
  nuclear: { title: 'Nuclear', icon: 'atom', stops: ['nuclear', 'steam-turbine', 'alternator'] },
  solar: { title: 'Solar', icon: 'sun', stops: ['solar', 'solar-inverter'] },
  wind: { title: 'Wind', icon: 'wind', stops: ['wind', 'wind-converter'] },
  hydro: { title: 'Hydroelectric', icon: 'droplets', stops: ['hydro', 'water-turbine', 'alternator'] },
};

export const grid = ['step-up', 'lines', 'substation'];
export const siteEntry = ['intake', 'site-transformer'];
export const siteOutput = ['ups', 'floor-pdu', 'busway'];
export const server = ['rack-pdu', 'cord', 'psu', 'vrm', 'chip'];

export const modes = {
  utility: {
    title: 'Utility power', short: 'Utility', icon: 'utility-pole',
    note: 'The utility supplies the load. The UPS conditions the AC and keeps its battery ready.',
    branch: [...siteEntry, 'transfer'],
  },
  battery: {
    title: 'Outage · battery bridge', short: 'Battery bridge', icon: 'battery-charging',
    note: 'Utility power has dropped. Stored energy feeds the UPS inverter while the standby generator starts.',
    branch: ['battery'],
  },
  generator: {
    title: 'Outage · generator online', short: 'Generator online', icon: 'fuel',
    note: 'The generator is ready. Transfer equipment selects generator AC to feed the UPS and downstream equipment.',
    branch: ['generator', 'transfer'],
  },
};

export const positions = {
  'step-up': [24, 0.7], lines: [32, -1.0], substation: [40, 0.5],
  intake: [56, 0.4], 'site-transformer': [64, 0.4], transfer: [72, 0.4],
  generator: [64, -8.1], battery: [73, -7.6], ups: [81, 0.4],
  'floor-pdu': [89, 0.4], busway: [97, 0.4],
  'rack-pdu': [114, 0.4], cord: [122, -0.4], psu: [130, 0.4],
  vrm: [138, -0.4], chip: [146, 0.4],
};

export const modelLabels = {
  gas: 'Gas supply', 'gas-turbine': 'Gas turbine', nuclear: 'Reactor', 'steam-turbine': 'Steam turbine',
  solar: 'PV array', 'solar-inverter': 'Solar inverter', wind: 'Wind turbine', 'wind-converter': 'Converter',
  hydro: 'Reservoir & dam', 'water-turbine': 'Water turbine', alternator: 'Generator',
  'step-up': 'Step-up transformer', lines: 'Transmission', substation: 'Substation',
  intake: 'MV intake', 'site-transformer': 'Site transformer', transfer: 'Transfer switchgear',
  generator: 'Standby generator', battery: 'Battery bank', ups: 'Online UPS',
  'floor-pdu': 'Floor PDU', busway: 'Busway', 'rack-pdu': 'Rack PDU', cord: 'Power cord',
  psu: 'Server PSU', vrm: 'Voltage regulator', chip: 'Processor',
};

const facility = [...siteEntry, 'generator', 'transfer', 'battery', ...siteOutput];
export const modelPhase = Object.fromEntries([
  [Object.values(generation).flatMap(({ stops }) => stops), 'generation'],
  [grid, 'grid'], [facility, 'facility'], [server, 'server'],
].flatMap(([ids, phase]) => ids.map((id) => [id, phase])));

export function routeFor(source, mode) {
  return [...generation[source].stops, ...grid, ...modes[mode].branch, ...siteOutput, ...server];
}

export function visibleStops(source, phase) {
  if (phase === 'generation') return generation[source].stops;
  if (phase === 'grid') return grid;
  if (phase === 'facility') return facility;
  return server;
}

export function positionFor(id, source) {
  if (modelPhase[id] !== 'generation') return positions[id];
  const index = generation[source].stops.indexOf(id);
  return [[-5.1, 0.6], [3.7, -0.45], [11.3, -1.6]][index];
}

export function selectModeFor(id, mode) {
  if (id === 'battery') return 'battery';
  if (id === 'generator') return 'generator';
  if (siteEntry.includes(id)) return 'utility';
  if (id === 'transfer' && mode === 'battery') return 'utility';
  return mode;
}
