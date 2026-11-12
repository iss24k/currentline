import { sources } from './content.js';

const references = (...ids) => ids.map((id) => ({
  title: `${sources[id].organization} · ${sources[id].title}`,
  url: sources[id].url,
}));

const product = (id, note) => ({
  name: sources[id].organization,
  url: sources[id].url,
  note,
});

const supplier = (name, url, note) => ({ name, url, note });
const ref = (title, url) => ({ title, url });
const part = (name, shape, job, material, details = {}) => ({ name, shape, job, material, ...details });

const spec = {
  electricalSteel: 'https://www.clevelandcliffs.com/operations/steelmaking/zanesville-works',
  spacers: 'https://www.weidmann-electrical.com/products/insulation-components/spacing-elements/',
  paper: 'https://www.weidmann-electrical.com/products/insulation-paper/',
  bushing: 'https://www.hitachienergy.com/in/en/products-and-solutions/insulation-and-components/transformer-insulation-components/transformer-bushings',
  bushTechnologies: 'https://www.hitachienergy.com/latam/es/products-and-solutions/insulation-and-components/transformer-insulation-components/transformer-bushings/technologies',
  acsr: 'https://www.southwire.com/wire-cable/bare-aluminum-overhead-transmission-distribution/acsr/p/SPEC80100',
  insulator: 'https://www.hubbell.com/hubbellpowersystems/en/products/quadri-sil-suspension-insulator/p/1449603',
  interrupter: 'https://www.eaton.com/us/en-us/products/electrical-circuit-protection/vacuum-interrupters/vacuum-interrupters---fundamentals-of-vacuum-interrupter-technol.html',
  interrupterCatalog: 'https://www.eaton.com/us/en-us/catalog/electrical-circuit-protection/custom-vacuum-interrupters.html',
  currentTransformer: 'https://www.gevernova.com/electrification/equipment/instrument-transformers/5-345-kv-class-indoor-current-transformers',
  lowVoltageCurrentTransformer: 'https://www.eaton.com/us/en-us/catalog/low-voltage-power-distribution-controls-systems/10ma-solid-core-current-transformer.html',
  relay: 'https://selinc.com/products/751/',
  hvBreaker: 'https://www.siemens-energy.com/global/en/home/products-services/product-offerings/circuit-breakers.html',
  disconnector: 'https://stage.gevernova.com/grid-solutions/sites/default/files/2025-01/disconnector_brochure-en-33270-202405-ltr.pdf',
  arrester: 'https://www.gevernova.com/grid-solutions/sites/default/files/resources/products/brochures/arrestertranquellpolyporceint.pdf',
  mvCable: 'https://www.southwire.com/medias/sys_master/root/h59/h80/8890434158622/HVTC-CU-3C-220TRXLPE-TS-PVC-15KV-133-CSA-U33.pdf',
  termination: 'https://www.3m.com/3M/en_US/p/d/b5005113058/',
  transfer: 'https://www.eaton.com/us/en-us/catalog/low-voltage-power-distribution-controls-systems/contactor-type-automatic-transfer-switch.html',
  transferManual: 'https://www.eaton.com/content/dam/eaton/products/low-voltage-power-distribution-control-systems/ats/resources/atssecn3ot916-ib140052en.pdf',
  lvBreaker: 'https://www.productinfo.schneider-electric.com/masterpact-mtz/5bec4e87347bdf0001da09c1/English/English/0614IB1701EN%20Masterpact%20MTZ2_MTZ3%20User%20Guide%20%28bookmap%29_0000154416.xml/%24/MasterpactMTZ2MTZ3DrawoutDevice-E1B186D9',
  dieselEngine: 'https://www.cummins.com/en-na/g-drive-engines/products/diesel-qsk60-series',
  alternator: 'https://www.stamford-avk.com/case-studies/STAMFORD-alternators-critical-power-northern-european-data-centre',
  voltageRegulator: 'https://www.stamford-avk.com/parts/avr/mx341',
  dieselSet: 'https://www.cummins.com/en-na/generators/products/qsk60?v=3031',
  cellMaterials: 'https://www.energy.gov/sites/default/files/2023-07/Technology%20Strategy%20Assessment%20-%20Lithium-ion_0.pdf',
  separator: 'https://www.celgard.com/technology/base-films',
  dcLink: 'https://www.tdk-electronics.tdk.com/inf/20/50/ds/mkp_dc_hf-b25696h.pdf',
  commonModeChoke: 'https://www.coilcraft.com/en-us/products/emi/power-line-common-mode-choke/high-isolation/cmt/',
  ferrite: 'https://www.tdk-electronics.tdk.com/en/529404/products/product-catalog/ferrites-and-accessories/ferrite-materials',
  busTrack: 'https://www.eaton.com/us/en-us/catalog/low-voltage-power-distribution-controls-systems/eaton-pdi-busway.html',
  c13: 'https://www.schurter.com/en/datasheet/4782',
  c14: 'https://www.schurter.com/en/part/6100.4230',
  syncRectifier: 'https://www.ti.com/lit/ds/symlink/ucc24624.pdf',
  powerStage: 'https://www.ti.com/product/CSD95490Q5MC',
  inductor: 'https://www.coilcraft.com/en-us/products/power/shielded-inductors/molded-inductor/xal/',
  mlcc: 'https://www.murata.com/support/faqs/capacitor/ceramiccapacitor/conf/0001',
  substrate: 'https://www.ibiden.com/product/electronics/merchandise/fliptippkg/',
  interconnect: 'https://research.ibm.com/blog/beol-cu-interconnects-iedm',
  highK: 'https://www.intel.com/content/dam/doc/white-paper/high-k-metal-gate-in-silicon-nonsilicon-nanotech-paper.pdf',
  cooling: 'https://www.energy.gov/cmei/femp/articles/best-practices-guide-energy-efficient-data-center-design',
};

function magneticCore() {
  return part('Magnetic core', 'core', 'Guides the changing magnetic field through both windings.', 'Laminated electrical steel', {
    children: [
      part('Core limb', 'stack', 'Forms the vertical magnetic path through the winding window.', 'Stacked electrical-steel sheets', {
        children: [
          part('Electrical steel sheet', 'layer', 'Thin sheets limit circulating eddy currents in the core.', 'Typically grain-oriented silicon steel', {
            vendors: [supplier('Cleveland-Cliffs', spec.electricalSteel, 'Grain-oriented electrical steel produced at Zanesville Works.')],
            refs: [ref('Cleveland-Cliffs · Zanesville Works product scope', spec.electricalSteel)],
          }),
          part('Lamination coating', 'layer', 'Electrically separates adjacent sheets.', 'Thin electrically insulating coating'),
        ],
      }),
      part('Yoke', 'plate', 'Closes the magnetic path across the ends of the limbs.', 'Stacked electrical-steel sheets'),
      part('Core clamp', 'bolt', 'Holds the laminated assembly firmly together.', 'Steel plates and hardware'),
    ],
  });
}

function windings(dry) {
  const insulation = dry ? 'Insulating film or varnish system' : 'Kraft cellulose paper';
  const turnWrap = () => part('Turn insulation', 'layer', 'Keeps neighboring turns at different voltages electrically separate.', insulation, dry ? {} : {
    vendors: [supplier('Weidmann Electrical Technology', spec.paper, 'Insulation paper for transformer applications.')],
  });

  return part('Winding assembly', 'coil', 'Two isolated coils exchange energy through a shared magnetic field.', dry ? 'Insulated copper or aluminum and air' : 'Insulated copper or aluminum and dielectric liquid', {
    children: [
      part('Higher-voltage winding', 'coil', 'Its greater number of turns produces the higher AC voltage.', 'Copper or aluminum conductor', {
        children: [
          part('Winding turn', 'ring', 'Contributes one loop to the total turns that set the voltage ratio.', 'Wound copper or aluminum'),
          turnWrap(),
        ],
      }),
      part('Lower-voltage winding', 'coil', 'Its fewer turns carry the lower-voltage, higher-current side.', 'Copper or aluminum conductor', {
        children: [
          part('Parallel conductors', 'stack', 'Share winding current in designs with several conductor strands.', 'Insulated metal strands or foil'),
          part('End lead', 'cable', 'Connects the winding to its terminal.', 'Insulated copper or aluminum'),
        ],
      }),
      part('Interwinding insulation', 'insulator', 'Maintains separation between the high- and low-voltage windings.', dry ? 'Solid dielectric barriers and air clearances' : 'Oil-filled gaps and cellulose pressboard', dry ? {
        children: [
          part('Cooling air channel', 'pipe', 'Lets air move past the insulated coil surfaces.', 'Air space'),
          part('Winding support', 'block', 'Keeps the winding in position under operating forces.', 'Rigid electrical insulation'),
        ],
      } : {
        vendors: [supplier('Weidmann Electrical Technology', spec.spacers, 'Transformerboard spacers, strips and spacing assemblies.')],
        children: [
          part('Radial spacer', 'block', 'Holds an insulating and cooling gap between winding sections.', 'Transformerboard'),
          part('Insulating cylinder', 'shell', 'Separates concentric windings electrically.', 'Cellulose pressboard'),
          part('Liquid duct', 'pipe', 'Lets dielectric liquid reach surfaces within the winding pack.', 'Liquid-filled channel'),
        ],
      }),
    ],
  });
}

