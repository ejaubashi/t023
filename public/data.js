export const people = {
  maya: { name: 'Maya Chen', handle: 'mayachen', avatar: './assets/maya.webp' },
  eli: { name: 'Eli Brooks', handle: 'elibrooks', avatar: './assets/eli.webp' },
  iris: { name: 'Iris Park', handle: 'irispark', avatar: './assets/iris.webp' },
  sam: { name: 'Sam Rivera', handle: 'samrivera', avatar: './assets/sam.webp' },
};

export const currentUser = 'sam';

export const posts = [
  {
    id: 'blue-hour',
    author: 'maya',
    age: '2h ago',
    title: 'Blue hour, off the grid.',
    caption: 'We stayed until the trail emptied and the whole valley turned blue.',
    image: { src: './assets/blue-hour.webp', alt: 'An orange-jacketed hiker overlooks a valley between blue mountain ridges at dusk.' },
    likes: 128,
    living: true,
    updates: [
      {
        id: 'blue-hour-later',
        title: 'The light stayed a little longer.',
        caption: 'Ten minutes after sunset, the pink came back for a moment. This was the frame just before it disappeared.',
        age: '1h ago',
        image: { src: './assets/alpenglow.webp', alt: 'Dark grasses and mountain silhouettes against a coral horizon.' },
      },
      {
        id: 'blue-hour-route',
        title: 'A pin for next time.',
        caption: 'The last bend before the ridge is the spot. I’d go back just to hear the wind change there.',
        age: '45m ago',
      },
    ],
  },
  {
    id: 'after-rain',
    author: 'eli',
    age: '1h ago',
    title: 'Same hour, different city.',
    caption: 'Maya’s blue hour made me look up on my way home. Here’s what that in-between light looks like from this side of the world.',
    image: { src: './assets/tokyo.webp', alt: 'A pedestrian with an umbrella walks along a rain-soaked city street.' },
    likes: 56,
    remixOf: 'blue-hour',
    updates: [],
  },
  {
    id: 'slow-morning',
    author: 'iris',
    age: '7h ago',
    title: 'A morning with no plans.',
    caption: 'Five minutes for coffee turned into an hour. I’m keeping the good part.',
    image: { src: './assets/coffee.webp', alt: 'Coffee and a small pink flower on a sunlit counter.' },
    likes: 42,
    updates: [],
  },
];

export const stories = [
  {
    id: 'poolside',
    title: 'Poolside',
    author: 'iris',
    tone: 'blue',
    shared: true,
    frames: [
      {
        id: 'pool-1',
        author: 'iris',
        caption: 'First one in.',
        image: { src: './assets/pool.webp', alt: 'Sunlight ripples across the cobalt water of a swimming pool.' },
      },
      {
        id: 'pool-2',
        author: 'maya',
        caption: 'Some afternoons taste like oranges.',
        image: { src: './assets/pool-orange.webp', alt: 'An orange and striped towels sit beside a blue pool.' },
      },
      {
        id: 'pool-3',
        author: 'eli',
        caption: 'Nobody checked the time.',
      },
    ],
  },
  {
    id: 'night-shift',
    title: 'Night shift',
    author: 'eli',
    tone: 'pink',
    shared: false,
    frames: [
      {
        id: 'night-1',
        author: 'eli',
        caption: 'You notice more when the rain makes you slow down.',
        image: { src: './assets/tokyo.webp', alt: 'An umbrella passes through a narrow street with orange lights reflecting in puddles.' },
      },
      {
        id: 'night-2',
        author: 'eli',
        caption: 'In the quiet, even a vending machine looks like a little theater.',
        image: { src: './assets/vending.webp', alt: 'A glowing orange vending machine reflects light onto wet pavement.' },
        reveal: true,
      },
    ],
  },
  {
    id: 'the-long-way',
    title: 'The long way',
    author: 'maya',
    tone: 'green',
    shared: true,
    frames: [
      {
        id: 'coast-1',
        author: 'maya',
        caption: 'We took the road that hugged the coast.',
        image: { src: './assets/coast.webp', alt: 'Sunlit coastal cliffs descend into a dark teal ocean.' },
      },
      {
        id: 'coast-2',
        author: 'iris',
        caption: 'The part I remember is the sound.',
        image: { src: './assets/coast-wave.webp', alt: 'A wave curls against a rocky coastal cliff.' },
      },
    ],
  },
  {
    id: 'slow-mornings',
    title: 'Slow mornings',
    author: 'iris',
    tone: 'peach',
    shared: false,
    frames: [
      {
        id: 'coffee-1',
        author: 'iris',
        caption: 'Coffee for one. The sunny seat.',
        image: { src: './assets/coffee.webp', alt: 'Soft morning sunlight falls across a glass of black coffee.' },
      },
      {
        id: 'coffee-2',
        author: 'iris',
        caption: 'A reminder to leave the first hour open.',
      },
    ],
  },
];
