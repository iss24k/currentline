const beat = (name, explanation, input, output, form, visual, at, segment, inside = false, span, inputForm) => ({
  name, explanation, input, output, form, visual, at, segment, inside, span, inputForm,
});

const transformer = (input, output, core, inlet, outlet, action) => [
  beat('Enter the first coil', 'Changing current in the first coil creates a changing magnetic field.', input, 'Magnetic field', 'magnetic', 'transform', inlet, 0, true),
  beat('Cross the iron core', 'The field links two separate coils. Their turns set the new voltage.', 'Magnetic field', output, 'magnetic', 'transform', core, 1, true),
  beat(action, 'The second coil feeds the next line. The current is still alternating.', 'Second coil', output, 'ac', 'transform', outlet, 2),
];

export const guideSteps = {
  gas: [
    beat('Arrive in the fuel pipe', 'The gas carries stored energy in its molecules.', 'Pipeline gas', 'Fuel arriving', 'chemical', 'pipe', [-3.1, .65, 2.15], 0, false, [0, .61]),
    beat('Clean and regulate the gas', 'The filter removes debris. The regulator holds the outlet pressure steady.', 'Raw pipeline gas', 'Clean, steady fuel', 'chemical', 'filter', [-1.7, .88, 1.46], 0, true, [.57, .77]),
  ],
  'gas-turbine': [
    beat('Squeeze the air', 'Moving blades speed up the air. Fixed blades slow it and raise its pressure.', 'Outside air', 'Compressed air', 'fluid', 'compress', [-1.55, 1.83, .51], 1, true),
    beat('Burn the fuel', 'Fuel mixes with compressed air and burns. Stored energy becomes hot, expanding gas.', 'Fuel + compressed air', 'Hot gas', 'thermal', 'burn', [-.19, 1.93, .30], 0, true),
    beat('Turn the shaft', 'Expanding gas pushes the turbine blades. They turn the shaft that drives the generator.', 'Hot gas', 'Spinning shaft', 'mechanical', 'rotate', [1.43, 1.70, .45], 2, true),
  ],
  nuclear: [
    beat('Heat the first water loop', 'Splitting atoms in the fuel releases heat. Pressurized water carries it away.', 'Energy in fuel', 'Hot water', 'thermal', 'heat', [-1.22, 1.55, .20], 0, true, [0, .44]),
    beat('Make steam in a second loop', 'Heat passes through tube walls. Water on the other side boils into steam.', 'Hot water in loop 1', 'Steam in loop 2', 'thermal', 'exchange', [.75, 2.63, .14], 1, true),
  ],
  'steam-turbine': [
    beat('Guide steam onto the blades', 'Stationary vanes aim the steam onto rows of moving blades.', 'Steam from the steam generator', 'Steam at the blades', 'thermal', 'pipe', [-1.38, 1.93, .03], 0, true),
    beat('Turn the generator shaft', 'As steam expands, it pushes the blades around and turns their shared shaft.', 'Expanding steam', 'Spinning shaft', 'mechanical', 'rotate', [1.45, 1.52, .04], 0, true, [.46, 1], 'thermal'),
  ],
  solar: [
    beat('Catch sunlight in the cell', 'Light frees charge carriers in the silicon. The cell’s electric field separates them.', 'Sunlight', 'Separated charge', 'light', 'solar', [-2.1, .91, .17], 0, true),
    beat('Collect direct current', 'Metal contacts collect the charges. Connected panels send direct current down the cable.', 'Solar cell contacts', 'DC electricity', 'dc', 'wire', [2.12, .42, .12], 2),
  ],
  'solar-inverter': [
    beat('Bring in power from the panels', 'The incoming current flows in one direction. This is direct current, or DC.', 'Solar panels', 'Incoming DC', 'dc', 'wire', [-1.36, .57, .76], 0, true),
    beat('Switch to alternating current', 'Electronic switches reverse the output rhythmically. A filter smooths the pulses for the grid.', 'DC electricity', 'Grid-ready AC', 'ac', 'invert', [.63, 1.38, .57], 1, true),
  ],
  wind: [
    beat('Catch the wind', 'Air flowing over the curved blades turns the hub.', 'Moving air', 'Spinning rotor', 'mechanical', 'rotate', [0, 4.66, .77], 0, false, undefined, 'fluid'),
    beat('Make electricity in the nacelle', 'The turning rotor moves a magnetic field past coils. Electricity runs down the tower.', 'Spinning shaft', 'Variable AC', 'ac', 'induce', [0, 4.66, -.20], 2, true, [0, .41]),
  ],
  'wind-converter': [
    beat('Turn variable AC into DC', 'A rectifier turns the turbine’s changing AC into one-way current.', 'Variable AC', 'DC in the middle', 'dc', 'rectify', [-.55, 1.38, .51], 0, true),
    beat('Make AC that matches the grid', 'A second set of switches makes AC at the grid’s required frequency.', 'DC in the middle', 'Grid-ready AC', 'ac', 'invert', [1.52, 1.14, .74], 2, true),
  ],
  hydro: [
    beat('Hold water above the turbine', 'Water held high behind the dam stores energy because of its height.', 'Elevated reservoir', 'Water at the gate', 'fluid', 'reservoir', [2.42, 1.58, -2.20], 0, false, [0, .35]),
    beat('Send water down the pipe', 'The gate lets water into a large pipe that carries it down to the turbine.', 'Water behind the dam', 'Flow under pressure', 'fluid', 'pipe', [2.42, .91, -.32], 0),
  ],
  'water-turbine': [
    beat('Direct water into the runner', 'Guide vanes point water at the moving blades.', 'Water under pressure', 'Water at the blades', 'fluid', 'pipe', [.66, 1.25, -.48], 0, true),
    beat('Spin the shaft', 'The water pushes the runner around. The runner turns the shaft above it.', 'Moving water', 'Spinning shaft', 'mechanical', 'rotate', [0, 1.80, 0], 0, true, [.54, 1], 'fluid'),
  ],
  alternator: [
    beat('Turn the generator’s rotor', 'The shaft turns a part that carries a magnetic field.', 'Spinning shaft', 'Rotating magnetic field', 'magnetic', 'rotate', [-1.43, 1.54, .04], 0, true, undefined, 'mechanical'),
    beat('Make AC in stationary coils', 'The changing field pushes charges back and forth in the coils.', 'Changing field', 'Three-phase AC', 'ac', 'induce', [.43, 2.13, .58], 1, true),
  ],
  'step-up': transformer('Generator AC', '230 kV AC', [0, 1.52, .49], [-.74, 1.74, .57], [1.35, 4.49, -.56], 'Send out higher-voltage AC'),
  lines: [
    beat('Follow an overhead conductor', 'High voltage lets the line carry the same power with less current and lower heating losses.', '230 kV AC', 'Power on the line', 'ac', 'wire', [0, 2.70, .736], 0, false, [0, .62]),
    beat('Approach the receiving end', 'The line and its return paths carry power across the network. This view highlights one phase.', 'Transmission span', '230 kV AC at the yard', 'ac', 'wire', [2.25, 3.14, .736], 0, false, [.48, 1]),
  ],
  substation: transformer('230 kV AC', '13.8 kV AC', [.34, .78, -.44], [-.80, .88, -.68], [1.55, 2.51, 1.27], 'Leave on the utility feeder'),
  intake: [
    beat('Enter the service cabinet', 'The utility feeder enters through the data center’s metering and protection cabinet.', 'Utility feeder', '13.8 kV at intake', 'ac', 'wire', [-1.36, 1.78, 1.16], 0, true, [0, .45]),
    beat('Pass the closed breaker', 'Closed contacts carry current. If a fault is detected, the breaker can open the path.', 'Incoming service', 'Protected feeder', 'ac', 'contact', [1.34, 1.78, 1.16], 0, true, [.31, .82]),
  ],
  'site-transformer': transformer('13.8 kV AC', '480 V AC', [.38, 1.44, .62], [-.69, 1.67, .51], [1.43, 4.05, -.43], 'Feed the site’s 480 V system'),
  transfer: [
    beat('Choose an available source', 'The transfer switch selects the utility or standby generator supply.', 'Selected AC source', 'Switch contacts', 'ac', 'contact', [0, 1.62, .78], 0, true),
    beat('Send power toward the UPS', 'The closed contacts carry the selected supply onward at the same voltage.', 'Switch contacts', '480 V AC', 'ac', 'wire', [2.14, .39, 1.12], 0, true, [.56, 1]),
  ],
  generator: [
    beat('Burn diesel in the engine', 'Fuel burns inside the cylinders. Expanding gas pushes the pistons.', 'Stored diesel energy', 'Moving pistons', 'thermal', 'burn', [-1.21, 1.62, .55], 0, true),
    beat('Turn motion into AC', 'The pistons turn the shaft. Its generator produces 480 V AC in this example.', 'Spinning shaft', '480 V AC', 'ac', 'induce', [1.57, 1.39, .10], 2, true),
  ],
  battery: [
    beat('Release stored energy in a cell', 'Chemical reactions move ions inside the cell and drive current through the outer circuit.', 'Stored chemical energy', 'DC at the terminals', 'chemical', 'cell', [-1.10, 1.89, .66], 0, true),
    beat('Send DC to the UPS', 'Cells work together as a pack. The pack feeds the UPS while the normal supply is interrupted.', 'Cell terminals', 'DC to the inverter', 'dc', 'wire', [.57, 1.89, .95], 1, true),
  ],
  ups: [
    beat('Turn incoming AC into DC', 'A rectifier changes the alternating input into one-way current.', '480 V AC', 'DC inside the UPS', 'dc', 'rectify', [-.79, .81, .51], 0, true),
    beat('Hold a steady DC supply', 'Capacitors smooth short fluctuations. The battery can supply DC when the input fails.', 'Rectifier or battery', 'Steady DC', 'dc', 'capacitor', [1.73, 1.43, .51], 1, true),
    beat('Make clean AC again', 'An inverter switches the DC to make controlled AC for the downstream equipment.', 'Steady DC', '480 V AC', 'ac', 'invert', [.81, 2.72, .58], 2, true),
  ],
  'floor-pdu': transformer('480 V AC', '208Y/120 V AC', [.50, 1.48, .59], [-.76, 1.64, .54], [2.03, 3.82, .77], 'Feed the overhead busway'),
  busway: [
    beat('Travel along metal bars', 'Wide bars carry current through the enclosed busway over the racks.', '208Y/120 V busway', 'Power along the bars', 'ac', 'wire', [-.40, 3.89, .08], 0, true, [0, .55]),
    beat('Take the branch to this rack', 'A plug-in tap makes contact with the bars and feeds a protected branch.', 'Overhead busway', 'Rack branch circuit', 'ac', 'contact', [1.42, 3.12, .13], 0, true, [.39, 1]),
  ],
  'rack-pdu': [
    beat('Bring power down the rack', 'The rack strip distributes its input to rows of outlets.', 'Rack branch', 'Rack outlet bus', 'ac', 'wire', [2.55, 3.25, .85], 0, true, [0, .53]),
    beat('Feed one server outlet', 'This outlet puts 208 V between two phases for the server power supply.', 'Rack outlet bus', '208 V at the socket', 'ac', 'contact', [2.33, 2.08, 1.05], 0, true, [.47, 1]),
  ],
  cord: [
    beat('Pass through the power cord', 'Metal contacts connect the outlet to insulated copper conductors inside the cord.', 'Rack outlet', '208 V AC in the cord', 'ac', 'wire', [0, .58, -1.67], 0, true, [0, .58]),
    beat('Enter the server inlet', 'The connector contacts hand off the same AC to the server’s power supply.', 'Cord conductors', 'Server inlet', 'ac', 'contact', [1.98, 1.11, .75], 0, false, [.52, 1]),
  ],
  psu: [
    beat('Turn wall-style AC into DC', 'The input circuit straightens the alternating current into one-way current.', '208 V AC', 'High-voltage DC', 'dc', 'rectify', [-1.58, 1.14, .64], 0, true),
    beat('Cross a small transformer', 'Fast switches create a changing field in a small transformer. Its two coils are separated.', 'Fast electrical pulses', 'Lower-voltage pulses', 'magnetic', 'transform', [-.38, 1.10, .32], 2, true),
    beat('Send steady DC to the board', 'The output straightens and smooths those pulses into 12 V DC in this example.', 'Lower-voltage pulses', '12 V DC', 'dc', 'smooth', [1.63, 1.14, .29], 3, true),
  ],
  vrm: [
    beat('Chop the 12 V supply', 'Tiny switches rapidly connect and disconnect the input to control how much power gets through.', '12 V DC', 'Short pulses', 'dc', 'pulse', [-.88, .515, -.33], 0, true, [0, .54]),
    beat('Smooth the pulses for the chip', 'A coil and capacitors release energy between pulses, leaving a steady low voltage.', 'Short pulses', 'About 1 V DC', 'dc', 'smooth', [1.68, .81, -.25], 0, true, [.56, 1]),
  ],
  chip: [
    beat('Reach the silicon through the package', 'Fine metal connections carry low-voltage power from the board into the chip.', 'Board power rail', 'On-chip power grid', 'dc', 'wire', [-1.27, .69, -.31], 0, true, [0, .65]),
    beat('Switch transistors to do work', 'Transistors charge and discharge tiny circuits. Most of the electrical energy eventually becomes heat.', 'Power on the chip', 'Computation + heat', 'thermal', 'logic', [0, .77, -.31], 1, true),
  ],
  heat: [
    beat('Move heat out of the chip', 'Heat passes through the chip’s lid and the thin material that fills the contact gap.', 'Warm silicon', 'Heat in the sink', 'thermal', 'exchange', [-.10, .91, -.12], 0, true, [0, .52]),
    beat('Carry heat away in the air', 'Moving air takes heat from the fins. The server sends that warm air out to the facility.', 'Warm fins', 'Warm exhaust air', 'thermal', 'heat', [2.25, 1.49, -.12], 0, false, [.52, 1]),
  ],
};

const backupUps = [
  beat('Receive DC from the battery', 'When utility input is lost, the battery feeds the UPS directly with DC.', 'Battery pack', 'DC inside the UPS', 'dc', 'cell', [-1.55, 1.69, .44], 0, true),
  beat('Keep making AC', 'The inverter keeps supplying AC from the battery while the generator starts.', 'Battery DC', '480 V AC', 'ac', 'invert', [.81, 2.72, .58], 1, true),
];

export function stepsFor(id, mode) {
  return id === 'ups' && mode === 'battery' ? backupUps : guideSteps[id];
}