function transformerBushing() {
  return part('High-voltage bushing', 'insulator', 'Carries a live conductor through the grounded tank wall.', 'Conductor surrounded by dielectric material', {
    vendors: [supplier('Hitachi Energy', spec.bushing, 'Transformer bushings, including oil-impregnated condenser types.')],
    refs: [ref('Hitachi Energy · Transformer bushing technologies', spec.bushTechnologies)],
    children: [
      part('Central conductor', 'shaft', 'Carries current from the external terminal to the internal winding lead.', 'Copper or other conducting metal'),
      part('Condenser core', 'stack', 'Graded conductive layers spread the electric field through the bushing.', 'Foil electrodes and oil-impregnated kraft paper', {
        children: [
          part('Grading foil', 'layer', 'Acts as one electrode in the capacitive field-grading stack.', 'Conductive foil'),
          part('Dielectric paper wrap', 'layer', 'Separates foil layers and absorbs dielectric oil.', 'Kraft cellulose paper and mineral oil'),
        ],
      }),
      part('Weather housing', 'shell', 'External sheds lengthen the path a surface discharge would have to follow.', 'Porcelain or silicone composite, depending on design'),
      part('Mounting flange', 'ring', 'Supports the bushing and closes the tank opening around it.', 'Metal flange and sealing gasket'),
    ],
  });
}

function liquidTransformer(name, job, options = {}) {
  return part(name, 'assembly', job, 'Electrical steel, insulated windings, liquid dielectric and steel tank', {
    ...options,
    refs: options.refs ?? references('transformer', 'gsu', 'transformerBuild'),
    children: [
      windings(false),
      magneticCore(),
      transformerBushing(),
      part('Tank and cooling', 'tank', 'Contains dielectric fluid and transfers winding heat to outdoor air.', 'Welded steel and insulating liquid', {
        children: [
          part('Main tank', 'case', 'Encloses and protects the core and coils.', 'Welded steel plate'),
          part('Dielectric fluid', 'layer', 'Insulates the energized assembly and carries heat away from it.', 'Mineral oil or an approved ester fluid'),
          part('Radiator panels', 'panel', 'Expose more surface to the air so the circulating fluid can reject heat.', 'Formed steel channels'),
        ],
      }),
    ],
  });
}

function dryTransformer(name, job, options = {}) {
  return part(name, 'assembly', job, 'Electrical steel, insulated windings and ventilated enclosure', {
    ...options,
    refs: options.refs ?? references('transformer', 'dryTransformer', 'architecture'),
    children: [
      windings(true),
      magneticCore(),
      part('Input and output terminals', 'contact', 'Join the winding leads to the site feeders.', 'Conductive lugs and insulated supports', {
        children: [
          part('Phase terminal', 'plate', 'Provides a connection to one winding end.', 'Copper or plated metal'),
          part('Neutral junction', 'contact', 'Joins the three secondary windings at their common wye point.', 'Conductive terminal bar'),
          part('Terminal support', 'insulator', 'Keeps a live terminal clear of the enclosure.', 'Rigid insulating polymer or ceramic'),
        ],
      }),
      part('Ventilated enclosure', 'case', 'Guards the energized assembly and leaves a path for cooling air.', 'Sheet steel', {
        children: [
          part('Louver', 'plate', 'Allows air to circulate through the enclosure.', 'Formed sheet steel'),
          part('Ground bond', 'cable', 'Provides a protective connection from the enclosure to ground.', 'Copper strap or wire'),
        ],
      }),
    ],
  });
}

const transmission = part('Transmission line span', 'assembly', 'Carries AC power between grid nodes.', 'Aluminum, steel and electrical insulation', {
  refs: references('grid', 'lineMaterials', 'lineBuild'),
  children: [
    part('Phase conductor', 'cable', 'Carries one phase of the high-voltage AC circuit.', 'Concentric aluminum strands around a steel core in this ACSR example', {
      vendors: [supplier('Southwire', spec.acsr, 'ACSR overhead transmission conductor.')],
      refs: [ref('Southwire · ACSR conductor construction', spec.acsr)],
      children: [
        part('Outer conductive layers', 'cable', 'Carry most of the current through low-resistance aluminum.', 'Hard-drawn electrical-grade aluminum', {
          children: [
            part('Individual aluminum strand', 'shaft', 'Helical strands share current and let the cable flex.', 'Hard-drawn aluminum wire'),
          ],
        }),
        part('Strength core', 'shaft', 'Takes much of the mechanical tension across the span.', 'Coated steel strands', {
          children: [
            part('Steel strand', 'shaft', 'Provides tensile strength.', 'Steel wire'),
            part('Galvanized finish', 'layer', 'Slows corrosion in this galvanized core variant.', 'Zinc-based coating'),
          ],
        }),
      ],
    }),
    part('Suspension insulator', 'insulator', 'Holds a conductor apart from the grounded tower.', 'Silicone rubber, fiberglass and metal fittings in this composite example', {
      vendors: [supplier('Hubbell Power Systems', spec.insulator, 'Quadri*Sil composite suspension insulator.')],
      refs: [ref('Hubbell · Quadri*Sil suspension insulator', spec.insulator)],
      children: [
        part('Load-bearing rod', 'shaft', 'Carries mechanical tension through the insulator.', 'Glass-fiber-reinforced polymer'),
        part('Weather sheds', 'layer', 'Increase the path length along the outside surface.', 'Silicone rubber'),
        part('End fitting', 'bolt', 'Couples the composite rod to line hardware.', 'Metal fitting'),
      ],
    }),
    part('Conductor clamp', 'contact', 'Transfers the weight of the line into the suspension hardware.', 'Metal clamp, keeper and bolts', {
      children: [
        part('Conductor saddle', 'ring', 'Spreads contact over the supported conductor.', 'Aluminum alloy in many clamp designs'),
        part('Fastener', 'bolt', 'Keeps the clamp assembly closed.', 'Steel hardware'),
      ],
    }),
    part('Transmission tower', 'stack', 'Maintains conductor clearance above land and objects.', 'Galvanized structural steel', {
      children: [
        part('Crossarm', 'plate', 'Separates the phase attachment points.', 'Structural steel'),
        part('Lattice legs', 'stack', 'Carry line loads and wind loads to the ground.', 'Galvanized steel sections'),
        part('Foundation', 'block', 'Spreads tower loads into the ground.', 'Reinforced concrete in this example'),
      ],
    }),
  ],
});

function protectionRelay() {
  return part('Feeder protection relay', 'board', 'Evaluates sensor readings and sends a trip signal when configured fault criteria are met.', 'Circuit boards, semiconductors and terminals', {
    vendors: [supplier('Schweitzer Engineering Laboratories', spec.relay, 'SEL-751 feeder protection relay.')],
    refs: [ref('SEL · SEL-751 measurement and protection inputs', spec.relay)],
    children: [
      part('Measurement inputs', 'contact', 'Bring scaled current and voltage signals to the relay.', 'Metal terminals and electronic isolation'),
      part('Logic board', 'board', 'Checks the signals against protection settings.', 'Printed circuit board and processor'),
      part('Trip output', 'switch', 'Sends the breaker an open command.', 'Output contact and control wiring'),
    ],
  });
}

