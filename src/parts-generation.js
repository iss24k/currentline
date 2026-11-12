// The trees describe representative architectures. Catalog links identify examples of a part or service.
const ref = (title, url) => ({ title, url });
const vendor = (name, url, note) => ({ name, url, note });
const part = (name, shape, job, material, children = [], evidence = {}) => ({
  name, shape, job, material, children, ...evidence,
});

const gasStudy = ref('Emerson · Gas turbine fuel conditioning', 'https://www.emerson.com/is/content/emerson/en/final-control/pressure-management/common-applications/natural-gas-pressure-regulators/documents/fuel-gas-conditioning-system-to-ensure-gas-turbine-gets-right-quality-fuel-en-10549256.pdf');
const gasRegulator = ref('Emerson · Fisher 627B parts list and materials', 'https://www.emerson.com/is/content/emerson/en/final-control/pressure-management/documents/manuals-627b-series-pressure-reducing-regulators-fisher.pdf');
const gasTurbine = ref('U.S. DOE · How gas turbine power plants work', 'https://www.energy.gov/hgeo/how-gas-turbine-power-plants-work');
const compression = ref('NETL · Axial-flow compressors and blade materials', 'https://netl.doe.gov/sites/default/files/gas-turbine-handbook/2-0.pdf');
const hotMaterials = ref('NETL · Materials for advanced turbine airfoils', 'https://netl.doe.gov/sites/default/files/gas-turbine-handbook/4-4-1.pdf');
const coatings = ref('NETL · Coatings for superalloy components', 'https://netl.doe.gov/sites/default/files/gas-turbine-handbook/4-4-2.pdf');
const cooling = ref('NETL · Internal cooling of turbine blades and vanes', 'https://netl.doe.gov/sites/default/files/gas-turbine-handbook/4-2-2-2.pdf');
const combustionParts = ref('GE Vernova · Combustor components', 'https://www.gevernova.com/gas-power/services/service-centers/yokohama-japan');
const nozzleDetails = ref('GE Vernova · Combustor swirler, venturi and nozzle wear coating example', 'https://www.gevernova.com/gas-power/services/gas-turbines/upgrades/lm6000pc-sac-extended-life-combustor');
const steamStudy = ref('GE Vernova · How steam turbines work', 'https://www.gevernova.com/gas-power/resources/education/how-steam-turbines-work');
const reactorStudy = ref('U.S. DOE · Pressurized-water reactor basics', 'https://www.energy.gov/ne/articles/nuclear-101-how-does-nuclear-reactor-work');
const fuelStudy = ref('U.S. DOE · Nuclear fuel cycle', 'https://www.energy.gov/ne/nuclear-fuel-cycle');
const solarCells = ref('U.S. DOE · Solar photovoltaic cell basics', 'https://www.energy.gov/cmei/systems/solar-photovoltaic-cell-basics');
const solarBuild = ref('U.S. DOE · Solar photovoltaic manufacturing', 'https://www.energy.gov/cmei/systems/solar-photovoltaic-manufacturing-basics');
const pvDesign = ref('U.S. DOE · Photovoltaic system design', 'https://www.energy.gov/cmei/systems/solar-photovoltaic-system-design-basics');
const inverterStudy = ref('Texas Instruments · Three-phase inverter reference design', 'https://www.ti.com/tool/TIDA-01606');
const windStudy = ref('U.S. DOE · Wind turbine components', 'https://www.energy.gov/cmei/systems/how-do-wind-turbines-work');
const windMaterials = ref('Vestas · V112 component and materials study, appendix B', 'https://www.vestas.com/content/dam/vestas-com/global/en/sustainability/reports-and-ratings/lcas/LCA_V112_Study_Report_2011.pdf.coredownload.inline.pdf');
const windConversion = ref('National Renewable Energy Laboratory · Full-scale converter, figure 15', 'https://research-hub.nlr.gov/en/publications/advanced-power-electronic-interfaces-for-distributed-energy-syste/');
const hydroStudy = ref('U.S. DOE · How hydropower works', 'https://www.energy.gov/cmei/water/how-hydropower-works');
const hydroTurbines = ref('U.S. DOE · Types of hydropower turbines', 'https://www.energy.gov/cmei/water/types-hydropower-turbines');
const penstockStudy = ref('U.S. Bureau of Reclamation · Hoover Dam penstocks', 'https://www.usbr.gov/lc/hooverdam/faqs/tunlfaqs.html');
const generatorStudy = ref('GE Vernova · How a turbine generator works', 'https://www.gevernova.com/gas-power/resources/education/how-a-gas-generator-works');
const generatorCatalog = ref('GE Vernova · Generator construction and features', 'https://www.gevernova.com/content/dam/gepower-steam/global/en_US/documents/Steam-Product-Catalog.pdf');

const mdCompressor = (note) => vendor('MD&A', 'https://www.mdaturbines.com/parts/gas-turbine/compressor-parts/', note);
const mdCombustor = (note) => vendor('MD&A', 'https://www.mdaturbines.com/parts/gas-turbine/combustion-parts/', note);
const geCombustor = (note) => vendor('GE Vernova', combustionParts.url, note);
const geSteam = (note) => vendor('GE Vernova', 'https://www.gevernova.com/steam-power/services/steam-turbines/parts', note);
const geGenerator = (note) => vendor('GE Vernova', 'https://www.gevernova.com/gas-power/services/generators/parts', note);
const hydroSupplier = (note) => vendor('ANDRITZ', 'https://www.andritz.com/products-en/environment-and-energy/products/penstocks-gates-manifolds', note);
const fisher = (note) => vendor('Emerson Fisher', gasRegulator.url, note);

