export const powerRoutes = {
  solar: {
    ends: ['Sunlight', 'Array DC'],
    beats: [
      ['light', 'Sunlight hits the cell', 'Light passes through the glass and releases charge inside the thin film.'],
      ['dc', 'Contacts collect the charge', 'Connected cell strips send direct current in one direction.'],
      ['dc', 'DC leaves under the panel', 'The junction box connects the cell strips to cables under the row.'],
    ],
    handoff: ['dc', 'Follow the array cables', 'Cables combine the DC from panel strings and carry it to the inverter.'],
  },
  inverter: {
    ends: ['Array DC', '34.5 kV AC'],
    beats: [
      ['dc', 'DC enters at the terminals', 'The array cables land on protected terminals inside the cabinet.'],
      ['ac', 'The inverter makes AC', 'Fast switches alternate the output and a filter smooths the wave.'],
      ['magnetic', 'The pad transformer raises voltage', 'Its separate windings transfer power to the 34.5 kV collection network.'],
    ],
    handoff: ['ac', 'Follow the collection cable', 'The 34.5 kV AC feeders carry power from inverter blocks to the main transformer.'],
  },
  transformer: {
    ends: ['34.5 kV AC', '230 kV AC'],
    beats: [
      ['ac', '34.5 kV enters the first winding', 'Current in the input coil creates a changing magnetic field.'],
      ['magnetic', 'Power crosses through a magnetic field', 'The steel core links two electrically separate windings.'],
      ['ac', '230 kV leaves the second winding', 'More turns on the output side produce higher voltage. The current still alternates.'],
    ],
    handoff: ['ac', 'Follow the 230 kV connection', 'The plant connection leads to Pinal Central Substation.'],
  },
  intake: {
    ends: ['Utility AC', '480 V AC'],
    beats: [
      ['ac', 'Utility AC reaches the switchgear', 'A breaker can open the incoming circuit if a fault is detected.'],
      ['ac', 'Busbars carry the protected feed', 'Metal bars connect the service cable to the building equipment.'],
      ['ac', 'Building transformer lowers the voltage', 'In this example it supplies 480 V AC to the transfer switch.'],
    ],
    handoff: ['ac', 'Follow the 480 V feed', 'The transfer switch sends utility or generator AC to the UPS.'],
  },
  ups: {
    ends: ['480 V AC', '480 V AC'],
    beats: [
      ['ac', '480 V AC enters the UPS', 'The rectifier converts it to DC for the common internal link.'],
      ['dc', 'DC feeds the inverter', 'Batteries can support this link while the generator starts.'],
      ['ac', 'The UPS rebuilds steady AC', 'The inverter supplies the floor distribution equipment.'],
    ],
    handoff: ['ac', 'Follow the protected AC feed', 'The UPS sends 480 V AC to floor distribution.'],
  },
  distribution: {
    ends: ['480 V AC', '208 V AC'],
    beats: [
      ['ac', 'The floor unit receives 480 V AC', 'Its transformer lowers the voltage for this rack circuit.'],
      ['magnetic', 'The floor transformer lowers voltage', 'Fewer turns on its output winding give a lower AC voltage.'],
      ['ac', '208 V AC heads to the rack', 'Busway and breakers carry the feed to the rack outlets.'],
    ],
    handoff: ['ac', 'Follow the rack power cord', 'The cord takes 208 V AC from a rack outlet to the server inlet.'],
  },
  server: {
    ends: ['208 V AC', '12 V DC'],
    beats: [
      ['ac', 'The server receives 208 V AC', 'The inlet and filter pass power into the supply.'],
      ['magnetic', 'A small transformer lowers the voltage', 'The AC is first rectified, then switched in pulses that cross the transformer.'],
      ['dc', '12 V DC leaves the supply', 'The output circuit straightens and smooths the pulses for the motherboard.'],
    ],
    handoff: ['dc', 'Follow the 12 V connection', 'A power connector and board conductors deliver DC to the voltage regulator.'],
  },
  regulator: {
    ends: ['12 V DC', 'About 1 V DC'],
    beats: [
      ['dc', '12 V DC arrives at the board', 'Electronic switches turn the input on and off in quick pulses.'],
      ['dc', 'The coil smooths the pulses', 'The coil stores energy briefly as current builds and releases it between pulses.'],
      ['dc', 'Steady low-voltage power leaves', 'Capacitors help hold the output voltage as the chip’s demand changes.'],
    ],
    handoff: ['dc', 'Follow the copper traces', 'Low-voltage power runs through the board and package contacts to the chip.'],
  },
  chip: {
    ends: ['Low-voltage DC', 'Heat leaves'],
    beats: [
      ['dc', 'Power enters the package', 'Package contacts and fine metal lines distribute power inside the chip.'],
      ['dc', 'Transistors switch to process data', 'They charge and discharge tiny circuits as they work.'],
      ['thermal', 'Heat leaves the silicon', 'The heat spreader carries most of the energy drawn by the chip toward its cooler.'],
    ],
  },
};