function currentSensor(lowVoltage = false) {
  const example = lowVoltage
    ? supplier('Eaton', spec.lowVoltageCurrentTransformer, 'Low-voltage solid-core metering current transformer.')
    : supplier('GE Vernova', spec.currentTransformer, 'Indoor medium-voltage current transformers for measurement and protection.');
  return part('Current transformer', 'coil', 'Produces a smaller measurement current proportional to the primary current.', 'Magnetic core, insulated winding and terminals', {
    vendors: [example],
    refs: [ref(example.name + ' · Current transformer construction and application', example.url)],
    children: [
      part('Magnetic ring', 'core', 'Guides flux from the primary conductor through the secondary winding.', 'Magnetic alloy'),
      part('Secondary winding', 'coil', 'Supplies the scaled measurement current.', 'Insulated copper wire'),
    ],
  });
}

function phaseBus(name = 'Phase busbars') {
  return part(name, 'plate', 'Provides a shared connection for each phase within the assembly.', 'Copper or aluminum on insulated supports', {
    children: [
      part('Phase bar', 'plate', 'Carries the phase current through a rigid conductive path.', 'Copper or aluminum'),
      part('Bus support', 'insulator', 'Holds the bars apart and clear of the enclosure.', 'Molded insulating material'),
      part('Bolted joint', 'bolt', 'Clamps adjoining bars into a low-resistance connection.', 'Metal hardware and conducting contact faces'),
    ],
  });
}

const utilitySubstation = part('Utility substation', 'assembly', 'Steps transmission voltage down and switches it onto the site feeder.', 'Power transformer, conductors and steel support structures', {
  refs: references('grid', 'gridFlow', 'transformer'),
  children: [
    part('Transmission bay', 'assembly', 'Accepts the incoming high-voltage phases and provides switching and protection.', 'Steel gantry, conductors and electrical insulation', {
      children: [
        part('High-voltage circuit breaker', 'switch', 'Interrupts normal or fault current when the mechanism opens its contacts.', 'Metal contacts, insulating medium and sealed pole assembly', {
          vendors: [supplier('Siemens Energy', spec.hvBreaker, 'High-voltage live-tank and dead-tank circuit breaker families.')],
          refs: [ref('Siemens Energy · High-voltage circuit breakers', spec.hvBreaker)],
          children: [
            part('Interrupter chamber', 'shell', 'Contains the opening contacts and the medium that helps extinguish an arc.', 'Conductive contacts and gas or vacuum insulation, depending on design'),
            part('Operating linkage', 'shaft', 'Transfers motion from the mechanism to the moving contacts.', 'Metal linkages and insulating drive components'),
          ],
        }),
        part('Air-break disconnector', 'switch', 'Creates an isolation gap once the breaker has interrupted the load.', 'Metal blade and outdoor insulators', {
          vendors: [supplier('GE Vernova', spec.disconnector, 'Outdoor high-voltage disconnector catalogue.')],
          refs: [ref('GE Vernova · Disconnectors', spec.disconnector)],
          children: [
            part('Moving blade', 'blade', 'Swings away from the jaw to make the air gap.', 'Conductive metal'),
            part('Stationary jaw', 'contact', 'Receives the blade and carries current when closed.', 'Conductive contact fingers'),
          ],
        }),
        part('Surge arrester', 'insulator', 'Diverts transient overvoltage to ground and limits equipment stress.', 'Metal-oxide blocks in a sealed housing', {
          vendors: [supplier('GE Vernova', spec.arrester, 'Tranquell polymer- and porcelain-housed surge arresters.')],
          refs: [ref('GE Vernova · Tranquell surge arrester construction', spec.arrester)],
          children: [
            part('Varistor block', 'stack', 'Its resistance falls sharply under surge voltage.', 'Zinc oxide ceramic'),
            part('Outer housing', 'shell', 'Keeps out weather and insulates the arrester stack.', 'Polymer or porcelain'),
          ],
        }),
      ],
    }),
    liquidTransformer('Substation power transformer', 'Steps the transmission feed down to a 13.8 kV distribution feeder in this example.'),
    phaseBus('Distribution bus'),
    part('Feeder protection', 'assembly', 'Measures the outgoing feeder and commands opening on faults.', 'Sensor cores, copper wiring and relay electronics', {
      children: [currentSensor(), protectionRelay()],
    }),
  ],
});

function vacuumBreaker() {
  return part('Withdrawable vacuum circuit breaker', 'switch', 'Opens the medium-voltage feeder under load or fault conditions.', 'Metal frame, insulated poles and sealed interrupters', {
    vendors: [supplier('Siemens', 'https://www.siemens.com/en-us/products/medium-voltage-power-distribution/gmsg-ansi-vacuum-circuit-breaker/', 'GMSG medium-voltage vacuum circuit breaker with stored-energy operating mechanism.')],
    refs: [ref('Eaton · Vacuum interrupter construction', spec.interrupter)],
    children: [
      part('Vacuum interrupter', 'shell', 'At an AC current zero, the arc can clear and the contact gap regains insulation.', 'Ceramic and metal surrounding a sealed vacuum', {
        vendors: [supplier('Eaton', spec.interrupterCatalog, 'Custom vacuum interrupters sold as components.')],
        children: [
          part('Contact pair', 'contact', 'The fixed and moving faces carry current when closed.', 'Copper–chromium composite in one representative breaker', {
            refs: [ref('Siemens · GM-SG medium-voltage switchgear guide', 'https://cache.industry.siemens.com/dl/files/935/109973935/att_1295080/v1/ANSI-MV-AIS-SGSA-EN.pdf')],
            children: [
              part('Contact disc', 'plate', 'Provides the face where current transfers and where arcing starts on separation.', 'Copper–chromium contact material'),
              part('Contact stem', 'pin', 'Carries current from the disc to the external terminal.', 'Conductive metal'),
            ],
          }),
          part('Flexible bellows', 'spring', 'Lets the moving stem travel through a vacuum-tight seal.', 'Formed metal'),
          part('Ceramic envelope', 'insulator', 'Insulates the end terminals and holds the vacuum.', 'Ceramic with brazed metal end plates'),
          part('Vapor shield', 'shell', 'Protects the ceramic from metal vapor released by the arc.', 'Conductive metal'),
        ],
      }),
      part('Stored-energy mechanism', 'spring', 'Moves all breaker poles together in response to a trip or close command.', 'Springs, latches and steel linkages', {
        children: [
          part('Opening spring', 'spring', 'Stores mechanical energy to move the contacts quickly.', 'Spring steel'),
          part('Trip actuator', 'coil', 'Releases the latch when the protection circuit commands an opening.', 'Wound coil and metal armature'),
        ],
      }),
    ],
  });
}

const mediumVoltageIntake = part('Medium-voltage intake lineup', 'assembly', 'Receives the utility feed and meters, switches and protects it.', 'Grounded steel compartments, busbars and protection electronics', {
  refs: references('grid', 'mvGear'),
  vendors: [product('mvGear', 'SureSeT compartmented medium-voltage switchgear.')],
  children: [
    part('Incoming feeder cable', 'cable', 'Brings the 13.8 kV utility feeder into the intake lineup.', 'Copper conductor, cross-linked polyethylene and a metallic shield', {
      vendors: [supplier('Southwire', spec.mvCable, '15 kV copper cable with tree-retardant XLPE and copper tape shield.')],
      refs: [ref('Southwire · Representative 15 kV XLPE cable construction', spec.mvCable)],
      children: [
        part('Stranded phase core', 'cable', 'Carries the AC phase current.', 'Copper strands'),
        part('Insulation system', 'layer', 'Contains the electric field between the phase conductor and the grounded shield.', 'Cross-linked polyethylene between semiconductive screens', {
          children: [
            part('Conductor screen', 'layer', 'Smooths the electric field around the stranded core.', 'Semiconductive polymer'),
            part('Primary insulation', 'layer', 'Withstands the phase-to-ground voltage.', 'Tree-retardant cross-linked polyethylene in this cable example'),
            part('Insulation screen', 'layer', 'Creates a controlled interface between the insulation and metal shield.', 'Semiconductive polymer'),
          ],
        }),
        part('Metallic shield', 'layer', 'Holds the outer electrical surface at ground potential when bonded.', 'Copper tape'),
        part('Outer jacket', 'shell', 'Protects the cable against handling and the installation environment.', 'PVC in the catalog example'),
      ],
    }),
    part('Cable termination', 'insulator', 'Connects the cable core to the switchgear while controlling electric stress at the cut-back shield.', 'Silicone rubber and a stress-control material in this example', {
      vendors: [supplier('3M', spec.termination, 'QT-III cold-shrink cable termination family.')],
      refs: [ref('3M · QT-III terminations and high-permittivity stress control', spec.termination)],
      children: [
        part('Stress-control layer', 'layer', 'Spreads the electric field near the end of the cable screen.', 'High-permittivity dielectric material'),
        part('Termination body', 'shell', 'Provides the external insulating surface at the cable end.', 'Silicone rubber'),
        part('Conductor lug', 'contact', 'Creates the electrical connection to the bus terminal.', 'Compression-fit conductive metal'),
      ],
    }),
    vacuumBreaker(),
    phaseBus(),
    currentSensor(),
    protectionRelay(),
  ],
});