const gas = part('Natural gas fuel supply', 'assembly',
  'Condition pipeline gas before it enters the turbine fuel line.', 'Steel piping, filter media, valve trim and seals', [
    part('Inlet piping', 'pipe', 'Carry pipeline gas to the conditioning skid.', 'Steel pipe', [
      part('Pipe wall', 'shell', 'Contain the pressurized gas stream.', 'Carbon steel in many installations'),
      part('Bolted flange joint', 'ring', 'Join pipe and skid equipment while permitting disassembly.', 'Steel flanges and fasteners', [
        part('Flange gasket', 'layer', 'Seal the opposing flange faces.', 'Gasket composition depends on service'),
        part('Stud and nut', 'bolt', 'Clamp the flange faces around the gasket.', 'Steel fastener alloy'),
      ]),
    ]),
    part('Filter separator', 'filter', 'Remove particles and, in a coalescing design, entrained liquid.', 'Steel vessel with replaceable filter media', [
      part('Filter element', 'filter', 'Capture solids and help small liquid droplets merge.', 'Fibrous media and a support cage', [
        part('Fiber web', 'layer', 'Give fine droplets a surface on which to collect.', 'Service-specific filter fibers'),
        part('Support screen', 'screen', 'Keep the filter medium in shape against pressure differences.', 'Metal mesh or perforated sheet'),
      ]),
      part('Collection sump', 'tank', 'Collect separated liquid at the bottom of the vessel.', 'Steel vessel section'),
      part('Level measurement', 'sensor', 'Measure liquid buildup before it can carry over.', 'Metal pressure instrument and seals', [], {
        vendors: [vendor('Emerson Rosemount', 'https://www.emerson.com/en/measurement-instrumentation/industries/chemical/chemical-manufacturer-reduces-risk-of-facility-damage-with-remote-mount-capability', 'Documented coalescer installation uses Rosemount 3051S pressure transmitters for level measurement.')],
      }),
    ]),
    part('Pressure regulator', 'valve', 'Throttle the gas to hold a usable downstream pressure.', 'Metal pressure body with flexible sensing diaphragm', [
      part('Sensing diaphragm', 'layer', 'Move in response to downstream gas pressure.', 'Nitrile in one Fisher 627B construction', [
        part('Flexible membrane', 'layer', 'Separate the gas chamber from the spring side while flexing.', 'Nitrile rubber in the cited design'),
        part('Diaphragm head', 'plate', 'Support the membrane and transmit its movement.', 'Plated steel in the cited design'),
      ], { vendors: [fisher('The 627B parts table lists a nitrile diaphragm and plated-steel diaphragm head for selected constructions.')] }),
      part('Control spring', 'spring', 'Balance pressure force on the diaphragm.', 'Plated steel in the Fisher example'),
      part('Valve trim', 'valve', 'Vary the opening through which gas can pass.', 'Metal stem and orifice with sealing disk', [
        part('Stem', 'pin', 'Transmit diaphragm motion to the valve disk.', 'Metal alloy selected for gas service'),
        part('Orifice', 'ring', 'Define the opening that the disk throttles.', 'Machined metal'),
        part('Stem O-ring', 'ring', 'Seal the stem at the moving interface.', 'Elastomer selected for gas compatibility'),
      ]),
    ], {
      refs: [gasRegulator],
      vendors: [vendor('Emerson Fisher', 'https://www.emerson.com/en/final-control/products/fisher-627', '627 commercial and industrial pressure regulators are a component example. Actual turbine feeds may require a pilot-operated design.')],
    }),
    part('Fuel shutoff valve', 'valve', 'Isolate the downstream fuel line when commanded.', 'Steel or iron body with model-specific sealing trim', [
      part('Valve body', 'case', 'Carry gas pressure around the moving trim.', 'Service-rated pressure body alloy'),
      part('Seat and closing member', 'contact', 'Meet to block the flow opening.', 'Metal or compatible soft sealing surface'),
      part('Actuator', 'assembly', 'Move the closing member from an external signal.', 'Metal mechanism with electric, pneumatic or hydraulic drive'),
    ]),
  ], {
    refs: [gasStudy],
    vendors: [vendor('Emerson Tartarini', 'https://www.emerson.com/en/final-control/products/tartarini-stations-skids', 'Customized gas pressure reduction and filtration skids.')],
  });

const hotBlade = part('Rotating turbine blade', 'blade',
  'Take force from expanding hot gas and pass torque into the wheel.', 'Cast nickel-based superalloy in this example', [
    part('Airfoil', 'blade', 'Turn the hot gas so it pushes on the rotor.', 'Shaped nickel-based superalloy', [
      part('Cooling circuit', 'pipe', 'Carry cooling air through the blade and out to its surface.', 'Hollow passages in the alloy', [
        part('Serpentine passage', 'pipe', 'Guide cooling air back and forth through the airfoil.', 'Cavity in the blade casting', [
          part('Rib turbulators', 'layer', 'Disturb the cooling flow so it removes heat faster from the wall.', 'Integral cast-alloy ribs'),
          part('Trailing-edge pin fins', 'pin', 'Add area and mix cooling air in the thin trailing edge.', 'Integral cast-alloy features'),
        ]),
        part('Film-cooling holes', 'jet', 'Release air to form a cooler film over the outside surface.', 'Openings through alloy and coating'),
      ], { refs: [cooling] }),
      part('Surface coating system', 'stack', 'Protect hot metal from heat and oxidation.', 'Ceramic, oxide and metallic layers', [
        part('Ceramic top coat', 'layer', 'Slow heat transfer from the gas into the blade.', 'Yttria-stabilized zirconia (YSZ) in the reference system', [
          part('Zirconia', 'layer', 'Provide the insulating ceramic host material.', 'Zirconium dioxide'),
          part('Yttria', 'layer', 'Stabilize the zirconia crystal phases in the coating.', 'Yttrium oxide dispersed in the ceramic'),
        ]),
        part('Thermally grown oxide', 'layer', 'Form at the bond-coat surface during high-temperature exposure.', 'Alumina-rich oxide in the reference system'),
        part('Metallic bond coat', 'layer', 'Anchor the ceramic and protect the underlying alloy.', 'MCrAlY or diffusion aluminide examples', [
          part('Nickel or cobalt base', 'layer', 'Provide the metallic foundation of an MCrAlY bond coat.', 'Nickel, cobalt or a combination'),
          part('Aluminum in the bond coat', 'layer', 'Supply material for the protective alumina scale.', 'Aluminum alloyed into the coat'),
        ]),
        part('Load-bearing substrate', 'layer', 'Carry the blade’s mechanical and thermal loads beneath the coating.', 'Nickel-based superalloy', [
          part('Gamma matrix', 'layer', 'Form the continuous metal surrounding strengthening particles.', 'Nickel-rich solid solution'),
          part('Gamma-prime precipitates', 'layer', 'Strengthen the metal against deformation at temperature.', 'Ordered nickel-aluminum-based phase'),
        ], { refs: [hotMaterials, coatings] }),
      ], {
        refs: [coatings],
        vendors: [vendor('Howmet Aerospace', 'https://www.howmet.com/about-howmet-engine-products/', 'Lists hot-section coatings and industrial gas turbine airfoils. Coating composition depends on the application.')],
      }),
    ]),
    part('Blade platform', 'plate', 'Form the inner boundary of the gas path at the base of the airfoil.', 'Integral superalloy casting'),
    part('Blade root', 'contact', 'Lock into the turbine wheel and transmit load.', 'Machined region of the blade casting', [
      part('Fir-tree lobes', 'layer', 'Share centrifugal load across several contact surfaces in this root design.', 'Integral machined superalloy'),
      part('Root inlet', 'jet', 'Admit cooling air to the internal circuit on a cooled blade.', 'Opening in the blade root'),
    ]),
  ], {
    refs: [hotMaterials, cooling],
    vendors: [
      vendor('Howmet Aerospace', 'https://www.howmet.com/about-howmet-engine-products/', 'Produces industrial gas turbine airfoils. The blade here is generic.'),
      vendor('GE Vernova', 'https://www.gevernova.com/gas-power/services/service-centers/greenville-south-carolina-usa', 'Lists replacement rotating blades, called buckets, for supported turbine frames.'),
    ],
  });