export const sceneJoins = {
  'eleven-mile': { site: 'solar', form: 'light', label: 'From the field to one panel' },
  transformer: { site: 'solarSubstation', form: 'ac', label: '230 kV AC to Pinal Central' },
  mesa: { site: 'pricklyPear', form: 'ac', label: 'Utility AC to the building intake' },
};

export const formNames = {
  light: 'Sunlight', dc: 'Direct current', ac: 'Alternating current', magnetic: 'Magnetic transfer', thermal: 'Heat',
};

export const powerNotes = {
  solar: [
    ['Front layer', 'Light continues through the glass to the film. A clear conductive coating underneath helps collect charge.'],
    ['Where light becomes electricity', 'Light frees charge carriers in the semiconductor. The cell’s internal field separates them and creates a voltage.'],
    ['Path between cells', 'Laser-scribed grooves divide the film into strips and connect neighboring cells. Metal ribbons take the combined output to the back of the panel.'],
    ['Connection to the field cable', 'The junction box protects the connections on the back of the panel. Its two leads plug into other modules or the array wiring.'],
  ],
  inverter: [
    ['Where the cable lands', 'The DC leads join metal terminals inside the cabinet. Input protection can disconnect the conversion circuit.'],
    ['Where DC becomes AC', 'The switches rapidly connect the output to the positive and negative sides of the DC supply in a timed pattern.'],
    ['Where the wave is smoothed', 'Coils and capacitors remove much of the high-frequency ripple before AC leaves the cabinet.'],
    ['The controller’s job', 'It measures the grid’s voltage and timing, then tells the switches when to fire. It controls the path without carrying the main power.'],
    ['Where voltage rises', 'This separate transformer feeds the plant’s collection cables at 34.5 kV AC. A magnetic field transfers power between its two windings.'],
  ],
  transformer: [
    ['First electrical circuit', 'Insulated copper turns surround a leg of the steel core. Alternating current in this winding makes the field change.'],
    ['Between the circuits', 'Stacked sheets of electrical steel guide the magnetic field. The field links the windings across insulation.'],
    ['Second electrical circuit', 'The changing field induces a voltage in the second winding. More turns give a higher voltage than on the input side.'],
    ['Connection through the tank', 'A bushing lets a live conductor pass through the grounded metal enclosure. Insulation separates the two.'],
  ],
  intake: [
    ['Where the feed can be opened', 'Normal current passes through closed contacts. Protection can command the contacts to separate inside the vacuum interrupter.'],
    ['Between cabinets', 'Thick metal conductors carry the three phases separately through the switchgear.'],
    ['Cable into switchgear', 'The termination controls the electric field where the cable insulation ends and the conductor meets the cabinet.'],
    ['Sensing branch', 'The relay monitors measurements from sensors. When it detects a fault, it sends a trip signal to the breaker.'],
  ],
  ups: [
    ['Where AC becomes DC', 'Electronic switching draws power from the AC feed and maintains the DC link.'],
    ['Stored energy during a failure', 'Cells store energy chemically. The battery bank feeds DC to the link while the generator starts.'],
    ['Where DC becomes AC again', 'Fast switches and a filter rebuild a steady AC wave for the load.'],
    ['Junction inside the UPS', 'The rectifier, battery system and inverter meet at the common DC link. Capacitors help keep its voltage steady.'],
  ],
  distribution: [
    ['Voltage change on the floor', 'A magnetic field transfers power between two windings. The example’s output provides 208 V between phases.'],
    ['Protection on each outgoing feed', 'Each breaker can isolate its own circuit. The busway or cable beyond it carries power toward the rack.'],
    ['Overhead connection', 'Separate conductors run along the enclosure. A tap connects one branch circuit to the bars.'],
    ['Last connection before the server', 'A rack power strip presents the protected feed at outlets. Each server takes it through a cord and plug.'],
  ],
  server: [
    ['First stop inside the supply', 'The inlet connects the server cord. Coils and capacitors in the filter keep switching noise from flowing back along it.'],
    ['Where AC becomes DC', 'The input stage rectifies the AC and holds up a higher-voltage internal DC supply.'],
    ['Between isolated circuits', 'Switches turn DC into fast pulses. A small transformer passes their energy across insulation to the lower-voltage side.'],
    ['Where 12 V DC leaves', 'The output is rectified and smoothed before it reaches the metal contacts that mate with the server board or backplane.'],
  ],
  regulator: [
    ['A feedback loop', 'The controller checks the output against its target. It adjusts how long the switches stay on.'],
    ['Where the pulses start', 'Power transistors connect and disconnect the 12 V input rapidly, setting the average voltage.'],
    ['Between pulses', 'Current in the coil creates a magnetic field. The field releases energy to the output as the switch state changes.'],
    ['Next to the processor rail', 'Capacitors release or absorb charge when the processor’s demand changes suddenly.'],
  ],
  chip: [
    ['Power enters the package', 'Metal contacts connect the package to the board. Internal conductors fan out the connections to the die.'],
    ['Power reaches the die', 'Layers of microscopic wiring distribute power and connect the circuits etched into the silicon.'],
    ['Where computation happens', 'A small voltage turns each transistor on or off. Billions of switches work together to process information.'],
    ['Where the heat goes', 'Heat moves through a thin interface into the metal lid and on to the cooler.'],
  ],
};