function lowVoltageBreaker(name = 'Branch circuit breaker') {
  return part(name, 'switch', 'Interrupts the branch when its trip unit detects an overcurrent.', 'Insulating case, metal contacts and trip mechanism', {
    refs: [ref('Schneider Electric · Example air breaker parts and arc chute', spec.lvBreaker)],
    children: [
      part('Main contacts', 'contact', 'Carry load current when the breaker is closed.', 'Conductive contact alloy'),
      part('Trip unit', 'sensor', 'Monitors current and releases the opening mechanism.', 'Thermal–magnetic or electronic components'),
      part('Arc chute', 'stack', 'Splits and cools the arc as the contacts open.', 'Metal splitter plates in an insulating frame', {
        children: [
          part('Splitter plate', 'plate', 'Creates shorter arc sections and draws heat away from the arc.', 'Metal plate'),
          part('Insulating carrier', 'insulator', 'Spaces the plates and keeps the arc confined to the chute.', 'Heat-resistant insulating material'),
        ],
      }),
    ],
  });
}

const transferGear = part('Open-transition transfer switchgear', 'assembly', 'Selects either utility or generator AC for the UPS input.', 'Steel enclosure, power contacts and control electronics', {
  refs: [...references('transfer'), ref('Eaton · Open-transition contactor maintenance manual', spec.transferManual)],
  vendors: [supplier('Eaton', spec.transfer, 'Contactor-type automatic transfer switches, including open-transition models.')],
  children: [
    part('Source and load terminals', 'contact', 'Provide independent utility, generator and common load connections.', 'Conductive terminal pads and lugs', {
      children: [
        part('Normal source lugs', 'contact', 'Accept the utility-side conductors from the site transformer.', 'Copper or aluminum terminals'),
        part('Standby source lugs', 'contact', 'Accept the generator-side conductors.', 'Copper or aluminum terminals'),
        part('Common load lugs', 'contact', 'Feed the selected AC source to the UPS.', 'Copper or aluminum terminals'),
      ],
    }),
    part('Transfer contactor', 'switch', 'Physically disconnects one source and connects the other.', 'Power contacts, actuator and mechanical linkage', {
      children: [
        part('Fixed and moving contacts', 'contact', 'Complete the selected source circuit when the faces meet.', 'Conductive contact alloy', {
          children: [
            part('Contact tip', 'contact', 'Takes the concentrated making and breaking wear at the contact face.', 'Arc-resistant conductive alloy'),
            part('Contact carrier', 'plate', 'Connects the contact face to its phase terminal.', 'Conducting metal'),
          ],
        }),
        part('Electromechanical operator', 'coil', 'Turns a control command into contact motion.', 'Wound coil, magnetic metal and linkage'),
        part('Position interlock', 'spring', 'Prevents both sources from closing together in this open-transition example.', 'Mechanical linkage and position switches'),
      ],
    }),
    part('Source sensing and controller', 'board', 'Checks both sources and issues the transfer or generator-start command.', 'Circuit board, sensors and control connectors', {
      children: [
        part('Voltage sensing', 'sensor', 'Provides a low-level signal for checking source voltage and frequency.', 'Resistors, isolation and electronic circuitry'),
        part('Start request output', 'switch', 'Tells the generator controls to start during a utility outage.', 'Low-voltage control contact'),
      ],
    }),
  ],
});

const standbyGenerator = part('Standby diesel generator set', 'assembly', 'Converts stored fuel energy to shaft work and then to backup AC.', 'Diesel engine, alternator, fuel system and steel base', {
  refs: [...references('diesel', 'generation'), ref('Cummins · QSK60 engine component descriptions', spec.dieselEngine)],
  vendors: [supplier('Cummins', spec.dieselSet, 'QSK60 diesel generator set family with packaged alternator.')],
  children: [
    part('Fuel system', 'tank', 'Stores diesel and meters it into the engine cylinders.', 'Fuel, metal tank and high-pressure fuel hardware', {
      children: [
        part('Fuel storage tank', 'tank', 'Holds diesel containing the stored chemical energy.', 'Diesel fuel in a steel tank in this example'),
        part('Fuel filter', 'filter', 'Removes particles and separates entrained water in this generator example.', 'Filter medium and metal canister'),
        part('Pump and injection rail', 'pipe', 'Supplies pressurized fuel to the injectors.', 'High-strength metal pump and tubing', {
          children: [
            part('Injector nozzle', 'jet', 'Meters a spray of fuel into the cylinder.', 'Precision metal nozzle'),
            part('Rail pressure sensor', 'sensor', 'Reports pressure to the engine controller.', 'Sensing element and metal housing'),
          ],
        }),
      ],
    }),
    part('Diesel engine', 'assembly', 'Turns combustion pressure into rotary shaft power.', 'Cast iron, steel and other engine alloys', {
      vendors: [supplier('Cummins', spec.dieselEngine, 'QSK60 G-Drive engine with direct-injection fuel hardware.')],
      children: [
        part('Cylinder block', 'case', 'Supports the cylinders, crankshaft and fluid passages.', 'Cast iron in the QSK60 example'),
        part('Piston assembly', 'shaft', 'Transfers cylinder pressure to the connecting rod.', 'Ductile iron piston in the QSK60 example', {
          children: [
            part('Piston rings', 'ring', 'Seal combustion gases and help control oil on the cylinder wall.', 'Metal rings with wear-resistant surfaces'),
            part('Piston pin', 'pin', 'Forms the pivot between piston and connecting rod.', 'Hardened steel in typical designs'),
            part('Connecting rod', 'shaft', 'Transfers the piston force to the crankshaft.', 'High-strength metal'),
          ],
        }),
        part('Crankshaft', 'shaft', 'Turns the reciprocating piston force into continuous rotation.', 'Forged steel in typical heavy-duty designs'),
      ],
    }),
    part('Alternator', 'assembly', 'Uses the rotating magnetic field to induce AC in stationary coils.', 'Electrical steel and insulated copper windings', {
      vendors: [supplier('STAMFORD | AvK', spec.alternator, 'Data center standby alternator application example.')],
      children: [
        part('Rotor field assembly', 'magnet', 'Carries the rotating field that links to the stator.', 'Magnetic steel and field winding'),
        part('Stator winding', 'coil', 'Provides the stationary three-phase AC output.', 'Insulated conductor in laminated slots'),
        part('Voltage regulator', 'board', 'Adjusts the excitation so output voltage stays near its target.', 'Control electronics and power semiconductors', {
          vendors: [supplier('STAMFORD | AvK', spec.voltageRegulator, 'MX341 alternator automatic voltage regulator.')],
          refs: [ref('STAMFORD | AvK · MX341 technical documentation', spec.voltageRegulator)],
        }),
      ],
    }),
    part('Engine cooling and starting', 'assembly', 'Removes engine heat and supplies the initial cranking torque.', 'Radiator, coolant, fan and electric starter', {
      children: [
        part('Radiator', 'panel', 'Transfers heat from circulating coolant into outdoor air.', 'Metal tubes and fins'),
        part('Starter motor', 'coil', 'Uses a separate starter battery to turn the engine at startup.', 'Copper windings and magnetic steel'),
      ],
    }),
  ],
});

