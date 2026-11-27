const scene = (title = '', caption = '', image = '') => ({
  title, caption, photo: image ? `./assets/${image}.webp` : '',
});

export const example = {
  post: {
    main: scene('The red landing', 'One figure, one flight of stairs, and a rectangle of late light.', 'red-landing'),
    context: scene('Study in hard light', 'The skylight divides the concrete into two planes. I waited for the figure to reach the edge of the light.', 'red-landing'),
    grade: 'original',
  },
  story: {
    opening: scene('The last train left.', 'The platform is empty. Two ways out are still lit.', 'last-platform'),
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

export function refreshStockExamples(saved) {
  const samples = [
    [saved.post.main, scene('Blue hour on the ridge', 'The last orange light reached the clouds just as the valley went quiet.', 'blue-hour'), example.post.main],
    [saved.post.context, scene('Wait for the light to return', 'Ten minutes after sunset, the warm light came back. Staying for that second change made the frame.', 'alpenglow'), example.post.context],
    [saved.story.opening, scene('The last train left.', 'The rain has eased. There are two ways home from here.', 'tokyo'), example.story.opening],
  ];
  for (const [current, previous, replacement] of samples) {
    if (current && !current.effect && !current.gesture &&
        Object.entries(previous).every(([field, value]) => current[field] === value)) {
      Object.assign(current, replacement);
    }
  }
}

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
