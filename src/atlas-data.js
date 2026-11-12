const regionBounds = [-12511900, 3851000, -12336300, 3968066.66667];

export const atlas = {
  projection: 'EPSG:3857',
  bounds: regionBounds,
  overview: {
    src: './atlas/arizona.webp',
    bounds: regionBounds,
    width: 6144,
    height: 4096,
    year: 2023,
  },
  relief: {
    src: './atlas/arizona-relief.png',
    bounds: regionBounds,
    width: 768,
    height: 512,
    min: 180,
    scale: .04,
  },
  patches: [
    {
      src: './atlas/eleven-mile.webp',
      bounds: [-12429400, 3871900, -12415000, 3881500],
      site: 'solar',
      width: 4800,
      height: 3200,
      year: 2025,
    },
    {
      src: './atlas/mesa.webp',
      bounds: [-12433890, 3936645, -12419490, 3946245],
      site: 'mesa',
      width: 4800,
      height: 3200,
      year: 2025,
    },
    {
      src: './atlas/eleven-mile-detail.webp',
      bounds: [-12424600, 3875360, -12420100, 3878360],
      site: 'solar',
      width: 4800,
      height: 3200,
      year: 2025,
    },
    {
      src: './atlas/eleven-mile-interconnect.webp',
      bounds: [-12421160, 3876750, -12417560, 3879150],
      site: 'solar',
      width: 4800,
      height: 3200,
      year: 2025,
    },
    {
      src: './atlas/mesa-detail.webp',
      bounds: [-12428490, 3940245, -12424890, 3942645],
      site: 'mesa',
      width: 4800,
      height: 3200,
      year: 2025,
    },
  ],
  sites: {
    solar: {
      name: 'Eleven Mile Solar Center',
      coords: [-12422354.59785, 3876864.5628],
      latLon: [32.86097, -111.59191],
    },
    mesa: {
      name: 'Meta Mesa Data Center',
      coords: [-12426689.37882, 3941446.84182],
      latLon: [33.34695, -111.63085],
    },
  },
  features: {
    solarSubstation: {
      name: 'Eleven Mile Solar Substation',
      coords: [-12419749, 3877794],
    },
    pinalCentral: {
      name: 'Pinal Central Substation',
      coords: [-12418964, 3878142],
    },
    pricklyPear: {
      name: 'Prickly Pear Substation',
      coords: [-12427005, 3941028],
    },
  },
  track: {
    // Approximate alignment registered to 2025 imagery from Ørsted's public siting map.
    solarSpur: [
      [-12419749, 3877806], [-12419614, 3877806], [-12419570, 3877813],
      [-12419538, 3877842], [-12419504, 3877882], [-12419487, 3877920],
      [-12419487, 3878015], [-12419515, 3878041], [-12419447, 3878051],
      [-12419238, 3878015], [-12419169, 3878049],
    ],
    solarSpurUnderground: 8,
  },
  distanceKm: 54.16,
  credits: 'USDA NAIP · 2023–25 · USGS 3DEP',
};