const batteryBank = part('Lithium-ion UPS battery bank', 'assembly', 'Stores energy chemically and supports the UPS DC link during an outage.', 'Rechargeable cells, conductors, monitoring electronics and cabinet', {
  refs: references('battery', 'batteryCabinet', 'batteryBuild'),
  vendors: [product('batteryCabinet', 'EnergyCore lithium-ion UPS battery cabinet example.')],
  children: [
    part('Battery module', 'stack', 'Groups cells into a serviceable unit and connects them to the cabinet.', 'Cell cases, structural frame, busbars and sensing leads', {
      children: [
        part('Rechargeable cell', 'cell', 'Converts chemical energy to electrical energy while discharging.', 'Electrodes, separator, electrolyte and sealed case', {
          refs: [...references('battery', 'batteryBuild'), ref('U.S. Department of Energy · Lithium-ion technology assessment', spec.cellMaterials)],
          children: [
            part('Positive electrode', 'layer', 'Accepts lithium ions from the electrolyte during discharge.', 'Example lithium iron phosphate (LFP) coating on aluminum foil', {
              children: [
                part('Active coating', 'layer', 'Stores lithium in the positive electrode material after discharge.', 'Lithium iron phosphate in this chemistry example'),
                part('Current collector', 'plate', 'Conducts electrons from the external circuit to the active coating on discharge.', 'Aluminum foil'),
              ],
            }),
            part('Negative electrode', 'layer', 'Releases lithium ions to the electrolyte and electrons to the circuit on discharge.', 'Graphite coating on copper foil in this example', {
              children: [
                part('Graphite active layer', 'layer', 'Holds lithium between graphite layers when charged.', 'Graphitic carbon'),
                part('Current collector', 'plate', 'Carries electrons between the active coating and the external terminal.', 'Copper foil'),
              ],
            }),
            part('Separator', 'layer', 'Keeps the electrodes apart while allowing ions to pass through electrolyte-filled pores.', 'Microporous polyethylene or polypropylene in common designs', {
              vendors: [supplier('Celgard', spec.separator, 'Polyethylene and polypropylene separator base films.')],
              refs: [ref('Celgard · Battery separator films', spec.separator)],
              children: [
                part('Micropore network', 'screen', 'Provides microscopic paths for electrolyte between the electrodes.', 'Connected voids in polymer film'),
              ],
            }),
            part('Electrolyte', 'layer', 'Conducts lithium ions between the electrodes.', 'Lithium salt dissolved in organic solvents in a conventional liquid cell'),
            part('Cell container', 'shell', 'Holds the sealed assembly and provides the terminal interfaces.', 'Metal can or laminated pouch, depending on cell format'),
          ],
        }),
        part('Module bus links', 'plate', 'Connect the cells electrically in the module.', 'Conducting metal bars and joints'),
        part('Cell sensing leads', 'cable', 'Route cell voltages and temperatures to the monitoring electronics.', 'Insulated wire and sensor connectors'),
      ],
    }),
    part('Battery management system', 'board', 'Monitors cell voltage and temperature and can request disconnection.', 'Printed circuit board, semiconductors and sensors', {
      children: [
        part('Voltage monitor', 'chip', 'Measures individual cell voltages to detect unsafe limits.', 'Analog integrated circuit'),
        part('Temperature sensor', 'sensor', 'Reports temperatures within the module.', 'Thermistor or semiconductor sensor, depending on design'),
        part('Control processor', 'chip', 'Evaluates measured conditions and reports status to the cabinet controls.', 'Silicon integrated circuit'),
      ],
    }),
    part('DC protection and output', 'switch', 'Connects a healthy battery string to the UPS and isolates it when necessary.', 'DC-rated switching and protective devices', {
      children: [
        part('Main DC contactor', 'switch', 'Opens or closes the high-current battery path under control.', 'Metal contacts and electromagnetic operator'),
        part('DC fuse', 'contact', 'Opens if sustained overcurrent melts its fusible element.', 'Fusible metal element inside an insulated body'),
        part('Cabinet DC bus', 'plate', 'Gathers battery module connections into an output for the UPS.', 'Conductive bars and insulation'),
      ],
    }),
  ],
});

const igbtCatalog = 'https://www.infineon.com/products/power/igbt/igbt-modules';

function switchModule(name) {
  return part(name, 'chip', 'Switches the electrical current repeatedly in response to a gate signal.', 'Power semiconductor dies in an insulated package', {
    vendors: [supplier('Infineon', igbtCatalog, 'IGBT power module families. UPS designs may instead use MOSFETs or other devices.')],
    refs: [ref('Infineon · IGBT module product families', igbtCatalog)],
    children: [
      part('Switching die', 'chip', 'Provides the active electrical switching structure.', 'Silicon in a representative IGBT module'),
      part('Gate connection', 'contact', 'Brings the turn-on and turn-off signal to the die.', 'Metal terminal and internal conductors'),
      part('Thermal substrate', 'plate', 'Transfers heat out while insulating the live circuit from its mounting surface.', 'Metallized ceramic in many industrial modules'),
    ],
  });
}

const upsAssembly = part('Online double-conversion UPS', 'assembly', 'Maintains regulated AC from utility power, generator power or the battery-supported DC link.', 'Power modules, capacitors, magnetic parts and copper bus', {
  refs: references('ups', 'batteryCabinet', 'architecture'),
  children: [
    part('Input rectifier', 'board', 'Converts the selected AC feed into DC.', 'Power semiconductor module, magnetic components and controls', {
      children: [
        switchModule('Rectifier switching module'),
        part('Input choke', 'coil', 'Limits rapid current changes at the converter input.', 'Insulated windings and a magnetic core'),
        part('Gate drive board', 'board', 'Delivers timed switching commands to the power devices.', 'Printed circuit board and driver semiconductors'),
      ],
    }),
    part('DC link', 'assembly', 'Connects the rectifier, battery path and inverter at an intermediate DC voltage.', 'Conductive bars and energy-buffering capacitors', {
      children: [
        part('DC-link capacitor', 'cell', 'Buffers short changes in DC voltage and absorbs switching ripple.', 'Metallized polypropylene film in this example', {
          vendors: [supplier('TDK Electronics', spec.dcLink, 'MKP DC HF film capacitors for DC-link circuits.')],
          refs: [ref('TDK Electronics · MKP DC HF construction and specifications', spec.dcLink)],
          children: [
            part('Film dielectric', 'layer', 'Separates the capacitor electrodes and supports an electric field.', 'Polypropylene film'),
            part('Metallized electrode', 'layer', 'Collects charge across the dielectric layers.', 'Thin deposited metal'),
            part('Terminal tab', 'contact', 'Connects the electrode winding to the DC bus.', 'Conductive metal'),
          ],
        }),
        part('Battery input terminals', 'contact', 'Bring stored battery energy onto the inverter supply path during ride-through.', 'Insulated high-current terminals'),
        part('DC bus conductors', 'plate', 'Carry DC between the conversion stages.', 'Copper conductors and insulation'),
      ],
    }),
    part('Inverter and output filter', 'board', 'Builds a controlled three-phase AC waveform from DC.', 'Power switches, filter inductors and capacitors', {
      children: [
        switchModule('Inverter switching module'),
        part('Output filter choke', 'coil', 'Reduces the high-frequency current components produced by switching.', 'Insulated wire and magnetic core'),
        part('Output filter capacitor', 'cell', 'Helps smooth the inverter waveform at the load terminals.', 'Electrical dielectric and metal electrodes'),
      ],
    }),
    part('Static bypass', 'switch', 'Can connect suitable incoming AC to the output during certain operating conditions.', 'Power semiconductors and controls', {
      children: [
        part('Static switching element', 'chip', 'Makes the bypass connection electrically.', 'Power thyristors in a common implementation'),
        part('Synchronization control', 'board', 'Checks the relationship between bypass and inverter waveforms.', 'Measurement and control electronics'),
      ],
    }),
  ],
});