const combustionTurbine = part('Combustion turbine', 'assembly',
  'Convert fuel energy into rotation and hot exhaust.', 'Pressure casing, steel rotor and temperature-specific alloys', [
    part('Air inlet and compressor', 'blades', 'Clean the inlet air and raise its pressure in successive stages.', 'Steel compressor structure with staged alloy airfoils', [
      part('Inlet air filter', 'filter', 'Remove dust and other contaminants before the compressor.', 'Fibrous media in a replaceable frame', [
        part('Pleated filter media', 'layer', 'Provide a large surface area for capturing particles.', 'Synthetic or cellulose-based media examples'),
        part('Filter frame and seal', 'case', 'Hold the medium and reduce bypass around it.', 'Frame and compressible gasket'),
      ], { vendors: [vendor('Donaldson', 'https://www.donaldson.com/en/products/gas-turbine-filters/', 'Offers static panel, cartridge and pre-filter options for turbine air inlets.')] }),
      part('Variable inlet guide vanes', 'blades', 'Set the angle at which air approaches the first rotating row.', 'Corrosion-resistant airfoil alloys', [
        part('Vane airfoil', 'blade', 'Guide the entering airflow.', 'Martensitic stainless steel in examples'),
        part('Pivot and linkage', 'pin', 'Rotate vane angles together in an adjustable row.', 'Metal pivot and links'),
      ], { vendors: [mdCompressor('Lists inlet and exit guide vanes and intermediate compressor blading.')] }),
      part('Compressor stage', 'blades', 'Add energy in a moving row and turn flow speed into pressure in the fixed row.', 'Alloy blades, wheel and hardware', [
        part('Rotor blade', 'blade', 'Speed up air as the rotor turns.', 'Examples include AISI 403 or 15-5 PH stainless steel', [
          part('Airfoil section', 'blade', 'Present a curved profile to the air stream.', 'Machined blade alloy', [
            part('Leading edge', 'blade', 'Meet the approaching flow at the front of the profile.', 'Integral blade material'),
            part('Trailing edge', 'blade', 'Release the flow toward the next vane row.', 'Integral blade material'),
          ]),
          part('Dovetail attachment', 'contact', 'Fit into the rotor wheel to hold the blade against centrifugal loads.', 'Machined blade root in this example'),
          part('Protective surface layer', 'layer', 'Protect the blade surface in coated designs.', 'Stage- and manufacturer-specific coating'),
        ], { vendors: [mdCompressor('Supplies heavy-frame replacement compressor blading and hardware.')] }),
        part('Stator vane', 'blade', 'Slow and redirect the air before the next rotating row.', 'Stainless or other stage-specific alloy', [
          part('Vane airfoil', 'blade', 'Shape the fixed flow passage.', 'Machined alloy'),
          part('Vane attachment pin', 'pin', 'Retain a vane where pinned construction is used.', 'Metal retention hardware'),
        ]),
        part('Rotor wheel', 'wheel', 'Keep the blades aligned around the shaft.', 'Forged alloy steel in many industrial rotors', [
          part('Blade slot', 'contact', 'Mate with and support the blade root.', 'Machined feature in the wheel'),
          part('Balance weight', 'bolt', 'Correct residual rotor mass imbalance.', 'Metal balancing hardware'),
        ], { vendors: [mdCompressor('Lists replacement rotor disks or wheels, balance weights, spacers and fasteners.')] }),
      ]),
    ], { refs: [compression] }),
    part('Combustion section', 'tank', 'Mix metered fuel with compressed air and release heat.', 'Temperature-resistant metal shells and fuel hardware', [
      part('Fuel nozzle', 'jet', 'Meter and distribute gas into the combustion air.', 'Heat-resistant alloy assembly', [
        part('Nozzle tip', 'jet', 'Deliver fuel through openings at the combustion end.', 'Heat-resistant metal, with wear coating in some designs', [
          part('Metering opening', 'pin', 'Control where fuel enters the airstream.', 'Machined opening in the tip'),
          part('Wear coating', 'layer', 'Protect rubbing surfaces where the nozzle meets its mating ferrule.', 'Cobalt-chromium-molybdenum in the cited upgrade', [], { refs: [nozzleDetails] }),
        ]),
        part('Swirler', 'blades', 'Turn incoming air to stabilize mixing and the flame.', 'Heat-resistant alloy', [], { refs: [nozzleDetails] }),
      ], { vendors: [geCombustor('Lists fuel nozzles for selected F-class and HA combustors.')] }),
      part('Combustion liner', 'shell', 'Enclose the flame while controlling how surrounding air enters.', 'Heat-resistant sheet alloy with optional thermal coating', [
        part('Liner wall', 'shell', 'Separate the hot combustion zone from its air supply.', 'Heat-resistant metal'),
        part('Air admission openings', 'jet', 'Admit air for mixing, cooling or dilution at selected locations.', 'Openings formed in the liner wall'),
        part('Protective coating', 'layer', 'Reduce heat reaching the liner wall where a coated liner is used.', 'Ceramic top coat over a compatible bond coat', [], { refs: [coatings, combustionParts] }),
      ], { vendors: [mdCombustor('Lists replacement combustion liners and flow sleeves.')] }),
      part('Transition piece', 'pipe', 'Guide combustion gas from a combustor can toward the first turbine vanes.', 'High-temperature metal with model-specific coating', [
        part('Hot wall', 'shell', 'Shape the transition from the combustor to the turbine inlet.', 'Heat-resistant alloy'),
        part('Flow sleeve', 'shell', 'Guide cooling air around selected liner or transition designs.', 'Formed metal sheet'),
      ], { vendors: [geCombustor('Lists transition pieces for selected HA and F-class designs.')] }),
    ], { refs: [combustionParts, nozzleDetails] }),
    part('Hot-gas turbine stages', 'blades', 'Extract rotation from the hot, expanding gas.', 'High-temperature alloy airfoils, rotor disks and shrouds', [
      part('Fixed turbine nozzle vanes', 'blades', 'Aim and accelerate gas toward the rotating blade row.', 'Cast heat-resistant alloy', [
        part('Vane airfoil', 'blade', 'Shape the gas passage between neighboring vanes.', 'Heat-resistant alloy with possible cooling passages'),
        part('Endwall', 'plate', 'Bound the vane passage and support the airfoil.', 'Heat-resistant alloy or integrated casting'),
      ]),
      hotBlade,
      part('Shroud segment', 'ring', 'Limit the amount of gas that can bypass the rotating blade tips.', 'Temperature-resistant alloy with model-dependent surface treatment'),
    ], { refs: [gasTurbine, hotMaterials, cooling] }),
    part('Shaft and supports', 'shaft', 'Carry turbine torque to the compressor and generator.', 'Forged steel rotor and oil-film bearings', [
      part('Shaft coupling', 'ring', 'Join the turbine and generator shafts.', 'Machined steel coupling and bolts', [
        part('Coupling flange', 'ring', 'Transmit torque across the joined shafts.', 'Steel forging'),
        part('Coupling fastener', 'bolt', 'Maintain clamping force through the flange.', 'High-strength fastener steel'),
      ]),
      part('Journal bearing', 'bearing', 'Support the spinning shaft on an oil film.', 'Metal-backed bearing with a Babbitt lining in some designs', [
        part('Bearing shell', 'shell', 'Support the softer running surface.', 'Metal backing'),
        part('Babbitt lining', 'layer', 'Provide a conformable bearing surface beneath the oil film.', 'White-metal bearing alloy'),
        part('Oil film', 'layer', 'Separate the moving shaft from the bearing surface in operation.', 'Lubricating oil'),
      ], { vendors: [vendor('MD&A', 'https://www.mdaturbines.com/repairs/gas-turbine/bearing-ball-ring-repairs/', 'Documents gas turbine bearing re-babbitting.')] }),
      part('Outer casing', 'case', 'Contain the gas path and locate stationary parts.', 'Section-dependent metal casting or fabrication', [
        part('Casing flange', 'ring', 'Join casing sections and maintain alignment.', 'Machined casing alloy'),
        part('Casing bolts', 'bolt', 'Hold the casing joint under load and temperature.', 'Alloy steel fasteners'),
      ]),
    ]),
  ], { refs: [gasTurbine] });