export function easeBetween(value, start, end) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

export const transitionNotes = {
  'solar>solar-inverter': 'Cables collect DC from panel strings and carry it to the inverter cabinet.',
  'solar-inverter>step-up': 'The pad transformer sends 34.5 kV AC toward the main transformer.',
  'intake>site-transformer': 'The service cable carries protected utility AC to the building transformer.',
  'site-transformer': {
    ac: 'The building transformer takes medium-voltage AC and supplies 480 V AC in this example.',
    magnetic: 'The input and output windings exchange energy through a changing magnetic field.',
  },
  'site-transformer>transfer': 'The building transformer’s 480 V AC output goes to the transfer switch.',
  transfer: 'The switch selects the utility feed during normal operation, or the generator after a utility failure.',
  'transfer>ups': 'The selected 480 V AC feed goes into the UPS.',
  'ups>floor-pdu': 'The UPS sends its 480 V AC output to the floor distribution transformer.',
  'floor-pdu>busway': 'The floor transformer supplies 208 V AC for this rack circuit.',
  busway: 'Protected metal bars carry power overhead. A tap connects a branch to one rack.',
  'busway>rack-pdu': 'A protected branch feeds the rack power strip.',
  'rack-pdu': 'The rack power strip distributes the 208 V AC feed to server outlets.',
  'rack-pdu>cord': 'The server cord plugs into one of the rack outlets.',
  cord: 'Insulated conductors carry 208 V AC to the server’s power inlet.',
  'cord>psu': 'The plug mates with the inlet of the server power supply.',
  'psu>vrm': 'Metal contacts and conductors carry 12 V DC from the server supply to the board.',
  'vrm>chip': 'Copper traces and package contacts carry steady low-voltage DC to the processor.',
};