const floorDistribution = part('Transformer-based floor PDU', 'assembly', 'Steps protected 480 V AC down to 208Y/120 V and distributes branch circuits.', 'Dry transformer, steel cabinet, breakers and conductors', {
  refs: references('architecture', 'floorPdu', 'dryTransformer'),
  vendors: [product('floorPdu', 'Liebert TFX floor-standing transformer PDU.')],
  children: [
    dryTransformer('Isolation transformer', 'Changes the voltage by magnetic induction between two electrically isolated windings.'),
    part('Distribution section', 'assembly', 'Splits the secondary feed into protected outgoing circuits.', 'Busbars, breakers and cable terminals', {
      children: [phaseBus('Secondary distribution bus'), lowVoltageBreaker(), part('Outgoing terminals', 'contact', 'Connect a protected circuit to the overhead busway feed.', 'Metal lugs and insulated barriers')],
    }),
    part('Metering assembly', 'board', 'Measures operating voltage, current and power.', 'Sensors, wiring and circuit boards', {
      children: [currentSensor(true), part('Meter module', 'chip', 'Combines measured current and voltage to calculate power.', 'Electronics and display interface')],
    }),
  ],
});

const overheadBusway = part('Overhead busway and tap box', 'assembly', 'Carries three-phase power along the aisle and branches it to the rack.', 'Rigid conductive bars, metal housing and tap assemblies', {
  refs: references('architecture', 'busway'),
  vendors: [supplier('Eaton', spec.busTrack, 'PowerWave 2 continuous open-channel busway and tap-off boxes.')],
  children: [
    part('Busway rail', 'case', 'Houses the insulated phases along the run.', 'Metal enclosure, copper bars and insulating supports in this example', {
      children: [
        part('Phase and neutral bars', 'plate', 'Carry phase currents and provide a neutral for circuits that use it.', 'Copper with plated contact surfaces in the PowerWave 2 example', {
          children: [
            part('Conductive bar', 'plate', 'Provides the main low-resistance path.', 'Electrical-grade copper'),
            part('Contact finish', 'layer', 'Forms the engineered contact surface at joints and taps.', 'Silver over nickel in the cited PowerWave 2 construction'),
          ],
        }),
        part('Insulator carrier', 'insulator', 'Supports the live bars and separates them from the housing.', 'Fiber-reinforced electrical insulation'),
        part('Protective ground path', 'plate', 'Bonds the housing to equipment ground.', 'Metal housing or dedicated grounding bar'),
      ],
    }),
    part('Section joint', 'assembly', 'Makes a continuous electrical connection between track sections.', 'Conductive joint assembly, hardware and insulated cover', {
      children: [
        part('Joint contact plate', 'contact', 'Bridges corresponding bars across the seam.', 'Conducting metal'),
        part('Joint fastener', 'bolt', 'Applies pressure to the joint assembly.', 'Metal hardware'),
      ],
    }),
    part('Rack tap box', 'case', 'Branches one rack feed from the rail through a protective device.', 'Enclosure, conductive contacts, breaker and cord', {
      children: [
        part('Plug-in tap contacts', 'contact', 'Mate with the live bars at the branch position.', 'Plated conducting metal with insulated support', {
          children: [
            part('Phase contact', 'blade', 'Touches the assigned phase bar and transfers branch current.', 'Conductive metal'),
            part('Contact barrier', 'insulator', 'Keeps adjacent contact positions apart.', 'Molded electrical insulation'),
          ],
        }),
        lowVoltageBreaker(),
        part('Outgoing whip', 'cable', 'Carries the protected branch down to the rack PDU.', 'Flexible insulated conductors'),
      ],
    }),
  ],
});

const rackDistribution = part('Rack power distribution unit', 'assembly', 'Shares an incoming feed among groups of rack outlets.', 'Metal enclosure, conductors, outlet blocks and meters', {
  refs: references('rackPdu', 'redundancy'),
  vendors: [product('rackPdu', 'Three-phase 208 V rack PDU with metering and IEC outlets.')],
  children: [
    part('Input connection', 'cable', 'Carries the three-phase branch from the busway tap.', 'Copper conductors and insulation', {
      children: [
        part('Phase conductors', 'cable', 'Carry the incoming AC phases.', 'Insulated stranded copper'),
        part('Equipment ground', 'cable', 'Bonds exposed conductive equipment to the protective ground path.', 'Insulated copper conductor'),
      ],
    }),
    part('Protected outlet bank', 'assembly', 'Feeds a group of outlets from a pair of phases in this 208 V example.', 'Branch breaker, internal connections and molded outlets', {
      children: [
        lowVoltageBreaker(),
        part('IEC C13 outlet', 'contact', 'Accepts the server cord and passes line-to-line AC to it.', 'Thermoplastic body and metal contacts', {
          children: [
            part('Line contacts', 'contact', 'Mate with the cord plug and carry the circuit current.', 'Conductive metal contacts'),
            part('Ground contact', 'pin', 'Continues the protective ground connection to the cord.', 'Conductive metal'),
            part('Molded insert', 'insulator', 'Holds the contacts apart at their keyed positions.', 'Electrical thermoplastic'),
          ],
        }),
      ],
    }),
    part('Metering board', 'board', 'Reports the input or branch electrical load on equipped models.', 'Sensors, circuit board and display', {
      children: [
        part('Current sensing element', 'sensor', 'Produces a signal proportional to current.', 'Current transformer or other electronic sensor'),
        part('Display and network control', 'chip', 'Presents measurements and optionally reports them over a network.', 'Silicon electronics and display components'),
      ],
    }),
  ],
});

const serverCord = part('Server cord and connectors', 'cable', 'Carries one rack outlet circuit to the server supply.', 'Stranded copper, electrical insulation and molded connectors', {
  refs: references('cord', 'rackPdu'),
  vendors: [product('cord', 'P004-006 C14-to-C13 server power cord.')],
  children: [
    part('C14 plug end', 'contact', 'Mates with the rack PDU’s C13 outlet.', 'Three metal contacts in a molded insulator', {
      children: [
        part('Line blades', 'blade', 'Connect the two current-carrying conductors to the outlet.', 'Conductive metal'),
        part('Protective earth blade', 'pin', 'Connects to the protective earth conductor.', 'Conductive metal'),
        part('Strain relief', 'shell', 'Reduces repeated flexing where the cord enters the plug.', 'Molded polymer'),
      ],
    }),
    part('Flexible cable', 'cable', 'Keeps three separate conductors protected along the cord.', 'Stranded copper with separate insulation and a common jacket', {
      children: [
        part('Current-carrying leads', 'cable', 'Carry the two line potentials in the representative 208 V circuit.', 'Insulated stranded copper', {
          children: [
            part('Conductor strands', 'shaft', 'Share the current while letting the cord bend.', 'Drawn copper wires'),
            part('Primary insulation', 'layer', 'Separates each lead electrically from the other conductors.', 'Electrical-grade polymer'),
          ],
        }),
        part('Equipment grounding lead', 'cable', 'Connects the server enclosure to protective earth.', 'Insulated copper'),
        part('Outer jacket', 'shell', 'Protects the grouped wires from rubbing and normal handling.', 'PVC in the cited Eaton cord example'),
      ],
    }),
    part('C13 connector end', 'contact', 'Mates with the C14 inlet on the server power supply.', 'Molded insulating housing and metal contact sockets', {
      vendors: [supplier('SCHURTER', spec.c13, '4782 rewireable C13 connector example. Molded cord ends use a similar mating interface.')],
      refs: [ref('SCHURTER · IEC C13 connector drawing and materials', spec.c13)],
      children: [
        part('Contact socket', 'contact', 'Receives the matching inlet blade under spring pressure.', 'Conductive spring metal'),
        part('Keyed shell', 'insulator', 'Aligns the contacts with the inlet.', 'Thermoplastic'),
      ],
    }),
  ],
});