const reactor = part('Pressurized-water reactor', 'assembly',
  'Transfer heat from the reactor core to a separate steam loop.', 'Steel pressure boundary, fuel assemblies and heat exchanger', [
    part('Core assemblies', 'core', 'Hold the fuel where fission releases heat into circulating water.', 'Ceramic fuel in metal-clad rods', [
      part('Fuel rod', 'pin', 'Hold stacked pellets behind a sealed metal barrier.', 'Ceramic uranium dioxide and zirconium-alloy tubing in common PWR designs', [
        part('Fuel pellet', 'core', 'Contain the material in which fission releases energy.', 'Sintered uranium dioxide ceramic'),
        part('Cladding tube', 'pipe', 'Separate the fuel from the primary coolant while passing heat.', 'Zirconium alloy in the cited examples'),
        part('End plug', 'pin', 'Close an end of the fuel rod.', 'Fuel-design-specific metal'),
      ]),
      part('Spacer grid', 'screen', 'Keep fuel rods separated so water can flow between them.', 'Alloy straps assembled into a grid', [
        part('Grid strap', 'plate', 'Form the small cells that locate the rods.', 'Zirconium alloy or nickel alloy, depending on design'),
        part('Rod contact features', 'spring', 'Support the rods within the grid cells.', 'Formed features in the grid material'),
      ], {
        vendors: [vendor('Westinghouse', 'https://westinghousenuclear.com/data-sheet-library/prime-advanced-fuel-features-package/', 'The PRIME package documents low-tin ZIRLO grids and rod-support features.')],
      }),
      part('Bottom nozzle', 'plate', 'Support the assembly and admit coolant from below.', 'Design-specific metal assembly', [
        part('Debris filter', 'screen', 'Intercept particles before they reach the rods.', 'Metal flow passages or filter plate'),
      ]),
    ], {
      refs: [fuelStudy, reactorStudy],
      vendors: [vendor('Westinghouse', 'https://westinghousenuclear.com/data-sheet-library/ce16ngf-next-generation-nuclear-fuel-assembly-for-16x16-ce-nuclear-steam-supply-system-reactors/', 'CE16NGF is a commercial PWR fuel assembly example.')],
    }),
    part('Reactivity control', 'assembly', 'Regulate the chain reaction by absorbing neutrons in the core.', 'Metal-clad neutron absorbers and drive hardware', [
      part('Control rod cluster', 'stack', 'Move neutron-absorbing rods into or out of guide passages.', 'Design-specific absorber material in metal cladding', [
        part('Absorber material', 'core', 'Capture neutrons that could otherwise sustain fission.', 'Absorber composition depends on the reactor design'),
        part('Rod cladding', 'pipe', 'Enclose the absorber while passing through guide passages.', 'Metal tubing selected for reactor service'),
      ]),
      part('Drive mechanism', 'shaft', 'Move the rod cluster to its commanded position.', 'Metal drive structure and electromechanical parts'),
    ]),
    part('Primary circulation and pressure', 'pipe', 'Carry heat to the steam generator and keep primary water liquid under normal operation.', 'Primary water and heavy metal pressure equipment', [
      part('Coolant pump', 'wheel', 'Keep primary water circulating between the core and steam generator.', 'Metal pump casing, shaft and impeller', [
        part('Impeller', 'wheel', 'Transfer shaft rotation into water flow.', 'Service-specific pump alloy'),
        part('Pump casing', 'case', 'Contain and direct the water around the impeller.', 'Pressure-boundary metal'),
      ]),
      part('Pressurizer', 'tank', 'Keep the primary circuit near its intended pressure as conditions change.', 'Steel pressure vessel with water and steam space'),
    ], { refs: [ref('U.S. NRC · Pressurized water reactor layout', 'https://www.nrc.gov/reactors/power/pwrs')] }),
    part('Vessel and containment', 'case', 'Hold the core and primary water within a protected plant structure.', 'Thick steel reactor vessel inside steel and concrete containment', [
      part('Reactor pressure vessel', 'tank', 'Keep primary water and reactor internals inside the pressure boundary.', 'Thick steel shell with welded joints', [
        part('Vessel shell', 'shell', 'Resist the load from high-pressure primary water.', 'Heavy steel sections'),
        part('Vessel head', 'plate', 'Close the top of the reactor pressure vessel.', 'Heavy steel pressure boundary'),
      ], { refs: [ref('U.S. NRC · Reactor vessel integrity', 'https://www.nrc.gov/facilities-safety/operating-reactors/reactor-safety-information-topics/reactor-vessel-integrity')] }),
      part('Containment', 'shell', 'Enclose the reactor system inside a protected structure.', 'Concrete and steel in the NRC example'),
    ], { refs: [ref('U.S. NRC · Pressurized water reactor layout', 'https://www.nrc.gov/reactors/power/pwrs')] }),
    part('Steam generator', 'tank', 'Send primary-loop heat through tube walls to boil secondary water.', 'Steel vessel and corrosion-resistant heat-exchanger tubing', [
      part('Tube bundle', 'coil', 'Give the two water circuits a large common heat-transfer surface.', 'Alloy 690 tubing in the representative example', [
        part('Tube wall', 'pipe', 'Conduct heat and keep the two water loops apart.', 'Nickel-chromium-iron Alloy 690'),
        part('Tube support plate', 'plate', 'Locate the tubes while leaving paths for secondary water.', 'Stainless steel in the AP1000 review example'),
        part('Tubesheet', 'plate', 'Anchor tube ends at the primary-to-secondary boundary.', 'Heavy metal plate with tube-to-plate joints'),
      ], { refs: [
        ref('U.S. NRC · Steam generator tube materials', 'https://www.nrc.gov/regulations-legislation/fact-sheets-brochures/backgrounder-on-steam-generator-tube-issues'),
        ref('U.S. NRC · Example of stainless steel steam generator tube support plates', 'https://www.nrc.gov/sites/default/files/doc_library/cdn/legacy/reading-rm/doc-collections/nuregs/staff/sr1793/initial/chapter5.pdf'),
      ] }),
      part('Secondary steam outlet', 'pipe', 'Deliver steam to the steam turbine.', 'Service-specific steam piping'),
    ]),
  ], { refs: [reactorStudy] });

