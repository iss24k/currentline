const point = (name, form) => ({ name, form });
const flow = (place, path, storage) => ({ place, path: path.map(([name, form]) => point(name, form)), storage });

export const energy = {
  gas: flow('Fuel receiving yard', [['Pipeline gas', 'chemical'], ['Filter & regulator', 'chemical'], ['Fuel manifold', 'chemical']], 'Chemical energy is stored in the natural gas. The gas carries it through the pipe to the combustor.'),
  'gas-turbine': flow('Power plant · turbine hall', [['Fuel injector', 'chemical'], ['Hot gas', 'thermal'], ['Rotor shaft', 'mechanical']], 'Fuel stores chemical energy. Combustion releases it as heat, and expanding gas drives the rotor.'),
  nuclear: flow('Generating station · containment', [['Fission', 'nuclear'], ['Primary water', 'thermal'], ['Secondary steam', 'thermal']], 'Nuclear energy is stored in the fuel nuclei. The closed primary loop carries heat to the steam generator.'),
  'steam-turbine': flow('Generating station · turbine hall', [['Steam inlet', 'thermal'], ['Turbine stages', 'thermal'], ['Rotor shaft', 'mechanical']]),
  solar: flow('Solar farm · module rows', [['Sunlight', 'light'], ['Silicon cells', 'dc'], ['String cables', 'dc']]),
  'solar-inverter': flow('Solar farm · inverter pad', [['String DC', 'dc'], ['Switching bridge', 'dc'], ['Grid AC', 'ac']]),
  wind: flow('Wind farm · tower and nacelle', [['Moving air', 'fluid'], ['Blades & shaft', 'mechanical'], ['Generator AC', 'ac']]),
  'wind-converter': flow('Wind farm · converter cabinet', [['Variable AC', 'ac'], ['DC link', 'dc'], ['Grid AC', 'ac']]),
  hydro: flow('Hydroelectric station · dam crest', [['High reservoir', 'fluid'], ['Intake gate', 'fluid'], ['Penstock', 'fluid']], 'Water held higher than the outlet stores gravitational potential energy. Falling water can deliver that energy to the runner.'),
  'water-turbine': flow('Hydroelectric station · powerhouse', [['Penstock flow', 'fluid'], ['Runner', 'mechanical'], ['Rotor shaft', 'mechanical']]),
  alternator: flow('Generating station · generator hall', [['Spinning shaft', 'mechanical'], ['Magnetic coupling', 'magnetic'], ['Three-phase AC', 'ac']]),
  'step-up': flow('Generating station · switchyard', [['Generator AC', 'ac'], ['Core & windings', 'magnetic'], ['230 kV AC', 'ac']]),
  lines: flow('High-voltage transmission corridor', [['Tower conductors', 'ac'], ['230 kV AC', 'ac'], ['Substation inlet', 'ac']]),
  substation: flow('Utility · outdoor substation', [['230 kV AC', 'ac'], ['Step-down transformer', 'magnetic'], ['13.8 kV AC', 'ac']]),
  intake: flow('Data center · service entrance', [['13.8 kV feeder', 'ac'], ['Metering & breaker', 'ac'], ['Site transformer', 'ac']]),
  'site-transformer': flow('Data center · transformer yard', [['13.8 kV AC', 'ac'], ['Core & windings', 'magnetic'], ['480 V AC', 'ac']]),
  transfer: flow('Data center · electrical room', [['Selected 480 V AC', 'ac'], ['Transfer contacts', 'ac'], ['UPS input', 'ac']]),
  generator: flow('Data center · standby generator yard', [['Diesel fuel', 'chemical'], ['Engine shaft', 'mechanical'], ['480 V AC', 'ac']], 'Chemical energy is stored in the diesel fuel. The engine converts part of it to shaft work.'),
  battery: flow('Data center · battery room', [['Cell electrodes', 'chemical'], ['Pack terminals', 'dc'], ['UPS DC link', 'dc']], 'Electrochemical energy is stored in the cell materials. The pack supplies DC to the UPS inverter during the outage bridge.'),
  ups: flow('Data center · UPS room', [['480 V AC', 'ac'], ['DC link', 'dc'], ['480 V AC', 'ac']], 'The DC-link capacitors buffer brief fluctuations. The connected battery holds the reserve energy used during an outage.'),
  'floor-pdu': flow('Data center · electrical distribution', [['480 V AC', 'ac'], ['PDU transformer', 'magnetic'], ['208Y/120 V AC', 'ac']]),
  busway: flow('Data hall · overhead distribution', [['208Y/120 V AC', 'ac'], ['Enclosed busbars', 'ac'], ['Rack tap-off', 'ac']]),
  'rack-pdu': flow('Data hall · server rack', [['Rack feed', 'ac'], ['Rack PDU bus', 'ac'], ['208 V outlet', 'ac']]),
  cord: flow('Data hall · rear of the rack', [['PDU receptacle', 'ac'], ['Cord conductors', 'ac'], ['Server inlet', 'ac']]),
  psu: flow('Server chassis · power bay', [['208 V AC', 'ac'], ['Rectifier & switching', 'dc'], ['12 V DC', 'dc']]),
  vrm: flow('Motherboard · processor power rail', [['12 V DC', 'dc'], ['Switches & inductor', 'dc'], ['≈1 V core rail', 'dc']], 'The inductor and capacitors store and release small amounts of energy each switching cycle.'),
  chip: flow('Processor · package and die', [['Low-voltage DC', 'dc'], ['Power grid & transistors', 'dc'], ['Heat in the die', 'thermal']]),
  heat: flow('Server chassis · heat leaving the processor', [['Die & spreader', 'thermal'], ['Thermal interface & fins', 'thermal'], ['Warm exhaust air', 'thermal']]),
};

export const formNames = {
  chemical: 'Chemical', thermal: 'Heat', mechanical: 'Mechanical', ac: 'AC electricity',
  dc: 'DC electricity', magnetic: 'Magnetic field', fluid: 'Moving or elevated fluid', light: 'Light', nuclear: 'Nuclear',
};
