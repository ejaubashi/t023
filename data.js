const scene = (title = '', caption = '', image = '') => ({
  title, caption, photo: image ? `./assets/${image}.webp` : '',
});

export const example = {
  post: {
    main: scene('Blue hour on the ridge', 'The last orange light reached the clouds just as the valley went quiet.', 'blue-hour'),
    context: scene('Wait for the light to return', 'Ten minutes after sunset, the warm light came back. Staying for that second change made the frame.', 'alpenglow'),
    grade: 'warm',
  },
  story: {
    opening: scene('The last train left.', 'The rain has eased. There are two ways home from here.', 'tokyo'),
    routes: [
      {
        name: 'Follow the lights',
        frames: [
          scene('Still open.', 'Beyond the vending machine, someone is wiping down a café counter.', 'vending'),
          scene('The last warm seat.', 'You ask for something hot. The owner leaves the door open for the smell of rain.', 'coffee'),
        ],
      },
      {
        name: 'Take the shore road',
        frames: [
          scene('Follow the sound.', 'At the bend, the sound of traffic gives way to the swell.', 'coast-wave'),
          scene('The long way home.', 'A strip of light reaches the cliff. You stay long enough to watch it go.', 'coast'),
        ],
      },
    ],
  },
};

export const blank = {
  post: { main: scene(), context: scene(), grade: 'original' },
  story: {
    opening: scene(),
    routes: [
      { name: 'First route', frames: [scene(), scene()] },
      { name: 'Second route', frames: [scene(), scene()] },
    ],
  },
};

export const grades = {
  original: { label: 'Original', filter: 'none' },
  warm: { label: 'Warm', filter: 'sepia(.31) saturate(1.28) contrast(1.08)' },
  cool: { label: 'Cool', filter: 'hue-rotate(17deg) saturate(.77) contrast(1.06)' },
  mono: { label: 'Mono', filter: 'grayscale(1) contrast(1.14)' },
};