const steamTurbine = part('Steam turbine', 'assembly',
  'Let steam expand across moving blades and turn a shaft.', 'Steel casing, rotor and stage-specific airfoils', [
    part('Steam admission', 'valve', 'Admit and control steam entering the first stage.', 'Alloy steel body and service-specific trim', [
      part('Control valve', 'valve', 'Meter the steam reaching the turbine.', 'Metal body, stem and seat', [
        part('Valve seat', 'ring', 'Provide a mating surface for the closing member.', 'Service-specific wear-resistant metal'),
        part('Valve stem', 'pin', 'Transmit actuator motion to the steam-flow control member.', 'Heat- and wear-resistant metal'),
      ]),
      part('Inlet steam chest', 'case', 'Distribute incoming steam to the admission paths.', 'Cast or fabricated pressure body'),
    ]),
    part('Steam-path stages', 'blades', 'Repeatedly redirect steam and capture its energy as rotation.', 'Stage-specific steel or alloy blades and supports', [
      part('Stationary diaphragm', 'ring', 'Hold the fixed nozzles around the shaft.', 'Fabricated or cast metal assembly', [
        part('Nozzle vane', 'blade', 'Set the direction and speed of steam entering the rotor row.', 'Service-specific alloy'),
        part('Inner and outer rings', 'ring', 'Locate and support the stationary vanes.', 'Service-specific steel'),
      ], { vendors: [geSteam('Steam path replacements include diaphragms and associated components.')] }),
      part('Moving blade', 'blade', 'Turn the steam and pass its force to the rotor.', 'Stage-specific alloy, with material choice varying by steam conditions', [
        part('Airfoil', 'blade', 'Shape the steam passage and create turning force.', 'Shaped blade metal'),
        part('Attachment root', 'contact', 'Lock the blade into the rotor wheel.', 'Machined blade alloy'),
        part('Tip shroud', 'ring', 'Connect or constrain blade tips in shrouded designs.', 'Blade-specific metal'),
      ], { vendors: [geSteam('Offers steam turbine rotor and blade replacements, including last-stage blade products.')] }),
    ]),
    part('Rotor, bearings and seals', 'shaft', 'Keep the turbine turning while limiting steam leakage.', 'Forged rotor, metal bearings and metallic seals', [
      part('Rotor forging', 'shaft', 'Transmit torque toward the generator.', 'Alloy steel'),
      part('Labyrinth shaft seal', 'ring', 'Limit leakage through a series of small clearances.', 'Machined metallic seal sections', [
        part('Seal tooth', 'blade', 'Create a narrow gap that restricts steam flow.', 'Metal tooth integral to a seal segment'),
        part('Inter-tooth chamber', 'ring', 'Dissipate flow energy before the next restriction.', 'Cavity between metallic teeth'),
      ], { vendors: [vendor('GE Vernova', 'https://www.gevernova.com/content/dam/gepower-new/global/en_US/downloads/steam-new-site/services/steam-turbine-service-solutions.pdf', 'Industrial steam turbine service brochure lists advanced labyrinth seals.')] }),
      part('Journal bearing', 'bearing', 'Support the rotating shaft radially.', 'Metal-backed bearing with an oil film'),
    ]),
  ], { refs: [steamStudy], vendors: [geSteam('Catalog for industrial and utility steam turbine parts. Exact construction depends on the machine.')] });

const solar = part('Silicon solar array', 'panel',
  'Collect light and deliver DC from connected modules.', 'Silicon cells, glass, polymer, metal and cables', [
    part('PV module', 'panel', 'Protect electrically connected cells outdoors.', 'Laminated glass, encapsulant and cells with an aluminum frame', [
      part('Front glass', 'layer', 'Let sunlight through and protect the cells from the weather.', 'Low-iron glass in common module constructions'),
      part('Encapsulant', 'layer', 'Hold and protect the cells inside the laminate.', 'Transparent polymer such as EVA or POE'),
      part('Crystalline silicon cell', 'cell', 'Generate electrical voltage and current when illuminated.', 'Processed silicon wafer and metal contacts', [
        part('Silicon absorber', 'layer', 'Absorb photons and free charge carriers.', 'Crystalline silicon', [
          part('Doped regions', 'layer', 'Help establish an internal electric field and direct charge to contacts.', 'Silicon with controlled dopant concentrations'),
          part('Surface passivation', 'layer', 'Reduce loss of charge carriers at the cell surface.', 'Thin films selected for the cell architecture'),
        ]),
        part('Metal collection contacts', 'contact', 'Carry charge from the cell into the module wiring.', 'Architecture-dependent metals such as silver or copper', [
          part('Fine collection fingers', 'layer', 'Gather current across small areas of the cell.', 'Printed or plated metal tracks'),
          part('Interconnect ribbon', 'cable', 'Connect neighboring cells in a conventional tabbed module.', 'Metal ribbon, often copper-based'),
        ]),
      ], { refs: [solarCells, solarBuild] }),
      part('Rear barrier and frame', 'case', 'Support the laminate and protect it from the back.', 'Polymer backsheet or rear glass, plus metal frame'),
    ], {
      refs: [solarBuild],
      vendors: [vendor('LONGi', 'https://www.longi.com/en/products/modules/hi-mo-5/', 'Hi-MO 5 documents commercial crystalline-silicon modules and a dual-glass packaging option.')],
    }),
    part('Junction box and cable', 'cable', 'Collect the module DC and connect it to the string.', 'Insulated copper cable, terminals and molded housing', [
      part('Bypass diode', 'chip', 'Provide an alternate current path around a shaded cell group when it conducts.', 'Semiconductor die in a package'),
      part('PV connector', 'contact', 'Make the enclosed electrical connection between modules or string wiring.', 'Molded insulating housing and metal contacts', [
        part('Crimp contact', 'pin', 'Grip the conductor and make an electrical connection.', 'Tin-plated copper in the MC4-Evo 2 example'),
        part('Insulating housing', 'shell', 'Shield the contacts and locate the latch.', 'Polyamide in the MC4-Evo 2 example'),
        part('Seal', 'ring', 'Help keep moisture from the mated connection.', 'Service-specific sealing material'),
      ], {
        refs: [ref('Stäubli · MC4-Evo 2 technical data', 'https://www.staubli.com/content/dam/ecs/catalogs-brochures/RE/SOL-MC4-Evo-2-11014101-en.pdf')],
        vendors: [vendor('Stäubli', 'https://www.staubli.com/us/en/electrical-connectors/products/renewable-energy-solutions/dc-connectors.html', 'Makes MC4 and MC4-Evo 2 photovoltaic DC connector products.')],
      }),
    ]),
    part('Module mounting', 'assembly', 'Hold the modules at their designed orientation.', 'Steel or aluminum rails and hardware', [
      part('Rail', 'shaft', 'Carry loads from the module frames to the supports.', 'Aluminum or steel'),
      part('Frame clamp', 'bolt', 'Keep a framed module secured to its mounting rail.', 'Metal clamp and fastener'),
    ], { refs: [pvDesign] }),
  ], { refs: [solarCells, solarBuild, pvDesign] });