const serverPowerSupply = part('Server power supply', 'assembly', 'Converts 208 V AC to a regulated 12 V DC rail in this example.', 'Power semiconductors, magnetics, capacitors and metal chassis', {
  refs: references('psu', 'psuStages', 'boardAssembly'),
  vendors: [product('psu', 'PWS-804P-1R server PSU with 12 V DC main output.')],
  children: [
    part('AC inlet and interference filter', 'assembly', 'Connects the cord and limits switching noise on the AC feed.', 'Connector, choke, capacitors and protection components', {
      children: [
        part('IEC C14 inlet', 'contact', 'Receives AC and protective earth from the cord.', 'Molded insulator and metal terminals', {
          vendors: [supplier('SCHURTER', spec.c14, '6100-4 snap-in C14 appliance inlet example.')],
          refs: [ref('SCHURTER · 6100-4 IEC C14 inlet', spec.c14)],
        }),
        part('Common-mode choke', 'coil', 'Impedes interference current that flows in the same direction on both lines.', 'Two insulated windings on a shared ferrite core', {
          vendors: [supplier('Coilcraft', spec.commonModeChoke, 'CMT series common-mode power-line chokes.')],
          refs: [ref('Coilcraft · CMT common-mode line chokes', spec.commonModeChoke)],
          children: [
            part('Shared magnetic core', 'core', 'Provides a flux path for common-mode noise.', 'Soft ferrite ceramic'),
            part('Paired windings', 'coil', 'Their magnetic fields largely cancel for normal load current.', 'Insulated copper wire'),
          ],
        }),
        part('Filter capacitor', 'cell', 'Provides a path for high-frequency noise.', 'Safety-rated dielectric and metal electrodes'),
      ],
    }),
    part('Power factor correction stage', 'board', 'Rectifies the AC and shapes its input current while feeding a higher-voltage DC bus.', 'Power switches, inductor, capacitors and controller', {
      children: [
        part('Power switch', 'chip', 'Switches current rapidly so the circuit can control the input waveform.', 'Gallium nitride or silicon device, depending on design'),
        part('Boost inductor', 'coil', 'Stores energy briefly in a magnetic field between switching events.', 'Copper winding around magnetic material'),
        part('Bulk DC capacitor', 'cell', 'Buffers energy as input power varies through the AC cycle.', 'Aluminum electrolytic construction in a common implementation'),
      ],
    }),
    part('Isolated resonant converter', 'assembly', 'Uses high-frequency AC inside the PSU to cross an isolation barrier.', 'Switches, resonant elements and transformer', {
      children: [
        part('Resonant switch pair', 'chip', 'Alternately drives the resonant network from the DC bus.', 'Power semiconductors and package contacts'),
        part('High-frequency transformer', 'coil', 'Couples changing flux to an isolated secondary winding.', 'Ferrite core and insulated copper windings', {
          vendors: [supplier('TDK Electronics', spec.ferrite, 'Ferrite material families for power and interference-control magnetics.')],
          refs: [...references('psuStages'), ref('TDK Electronics · Ferrite materials for power', spec.ferrite)],
          children: [
            part('Ferrite core halves', 'core', 'Provide a low-loss magnetic path at the switching frequency.', 'Soft ferrite, such as manganese–zinc in many power cores'),
            part('Primary winding', 'coil', 'Creates the changing magnetic field.', 'Insulated copper'),
            part('Secondary winding', 'coil', 'Receives transferred energy without a conductive connection to the primary.', 'Insulated copper'),
            part('Insulating barrier', 'layer', 'Maintains electrical separation between the two sides.', 'Dielectric tape, bobbin or PCB laminate, depending on construction'),
          ],
        }),
      ],
    }),
    part('Secondary rectifier and DC output', 'board', 'Produces smooth low-voltage DC from the transformer secondary.', 'MOSFETs, filter capacitors and output contacts', {
      children: [
        part('Synchronous rectifier', 'chip', 'Times power switches to rectify the secondary with low conduction loss.', 'Silicon MOSFETs and controller', {
          vendors: [supplier('Texas Instruments', spec.syncRectifier, 'UCC24624 synchronous rectifier controller for LLC converters.')],
          refs: [ref('Texas Instruments · Dual-channel synchronous rectifier datasheet', spec.syncRectifier)],
        }),
        part('Output filter', 'cell', 'Absorbs residual ripple on the 12 V rail.', 'Capacitor electrodes and dielectric'),
        part('Hot-plug output contacts', 'contact', 'Carry DC to the server power distribution board.', 'Plated conductive contacts'),
      ],
    }),
    part('Cooling and chassis', 'case', 'Supports the electronics and carries heat out of the PSU.', 'Metal enclosure, heat sinks and fan', {
      children: [
        part('Power device heat sink', 'plate', 'Spreads device heat into the cooling airflow.', 'Aluminum in common designs'),
        part('PSU fan', 'fan', 'Moves air through the supply.', 'Motor, bearings and molded impeller'),
      ],
    }),
  ],
});

const boardRegulator = part('Multiphase board voltage regulator', 'assembly', 'Lowers the server DC rail to the processor’s core voltage.', 'Power stages, inductors, capacitors and copper board planes', {
  refs: references('vrm', 'boardAssembly'),
  children: [
    part('Feedback and phase controller', 'chip', 'Measures output voltage and times each phase to hold the target.', 'Silicon control IC on a printed circuit board', {
      children: [
        part('Sense path', 'cable', 'Reports actual voltage close to the load.', 'Copper traces and input circuitry'),
        part('Pulse-width timing logic', 'chip', 'Adjusts each phase’s on-time to correct output voltage.', 'Silicon control circuitry'),
      ],
    }),
    part('One switching phase', 'board', 'Converts 12 V DC into pulses that the phase inductor smooths.', 'Synchronous power stage, inductor and local capacitors', {
      children: [
        part('Integrated power stage', 'chip', 'Alternates high-side and low-side switching at the phase node.', 'Silicon MOSFETs and driver in an electronic package', {
          vendors: [supplier('Texas Instruments', spec.powerStage, 'CSD95490Q5MC integrated synchronous buck power stage.')],
          refs: [ref('Texas Instruments · CSD95490Q5MC smart power stage', spec.powerStage)],
          children: [
            part('High-side MOSFET', 'chip', 'Connects the input rail to the phase node during its on-time.', 'Silicon power transistor die'),
            part('Low-side MOSFET', 'chip', 'Provides a low-resistance return path for inductor current when the high-side switch is off.', 'Silicon power transistor die'),
            part('Gate driver', 'chip', 'Charges and discharges the transistor gates at the commanded times.', 'Silicon control die'),
          ],
        }),
        part('Phase inductor', 'coil', 'Stores energy magnetically and keeps phase current changing smoothly.', 'Copper winding in magnetic material', {
          vendors: [supplier('Coilcraft', spec.inductor, 'XAL molded high-current power inductor family.')],
          refs: [ref('Coilcraft · XAL molded inductor family', spec.inductor)],
          children: [
            part('Winding', 'coil', 'Carries the phase current around the magnetic path.', 'Copper conductor'),
            part('Magnetic body', 'core', 'Concentrates the field and limits external leakage.', 'Molded magnetic composite in the cited family'),
          ],
        }),
      ],
    }),
    part('Output capacitor bank', 'stack', 'Supplies short bursts of current and limits voltage ripple.', 'Ceramic or polymer capacitors, depending on the design', {
      children: [
        part('Multilayer ceramic capacitor', 'cell', 'Stores energy in the field between many overlapping internal electrodes.', 'Ceramic dielectric and metal electrode layers', {
          vendors: [supplier('Murata', spec.mlcc, 'Technical description of Murata multilayer ceramic capacitor construction.')],
          refs: [ref('Murata · Ceramic capacitor structure and materials', spec.mlcc)],
          children: [
            part('Dielectric sheet', 'layer', 'Separates two adjacent electrodes.', 'Barium titanate-based ceramic in many high-capacitance designs'),
            part('Internal electrode', 'layer', 'Connects every other layer to one terminal.', 'Metal such as nickel in base-metal electrode designs'),
          ],
        }),
        part('Load plane', 'plate', 'Collects the phases and carries the regulated voltage to the processor socket.', 'Copper layer in the motherboard'),
      ],
    }),
  ],
});

const intelXeonThermal = 'https://www.intel.com/content/www/us/en/support/articles/000006710/processors/intel-xeon-processors.html';
const intelTim = 'https://www.intel.com/content/www/us/en/support/articles/000037209/processors.html';

