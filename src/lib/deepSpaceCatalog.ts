export interface DeepSpaceTarget {
  id: string;
  name: string;
  ra: string;             // Right Ascension string
  dec: string;            // Declination string
  distance: string;       // Distance string
  constellation: string;  // Celestial constellation
  objectType: string;     // Classification of object
  resonanceFreq: number;  // Matching stabilizer resonance frequency (Hz)
  description: string;    // Physics lore/scientific context
  color: string;          // Hex color for UI representation
  coordinateAngles: {
    raRad: number;        // RA converted to radians (0 to 2*PI)
    decRad: number;       // DEC converted to radians (-PI/2 to PI/2)
  };
}

export const DEEP_SPACE_CATALOG: DeepSpaceTarget[] = [
  {
    id: 'sgr-a',
    name: 'Sagittarius A* (Sgr A*)',
    ra: '17h 45m 40.0s',
    dec: '-29° 00\' 28.1"',
    distance: '26,673 Light Years',
    constellation: 'Sagittarius',
    objectType: 'Supermassive Black Hole',
    resonanceFreq: 48.5, // 48.5 Hz stabilizer requirement
    description: 'The highly dense central gravitational anchor of our Milky Way Galaxy. Surrounded by high-velocity orbiting S-stars and radiating high-energy synchrotron emissions.',
    color: '#fb923c', // Warm Golden Orange
    coordinateAngles: {
      raRad: 4.65, // ~17.76 hours in radians
      decRad: -0.51 // ~-29 degrees in radians
    }
  },
  {
    id: 'andromeda',
    name: 'Andromeda Galaxy (M31)',
    ra: '00h 42m 44.3s',
    dec: '+41° 16\' 09.4"',
    distance: '2.537 Million Light Years',
    constellation: 'Andromeda',
    objectType: 'Spiral Galaxy',
    resonanceFreq: 72.2, // 72.2 Hz
    description: 'The closest major sister galaxy in our Local Group. Currently on a collision trajectory with the Milky Way, bridged by dark matter filaments and stellar streams.',
    color: '#a855f7', // Violet purple
    coordinateAngles: {
      raRad: 0.18, // ~0.71 hours
      decRad: 0.72  // ~41 degrees
    }
  },
  {
    id: 'crab-nebula',
    name: 'Crab Nebula Pulsar (M1)',
    ra: '05h 34m 31.9s',
    dec: '+22° 00\' 52.1"',
    distance: '6,500 Light Years',
    constellation: 'Taurus',
    objectType: 'Supernova Remnant Pulsar',
    resonanceFreq: 30.2, // 30.2 Hz (matches Crab Pulsar rotation!)
    description: 'A spinning magnetized neutron star born from a historical supernova in 1054 AD. It rotates exactly 30.2 times a second, flashing relativistic wind pulses across the sky.',
    color: '#f43f5e', // Vibrant rose red
    coordinateAngles: {
      raRad: 1.46, // ~5.57 hours
      decRad: 0.38  // ~22 degrees
    }
  },
  {
    id: 'kepler-186f',
    name: 'Kepler-186f Exoplanet',
    ra: '19h 54m 31.0s',
    dec: '+44° 20\' 38.0"',
    distance: '582 Light Years',
    constellation: 'Cygnus',
    objectType: 'Habitable Terrestrial Exo-world',
    resonanceFreq: 19.8, // 19.8 Hz
    description: 'First validated Earth-sized planet in the liquid-water zone of a distant M-dwarf star. Orbital period is 129 days, with potential atmospheric ozone and liquid vapor.',
    color: '#10b981', // Emerald green
    coordinateAngles: {
      raRad: 5.21, // ~19.9 hours
      decRad: 0.77  // ~44 degrees
    }
  }
];