const tdk = vendor('TDK Electronics', 'https://www.tdk-electronics.tdk.com/en/374108/tech-library/articles/products-technologies/products-technologies/tdk-presents-dc-link-capacitors-for-up-to-125-c-in-demanding-automotive-and-industrial-applications/3662296', 'B3271xP is a polypropylene DC-link film capacitor series for applications including solar inverters.');
const infineon = vendor('Infineon', 'https://www.infineon.com/assets/row/public/documents/60/49/infineon-ff300r12me4-datasheet-en.pdf', 'EconoDUAL FF300R12ME4 is a documented IGBT half-bridge module for applications including wind turbines.');
const tiDriver = vendor('Texas Instruments', 'https://www.ti.com/tool/TIDA-00446', 'An isolated IGBT gate-drive reference design for three-phase drives, UPS and solar inverters.');

function dcLink(name = 'DC-link assembly') {
  return part(name, 'coil', 'Buffer the DC voltage between the source and switching stage.', 'Conductive busbars and capacitor bank', [
    part('DC-link capacitor', 'tank', 'Store energy briefly in an electric field and smooth DC voltage ripple.', 'Metallized polypropylene film in this example', [
      part('Dielectric film', 'layer', 'Separate the electrodes so charge can build up on each side.', 'Polypropylene in the cited capacitor'),
      part('Metal electrode layers', 'layer', 'Hold opposite charge across the dielectric film.', 'Thin metallization on polymer film'),
      part('Terminal and enclosure', 'case', 'Join the wound element to the DC link and protect it.', 'Conductive terminals and insulating package'),
    ], { vendors: [tdk] }),
    part('DC busbar', 'plate', 'Carry current between the capacitor bank and switching modules.', 'Copper or other conductive metal with insulation', [
      part('Positive and negative plates', 'layer', 'Provide the two current paths of the DC link.', 'Conductive metal'),
      part('Insulating separator', 'insulator', 'Keep the two plates electrically isolated.', 'Dielectric sheet or molded barrier'),
    ]),
  ], { refs: [inverterStudy] });
}

function switchingBridge(name, description, supplier) {
  return part(name, 'board', description, 'Power semiconductors mounted in cooled modules', [
    part('Power module', 'chip', 'Connect semiconductor switches into a high-current switching leg.', 'Silicon switch and diode dies, conductive substrate and package', [
      part('IGBT die', 'chip', 'Let a control signal switch the main current path.', 'Silicon in the cited IGBT example', [
        part('Gate structure', 'layer', 'Control whether the semiconductor channel conducts.', 'Gate conductor and insulating oxide'),
        part('Current-carrying regions', 'layer', 'Carry load current when the device is switched on.', 'Doped semiconductor regions'),
      ]),
      part('Antiparallel diode', 'chip', 'Provide a path for reverse-direction current in this bridge topology.', 'Silicon power diode'),
      part('Thermal path', 'layer', 'Conduct heat from the dies to external cooling hardware.', 'Package layers and thermal interface material'),
    ], supplier ? { vendors: [supplier] } : {}),
    part('Isolated gate driver', 'board', 'Send the timing commands while isolating low-voltage controls from the power circuit.', 'PCB with driver IC, isolation barrier and local supply', [
      part('Driver IC', 'chip', 'Charge or discharge the switch gate quickly.', 'Packaged semiconductor die'),
      part('Isolation barrier', 'insulator', 'Transfer the command while maintaining electrical separation.', 'Insulating structure inside the driver package'),
    ], { vendors: [tiDriver] }),
  ], { refs: [inverterStudy] });
}

const acFilter = () => part('AC output filter', 'coil', 'Reduce high-frequency ripple in the current sent toward the grid.', 'Inductors and capacitors in this filter example', [
  part('Inductor', 'coil', 'Oppose rapid changes in current.', 'Copper winding around a magnetic core', [
    part('Winding', 'coil', 'Carry current and create a magnetic field.', 'Insulated copper conductor'),
    part('Magnetic core', 'core', 'Guide magnetic flux in the coil.', 'Core material selected for switching frequency'),
  ]),
  part('Filter capacitor', 'tank', 'Provide a path for some high-frequency ripple current.', 'Dielectric and electrodes'),
], { refs: [inverterStudy] });

const solarInverter = part('Solar inverter', 'assembly',
  'Convert solar DC to grid-compatible AC.', 'Power electronics, bus conductors and a metal enclosure', [
    part('DC input and protection', 'switch', 'Collect array-string current and allow the input to be isolated.', 'Metal conductors, terminals and insulating supports', [
      part('Input terminal', 'contact', 'Connect the array wiring to the converter.', 'Conductive metal in an insulating body'),
      part('DC disconnect', 'switch', 'Open the circuit for isolation.', 'Contacts, switching mechanism and insulating enclosure'),
    ]),
    dcLink(),
    switchingBridge('Inverter bridge', 'Switch DC rapidly to produce a shaped AC waveform.'),
    acFilter(),
    part('Controller board', 'board', 'Set switch timing and track a useful operating point for the array.', 'PCB with copper traces, sensors and controller IC', [
      part('Digital controller', 'chip', 'Calculate switch commands from measurements and grid timing.', 'Packaged silicon microcontroller'),
      part('Voltage and current sensing', 'sensor', 'Report operating conditions for feedback and protection.', 'Resistors, sensors and isolation components'),
    ]),
  ], {
    refs: [ref('U.S. DOE · Inverters and grid services', 'https://www.energy.gov/cmei/systems/solar-integration-inverters-and-grid-services-basics'), inverterStudy],
    vendors: [vendor('SMA Solar', 'https://www.sma.de/en/products/solarinverters/sunny-central-up', 'Sunny Central UP is a documented utility-scale central inverter family.')],
  });