function heatSpreader() {
  return part('Integrated heat spreader', 'plate', 'Spreads heat from the small die over a larger cooling surface.', 'Conductive metal, commonly copper with a protective finish', {
    refs: references('chipBuild'),
    children: [
      part('Package thermal interface', 'layer', 'Improves thermal contact between the die and the package lid.', 'Thermal interface compound or solder, depending on the package'),
      part('Spreader lid', 'plate', 'Moves heat laterally from the die footprint toward the cooling surface.', 'High-conductivity metal'),
    ],
  });
}

const processor = part('Processor package', 'assembly', 'Delivers electrical power to the die and exposes connections for data and heat.', 'Silicon, metal interconnects, organic substrate and metal heat spreader', {
  refs: references('chip', 'chipBuild', 'chipFabrication'),
  children: [
    part('Processor die', 'chip', 'Performs logic by switching and charging internal circuits.', 'Patterned silicon with stacked conducting and insulating layers', {
      children: [
        part('Logic cell', 'chip', 'Implements a small logic operation using several transistors.', 'Silicon devices and local interconnect', {
          children: [
            part('CMOS transistor pair', 'chip', 'Uses complementary transistor types to charge or discharge an output node.', 'Silicon semiconductor devices with insulated gates', {
              children: [
                part('Field-effect transistor', 'chip', 'A gate electric field controls current between source and drain.', 'Silicon channel, gate stack and contacts in this example', {
                  children: [
                    part('Channel', 'layer', 'Provides the gate-controlled path through the semiconductor.', 'Silicon in a representative device'),
                    part('Gate stack', 'stack', 'Applies the electric field that controls the channel.', 'Gate metal over a thin high-permittivity insulator', {
                      refs: [ref('Intel · High-k dielectric and metal gate research', spec.highK)],
                      children: [
                        part('Gate electrode', 'layer', 'Applies the input voltage above or around the channel.', 'Metal gate stack'),
                        part('Gate dielectric', 'layer', 'Electrically separates the gate and channel while coupling the field.', 'Hafnium-based oxide in a representative high-k stack'),
                      ],
                    }),
                    part('Source and drain', 'contact', 'Connect the ends of the controlled current path.', 'Doped semiconductor and metal contacts'),
                  ],
                }),
              ],
            }),
          ],
        }),
        part('On-die interconnect stack', 'stack', 'Distributes power and signals above the active devices.', 'Patterned metal lines, dielectric layers and vertical vias', {
          refs: [ref('IBM Research · Copper and emerging CMOS interconnect materials', spec.interconnect)],
          children: [
            part('Power grid layer', 'plate', 'Distributes supply and return voltage across the die.', 'Patterned metal, such as copper at many layers'),
            part('Interlayer via', 'pin', 'Connects two levels of metal routing.', 'Conductive fill with a liner or barrier, depending on the process'),
            part('Interlayer dielectric', 'layer', 'Separates adjacent routes and wiring levels.', 'Insulating oxide or low-k dielectric'),
          ],
        }),
      ],
    }),
    part('Package substrate', 'board', 'Routes power and signals between the fine die connections and the board socket.', 'Layered organic substrate with copper routing in this example', {
      vendors: [supplier('IBIDEN', spec.substrate, 'Flip-chip package substrate products for CPUs and other high-performance devices.')],
      refs: [...references('chipBuild'), ref('IBIDEN · Flip-chip packages', spec.substrate)],
      children: [
        part('Die bump connections', 'contact', 'Provide short electrical connections between the die and substrate.', 'Metal bump and solder in a representative flip-chip package'),
        part('Substrate build-up stack', 'stack', 'Provides several insulated layers for routing and power delivery.', 'Organic dielectric and copper', {
          children: [
            part('Routing layer', 'plate', 'Spreads closely spaced die connections toward the socket contacts.', 'Patterned copper'),
            part('Microvia', 'pin', 'Connects copper routes through a thin build-up layer.', 'Plated conductive connection'),
            part('Dielectric layer', 'layer', 'Prevents short circuits between copper layers.', 'Organic electrical laminate'),
          ],
        }),
        part('Socket land', 'contact', 'Mates with a spring contact in this land-grid array example.', 'Plated metal pad'),
      ],
    }),
    heatSpreader(),
  ],
});

const heatSinkProduct = 'https://store.supermicro.com/us_en/1u-passive-cpu-cooler-snk-p0086p.html';
const fanProduct = 'https://www.delta-fan.com/technology/gfc0624dw-dt48.html';

const heatRejection = part('Processor air-cooling path', 'assembly', 'Carries heat from the processor package into the server’s exhaust air.', 'Thermal interface, conductive metal and moving air', {
  refs: [
    ref('Intel · Xeon processor thermal management', intelXeonThermal),
    ref('Intel · Thermal interface material', intelTim),
    ref('U.S. Department of Energy · Energy-efficient data center design', spec.cooling),
  ],
  children: [
    heatSpreader(),
    part('External thermal interface', 'layer', 'Fills microscopic air gaps between the package lid and heat sink base.', 'Thermally conductive paste or pad', {
      refs: [ref('Intel · Thermal interface material', intelTim)],
      children: [
        part('Thermal compound', 'layer', 'Forms a thin conductive path across rough mating surfaces.', 'Formulation varies with the thermal paste or pad'),
        part('Mounting clamp', 'spring', 'Holds the base flat against the package at controlled pressure.', 'Metal retention hardware'),
      ],
    }),
    part('Passive heat sink', 'stack', 'Conducts heat from its base and exposes a large surface to airflow.', 'Aluminum, copper or a combination in common designs', {
      vendors: [supplier('Supermicro', heatSinkProduct, 'SNK-P0086P 1U passive server CPU heat sink example.')],
      refs: [ref('Supermicro · Example 1U passive heat sink', heatSinkProduct), ref('Intel · Xeon processor thermal management', intelXeonThermal)],
      children: [
        part('Base plate', 'plate', 'Spreads heat into the fin roots.', 'Thermally conductive aluminum or copper'),
        part('Fin stack', 'stack', 'Exposes more surface area to the passing air.', 'Typically thin aluminum or copper fins', {
          children: [
            part('Individual fin', 'plate', 'Transfers heat from the metal surface into air by convection.', 'Thermally conductive metal'),
            part('Air channel', 'pipe', 'Keeps an open route for air between adjacent fins.', 'Moving air'),
          ],
        }),
      ],
    }),
    part('Server fan and air duct', 'fan', 'Moves air through the fins and out of the chassis.', 'Molded impeller, motor, bearings and enclosure', {
      vendors: [supplier('Delta Electronics', fanProduct, 'GFC0624DW-DT48 DC axial fan with ball bearings and PWM control.')],
      refs: [ref('Delta Electronics · Axial fan specifications', fanProduct), ref('Intel · Xeon processor thermal management', intelXeonThermal)],
      children: [
        part('Impeller', 'blades', 'Pushes cooling air toward the exhaust.', 'Molded polymer in common fan designs'),
        part('Motor', 'coil', 'Turns the impeller using a separate electrical feed.', 'Wound conductors and magnetic materials'),
        part('Bearing', 'bearing', 'Supports the rotor while it turns.', 'Metal rolling elements and races in a ball-bearing fan'),
        part('Warm exhaust stream', 'pipe', 'Takes the transferred heat from the server into the room cooling path.', 'Air'),
      ],
    }),
  ],
});

export const downstreamParts = {
  'step-up': liquidTransformer('Plant step-up transformer', 'Raises plant AC voltage for transmission.', {
    vendors: [product('gsu', 'Core-type generator step-up transformers for power plants.')],
  }),
  lines: transmission,
  substation: utilitySubstation,
  intake: mediumVoltageIntake,
  'site-transformer': dryTransformer('Site dry-type transformer', 'Steps the medium-voltage site feed down to 480Y/277 V AC.', {
    vendors: [product('dryTransformer', 'Open-wound dry-type distribution transformer family.')],
  }),
  transfer: transferGear,
  generator: standbyGenerator,
  battery: batteryBank,
  ups: upsAssembly,
  'floor-pdu': floorDistribution,
  busway: overheadBusway,
  'rack-pdu': rackDistribution,
  cord: serverCord,
  psu: serverPowerSupply,
  vrm: boardRegulator,
  chip: processor,
  heat: heatRejection,
};