const wind = part('Wind turbine and generator', 'assembly',
  'Use aerodynamic lift to turn a direct-drive generator.', 'Composite rotor blades, steel structures and electromagnetic generator', [
    part('Blade and hub assembly', 'blades', 'Catch the wind and transmit rotor torque into the drivetrain.', 'Fiber-reinforced blade laminates with a metal hub', [
      part('Composite blade', 'blade', 'Generate aerodynamic lift along its span.', 'Glass fibers with polymer resin and optional carbon reinforcement', [
        part('Blade shell', 'shell', 'Provide the smooth outside shape and carry distributed loads.', 'Glass-fiber-reinforced polymer in the cited examples', [
          part('Reinforcement fibers', 'layer', 'Carry much of the load along their length.', 'Woven or directional glass fiber'),
          part('Resin matrix', 'layer', 'Hold the fibers and transfer load between them.', 'Epoxy in the V112 example'),
        ]),
        part('Spar or spar cap', 'layer', 'Carry large bending loads along the blade span.', 'Glass or carbon-fiber composite, depending on design'),
        part('Shear web', 'plate', 'Transfer shear loads between the structural faces of the blade.', 'Composite web bonded inside the shell in the cited V112 example'),
      ], {
        refs: [windMaterials, ref('U.S. DOE · Advanced blade manufacturing', 'https://www.energy.gov/cmei/systems/advanced-blade-manufacturing')],
        vendors: [vendor('LM Wind Power', 'https://www.gevernova.com/news/press-releases/zebra-project-achieves-key-milestone-with-production-of-first-prototype-of-recyclable-wind-turbine-blade', 'Manufacturer of rotor blades. The linked ZEBRA prototype used glass reinforcement and thermoplastic resin.')],
      }),
      part('Pitch bearing', 'bearing', 'Let the blade turn about its own axis to change its angle.', 'Metal rings and rolling elements', [
        part('Slewing ring', 'ring', 'Support the blade root while allowing pitch movement.', 'Machined bearing ring'),
        part('Rolling elements', 'pin', 'Transmit loads between the bearing rings with rolling contact.', 'Bearing steel'),
        part('Bearing seals', 'ring', 'Help keep lubricant in and contaminants out.', 'Model-specific sealing material'),
      ], { vendors: [vendor('SKF', 'https://evolution.skf.com/wind-power-made-easier/', 'Documents sealed SKF slewing bearings used at each blade-to-hub connection on a Scanwind turbine.')] }),
    ]),
    part('Direct-drive generator', 'core', 'Convert slow rotor rotation into variable-frequency AC.', 'Steel magnetic circuit, permanent magnets and copper windings', [
      part('Permanent-magnet rotor', 'magnet', 'Carry a rotating magnetic field around the generator gap.', 'Permanent-magnet material on a steel support structure', [
        part('Magnet segment', 'magnet', 'Provide a local north and south magnetic field.', 'Permanent-magnet alloy selected by the manufacturer'),
        part('Rotor backing', 'core', 'Carry magnetic flux and support the magnet array.', 'Magnetic steel structure'),
      ]),
      part('Stationary stator', 'coil', 'Generate voltage as the rotor field passes its windings.', 'Insulated copper coils in an electrical steel core', [
        part('Winding conductor', 'coil', 'Carry the induced current out of the machine.', 'Insulated copper'),
        part('Core lamination', 'layer', 'Guide the field while limiting circulating currents in the steel.', 'Thin coated electrical steel sheet'),
      ]),
      part('Main bearing', 'bearing', 'Support the rotor and carry loads from wind and rotation.', 'Metal bearing assembly', [
        part('Raceway', 'ring', 'Guide the rollers as the shaft turns.', 'Hardened steel bearing surface'),
        part('Roller', 'pin', 'Transfer loads between the bearing rings.', 'Bearing steel'),
        part('Cage', 'ring', 'Keep rollers separated and guided.', 'Cast iron in the SKF BC example'),
      ], {
        vendors: [vendor('SKF', 'https://cdn.skfmediahub.skf.com/api/public/0901d196802809de/pdf_preview_medium/0901d196802809de_pdf_preview_medium.pdf', 'Documents spherical roller bearings designed for wind-turbine main shafts.')],
      }),
    ], {
      refs: [windStudy, generatorStudy],
      vendors: [vendor('ENERCON', 'https://www.enercon.de/en/wind-turbines/product-portfolio', 'Offers direct-drive wind turbines with permanent-magnet generator and full-scale converter examples.')],
    }),
    part('Nacelle and tower', 'case', 'Support and orient the rotor assembly high above the ground.', 'Steel tower and composite nacelle shell', [
      part('Yaw mechanism', 'ring', 'Turn the nacelle to line up with the wind.', 'Metal bearing and drive components'),
      part('Tower section', 'shell', 'Carry the nacelle and rotor loads into the foundation.', 'Structural steel in the tubular tower example'),
    ], { refs: [windMaterials] }),
  ], { refs: [windStudy, windMaterials] });

const windConverter = part('Wind power converter', 'assembly',
  'Turn variable generator AC into grid-compatible AC through a DC link.', 'Semiconductor modules, busbars, capacitors and filters', [
    switchingBridge('Machine-side rectifier', 'Convert variable-frequency generator AC into DC.', infineon),
    dcLink('Shared DC link'),
    switchingBridge('Grid-side inverter', 'Switch DC back into AC synchronized with the grid.', infineon),
    acFilter(),
    part('Control and feedback', 'board', 'Coordinate generator torque and grid current through both bridges.', 'Control board, sensors and isolated interfaces', [
      part('Current sensor', 'sensor', 'Report actual current to the control loop.', 'Hall-effect sensor or shunt circuit, depending on design'),
      part('Digital controller', 'chip', 'Calculate switch timing from commands and feedback.', 'Packaged semiconductor IC'),
    ]),
  ], {
    refs: [windConversion, inverterStudy],
    vendors: [vendor('ENERCON', 'https://www.enercon.de/en/wind-turbines/product-portfolio', 'Documents full-scale converters in its wind turbine portfolio. The internal module examples here are independent catalog examples.')],
  });

const hydro = part('Reservoir and penstock', 'assembly',
  'Store energy as elevated water and carry that water to the turbine.', 'Concrete civil structures and steel water conduits', [
    part('Dam and reservoir', 'tank', 'Maintain a height difference between stored water and the powerhouse.', 'Concrete dam and water in this example', [
      part('Stored water', 'tank', 'Hold gravitational energy by remaining above the turbine.', 'Water'),
      part('Dam body', 'case', 'Hold back water and transfer its load into the foundation.', 'Mass concrete in this example'),
    ]),
    part('Intake structure', 'screen', 'Admit usable water and keep large debris out of the conduit.', 'Concrete intake with steel screens and gates', [
      part('Trash rack', 'screen', 'Intercept floating debris before it reaches the penstock.', 'Fabricated steel bars and frame', [
        part('Rack bars', 'shaft', 'Leave gaps for water while blocking larger material.', 'Structural steel'),
        part('Rack frame', 'case', 'Hold the bars and transfer water loads to the intake structure.', 'Welded steel'),
      ], { vendors: [hydroSupplier('Offers trash racks as hydromechanical equipment for hydropower intakes.')] }),
      part('Intake gate', 'valve', 'Open or isolate the path into the waterway.', 'Fabricated steel gate and seals', [
        part('Gate leaf', 'plate', 'Move across the opening to stop or admit flow.', 'Steel plate with stiffeners'),
        part('Gate seals', 'ring', 'Reduce leakage around a closed gate.', 'Seal material varies by project'),
      ], { vendors: [hydroSupplier('Manufactures hydraulic gates and gate operating equipment.')] }),
    ]),
    part('Penstock', 'pipe', 'Contain water under pressure as it descends toward the turbine.', 'Fabricated steel pipe in this example', [
      part('Pipe course', 'shell', 'Form a segment of the pressurized conduit.', 'Rolled steel plate'),
      part('Welded joint', 'layer', 'Join fabricated steel sections into a continuous boundary.', 'Weld metal and adjacent steel'),
      part('Anchor or support', 'block', 'Transfer forces from the conduit to the surrounding structure.', 'Project-specific steel and concrete'),
    ], { refs: [penstockStudy], vendors: [hydroSupplier('Manufactures and installs hydraulic steel structures including penstocks.')] }),
  ], { refs: [hydroStudy, penstockStudy] });

const waterTurbine = part('Francis water turbine', 'assembly',
  'Turn pressurized water flow into torque at the generator shaft.', 'Large steel water passages and runner assembly', [
    part('Water admission', 'pipe', 'Guide the incoming flow around the runner.', 'Steel casing and guide components in this example', [
      part('Scroll case', 'pipe', 'Distribute water around the full circumference of the runner.', 'Fabricated steel in large units'),
      part('Wicket gates', 'blades', 'Pivot to set how much water enters and at what angle.', 'Metal vanes and an actuating mechanism', [
        part('Gate vane profile', 'blade', 'Guide water into the moving runner blades.', 'Service-specific steel alloy'),
        part('Gate stem', 'shaft', 'Carry pivot motion into each gate.', 'Machined metal shaft'),
        part('Operating ring', 'ring', 'Move the gate linkages together.', 'Fabricated or machined metal'),
      ], {
        vendors: [vendor('ANDRITZ', 'https://www.andritz.com/hydro-en/about-andritz-hydro/locations/morelia-mexico/news-mexico', 'Documents supply of wicket gate operating rings and servomotors for a modernization project.')],
      }),
    ]),
    part('Runner', 'blades', 'Extract mechanical energy as water changes pressure and direction through curved blades.', 'Cast or fabricated steel assembly', [
      part('Runner blade', 'blade', 'Turn water flow so it exerts torque on the runner.', 'Machined or ground steel alloy profile', [
        part('Leading edge', 'blade', 'Receive flow leaving the wicket gates.', 'Integral runner blade steel'),
        part('Weld to crown and band', 'layer', 'Join blade and runner rings in a welded runner example.', 'Alloy welding filler and runner steel', [], {
          refs: [ref('ANDRITZ · Welded Guri II Francis runner', 'https://www.andritz.com/resource/blob/26692/c1fe02e37b9fac9f3b5c59ba9b3da194/gr-annual-report-2009-data.pdf')],
        }),
      ]),
      part('Crown', 'ring', 'Support the inner side of the blades and connect to the hub.', 'Cast or fabricated steel'),
      part('Band', 'ring', 'Support the outside of the runner blade row.', 'Cast or fabricated steel'),
    ], {
      vendors: [vendor('ANDRITZ', 'https://www.andritz.com/hydro-en/about-andritz-hydro/locations/ravensburg-germany/manufacturing', 'Ravensburg site lists Francis runner manufacturing, welding, machining and balancing.')],
    }),
    part('Shaft and discharge', 'shaft', 'Deliver shaft torque and guide water out downstream.', 'Metal shaft and discharge passage', [
      part('Main shaft', 'shaft', 'Transfer runner torque to the generator.', 'Forged steel in large machines'),
      part('Draft tube', 'pipe', 'Slow exiting water and recover part of its pressure before discharge.', 'Steel-lined or concrete passage, depending on plant'),
    ]),
  ], {
    refs: [hydroTurbines],
    vendors: [vendor('ANDRITZ', 'https://www.andritz.com/products-en/hydro/products/turbines-hydropower', 'Offers Francis turbine packages and describes the wicket gates and runner.')],
  });

const alternator = part('Synchronous alternator', 'assembly',
  'Turn shaft power into three-phase AC by electromagnetic induction.', 'Steel core and rotor, insulated copper and metal housing', [
    part('Rotor and field', 'shaft', 'Carry a magnetic field around the air gap.', 'Steel body with copper field windings in the example', [
      part('Rotor body', 'shaft', 'Carry rotation and support the magnetic field structure.', 'Solid steel forging in a cylindrical-rotor example', [
        part('Field slot', 'contact', 'Locate a coil in the rotating body where a slotted rotor is used.', 'Machined feature in the steel body'),
        part('Rotor retaining component', 'ring', 'Hold a rotating field assembly against centrifugal loads.', 'High-strength, machine-specific metal'),
      ]),
      part('Field coil', 'coil', 'Create the rotor magnetic field from DC excitation.', 'Insulated copper conductor', [
        part('Copper turn', 'coil', 'Carry excitation current around the field path.', 'Conductive copper'),
        part('Turn insulation', 'layer', 'Keep adjacent turns from shorting together.', 'Electrical insulation selected for the machine'),
      ]),
    ], { refs: [generatorStudy], vendors: [geGenerator('Lists replacement generator rotors and related parts for supported machines.')] }),
    part('Stator assembly', 'core', 'Hold the stationary AC winding around the rotating field.', 'Laminated electrical steel and insulated copper bars', [
      part('Stator bar', 'coil', 'Carry AC induced by the moving rotor field.', 'Copper conductor with electrical insulation', [
        part('Transposed conductor strands', 'cable', 'Change positions along a Roebel bar to reduce unequal current sharing.', 'Individual insulated copper strands'),
        part('Main insulation', 'layer', 'Electrically separate the bar from the grounded steel core.', 'Mica-based insulation systems are one example'),
        part('Slot wedge', 'plate', 'Keep the stator bar seated in its core slot.', 'Insulating wedge material selected for the machine'),
      ], { refs: [generatorCatalog], vendors: [vendor('MD&A', 'https://www.mdaturbines.com/parts/generator/generator-stator-bars/', 'Offers stator bars and rewind kits for supported generator models.')] }),
      part('Laminated stator core', 'ring', 'Guide changing magnetic flux around the winding.', 'Stacked electrical steel sheets', [
        part('Core lamination', 'layer', 'Limit circulating eddy currents by dividing the core into sheets.', 'Thin electrical steel with insulating surface layer'),
        part('Winding slot', 'contact', 'Locate and support the winding bars.', 'Opening in the stacked core'),
      ], { refs: [generatorCatalog] }),
    ]),
    part('Excitation system', 'board', 'Supply and regulate the DC current that creates the rotor field.', 'Power electronics and insulated field connections', [
      part('Field supply', 'board', 'Provide controlled DC to the rotor winding in a wound-field machine.', 'Power semiconductor assemblies and conductors'),
      part('Collector ring', 'ring', 'Pass current to the rotating field in a brush-and-ring design.', 'Conductive metal ring with insulating support'),
    ], { refs: [generatorStudy], vendors: [geGenerator('Lists brushless exciters and collector brush holders for supported machines.')] }),
    part('Support and output', 'case', 'Align rotating and stationary parts and connect generated AC to the plant circuit.', 'Structural metal and insulated electrical terminals', [
      part('Bearing', 'bearing', 'Support shaft rotation while holding the magnetic air gap in alignment.', 'Metal bearing and model-specific lubrication'),
      part('Output terminal', 'contact', 'Carry generated phase currents into plant cables or bus.', 'Conductive terminal with insulating support'),
    ], { vendors: [geGenerator('Documents generator bearing replacement components and retrofit options.')] }),
  ], { refs: [generatorStudy, generatorCatalog] });

export const generationParts = {
  gas,
  'gas-turbine': combustionTurbine,
  nuclear: reactor,
  'steam-turbine': steamTurbine,
  solar,
  'solar-inverter': solarInverter,
  wind,
  'wind-converter': windConverter,
  hydro,
  'water-turbine': waterTurbine,
  alternator,
};
