// Brand palette, the Snack Buddies' colours, the food catalogue, and the seven
// daily boxes. Every morning a different box arrives: its own colourway,
// learning theme, bead game, meal, and "food of the day".

export const C = {
  coral: '#FF6B5B',
  sun: '#FFC93C',
  mint: '#34C98B',
  sky: '#3FA4F5',
  grape: '#9B6BFF',
  tangerine: '#FF9A3C',
  pink: '#FF7EB6',
  teal: '#22BFC0',
  brand: '#1B5FE0', // app blue
  go: '#3BB54A', // app green
  ink: '#1F2A44',
  cream: '#FFF6E9',
  white: '#FFFFFF',
};

// Colour-pop buttons on the lid: each one is a Snack Buddy, so kids learn a
// colour and a shape per press.
export const POPS = [
  { buddy: 'tri', color: '#F2645A', word: 'Red', hindi: 'लाल', shape: 'triangle', freq: 523.25 },
  { buddy: 'egg', color: '#FFCB5C', word: 'Yellow', hindi: 'पीला', shape: 'oval', freq: 659.25 },
  { buddy: 'cloud', color: '#7FD97B', word: 'Green', hindi: 'हरा', shape: 'cloud', freq: 783.99 },
  { buddy: 'roof', color: '#6FAEF0', word: 'Blue', hindi: 'नीला', shape: 'house', freq: 1046.5 },
];

export const NUMBER_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five'];
const RAINBOW = ['#FF4D4D', '#FF9A3C', '#FFD23F', '#2FC37A', '#3D8BFF'];
const RAINBOW_WORDS = ['Red', 'Orange', 'Yellow', 'Green', 'Blue'];

// Bead games on the side rail, one per day.
export const BEADS = {
  ducks: {
    kind: 'duck', colors: Array(5).fill('#FFD23F'), heading: 'Count the ducks!', icon: '🦆',
    say: (n) => (n === 0 ? 'No ducks. Quack! Let’s count again.' : `${NUMBER_WORDS[n]} duck${n > 1 ? 's' : ''}! Quack${' quack'.repeat(n - 1)}!`),
  },
  oranges: {
    kind: 'orange', colors: Array(5).fill('#FF9A2E'), heading: 'Count the oranges!', icon: '🍊',
    say: (n) => (n === 0 ? 'No oranges left!' : `${NUMBER_WORDS[n]} orange${n > 1 ? 's' : ''}!`),
  },
  cubes: {
    kind: 'cube', colors: RAINBOW, heading: 'Count the cubes!', icon: '🟦',
    say: (n) => (n === 0 ? 'No cubes. Let’s build again!' : `${NUMBER_WORDS[n]} cube${n > 1 ? 's' : ''}! Squares on every side.`),
  },
  wheels: {
    kind: 'wheel', colors: Array(5).fill('#2B2F3A'), heading: 'Count the wheels!', icon: '🛞',
    say: (n) => [
      'No wheels. Beep beep!', 'One wheel, like a unicycle!', 'Two wheels, like a bicycle!',
      'Three wheels, like an auto rickshaw!', 'Four wheels, like a car!', 'Five wheels! That’s a lot of wheels!',
    ][n],
  },
  numbers: {
    kind: 'number', colors: RAINBOW, heading: 'Count to five!', icon: '5',
    say: (n) => (n === 0 ? 'Zero!' : `${Array.from({ length: n }, (_, i) => NUMBER_WORDS[i + 1]).join(', ')}!`),
  },
  colours: {
    kind: 'sphere', colors: RAINBOW, heading: 'Name the colours!', icon: '🌈', colourMode: true,
    say: (n, i) => `${RAINBOW_WORDS[i]}!`,
  },
  stars: {
    kind: 'star', colors: Array(5).fill('#FFD23F'), heading: 'Count the stars!', icon: '⭐',
    say: (n) => (n === 0 ? 'No stars. Where did they go?' : `${NUMBER_WORDS[n]} twinkly star${n > 1 ? 's' : ''}!`),
  },
};

// Everything that can go into a compartment. `icon` shows in the speech bubble.
export const FOODS = {
  idli: { icon: '🍚', name: 'Mini idlis', note: 'Soft, steamed and fermented. Easy on little tummies.' },
  paneer: { icon: '🧀', name: 'Soft paneer cubes', note: 'Fresh this morning. The protein star of the box.' },
  pancakeRagi: { icon: '🥞', name: 'Ragi banana pancakes', note: 'Finger millet + banana. Iron and calcium, no added sugar.' },
  pancakeOat: { icon: '🥞', name: 'Oat & carrot pancakes', note: 'Fluffy oat pancakes with carrot folded in.' },
  chilla: { icon: '🌯', name: 'Moong chilla rolls', note: 'Rolled lentil crêpes with a soft veggie filling.' },
  sweetPotato: { icon: '🍠', name: 'Sweet potato bites', note: 'Roasted soft and naturally sweet.' },
  mango: { icon: '🥭', name: 'Mango cubes', note: 'Ripe Alphonso, cut soft and toddler-safe.' },
  papaya: { icon: '🧡', name: 'Papaya cubes', note: 'Soft, sweet and great for digestion.' },
  apple: { icon: '🍎', name: 'Stewed apple cubes', note: 'Gently cooked so they’re soft to chew.' },
  banana: { icon: '🍌', name: 'Banana coins', note: 'Sliced thin, no added anything.' },
  carrot: { icon: '🥕', name: 'Grated carrot', note: 'Finely grated so tiny teeth can manage.' },
  cucumber: { icon: '🥒', name: 'Cucumber fingers', note: 'Cool and crunchy, cut into easy-grip sticks.' },
  beetroot: { icon: '🟣', name: 'Roasted beetroot', note: 'Soft cubes. Yes, they turn fingers pink!' },
  makhana: { icon: '🍿', name: 'Roasted makhana', note: 'Fox nuts roasted in a little ghee. Melts in the mouth.' },
  ragiStars: { icon: '⭐', name: 'Ragi star cookies', note: 'Finger millet + oats. No added sugar.' },
  bananaBites: { icon: '🍪', name: 'Banana-oat bites', note: 'Sweetened only by banana.' },
};

export const SPREADS = {
  curd: { name: 'Hung-curd dip', color: '#6FC3E8' },
  mashedBanana: { name: 'Mashed banana', color: '#F2C94C' },
  hummus: { name: 'Mild hummus', color: '#C9A46A' },
  sunflower: { name: 'Sunflower seed butter', color: '#C98F4E' },
  date: { name: 'Date & coconut spread', color: '#8A4B2A' },
  chutney: { name: 'Coconut chutney', color: '#58B368' },
};

// Toddler (1–3 yrs) daily reference values used for the % on the nutrition card.
export const DAILY = { kcal: 1060, protein: 12.5, fat: 30, carbs: 130, iron: 8, calcium: 500 };

const e = (pic, word, say) => ({ kind: 'emoji', pic, word, say });

export const DAYS = [
  {
    key: 'mon', day: 'Monday', short: 'Mon', theme: 'Animals', buddy: 'roof',
    body: C.sky, lid: C.sun, accent: C.coral, print: '#FFFFFF',
    beads: 'ducks',
    meal: {
      name: 'Ragi Banana Pancakes', desc: 'Fluffy finger-millet pancakes, sweetened only with banana.',
      food: ['pancakeRagi', 'mango', 'cucumber', 'makhana'], spread: 'curd',
      ingredients: ['Ragi', 'Banana', 'Curd', 'Mango', 'Cucumber', 'Makhana'],
      n: { kcal: 190, protein: 4.2, fat: 5, carbs: 29, iron: 2.1, calcium: 120, sugar: 6 },
      free: ['Tree nut', 'Egg'],
    },
    hero: { pic: '🥭', name: 'Mango', facts: ['Yellow-orange', 'Soft & juicy', 'Grows on big trees'], say: 'This is a mango. It is soft, juicy and sweet, and it grows on big trees. Can you find the mango in your box?' },
    items: [
      e('🐄', 'Cow', 'Cow! The cow says moo.'),
      e('🦆', 'Duck', 'Duck! The duck says quack quack.'),
      e('🦁', 'Lion', 'Lion! The lion says roar!'),
      e('🐘', 'Elephant', 'Elephant! The elephant is big.'),
      e('🐶', 'Dog', 'Dog! The dog says woof woof.'),
      e('🐱', 'Cat', 'Cat! The cat says meow.'),
    ],
  },
  {
    key: 'tue', day: 'Tuesday', short: 'Tue', theme: 'Fruits', buddy: 'egg',
    body: C.sun, lid: C.coral, accent: C.mint, print: C.ink,
    beads: 'oranges',
    meal: {
      name: 'Moong Dal & Paneer Mini Idlis', desc: 'Soft steamed lentil and paneer bites, served with mashed banana.',
      food: ['idli', 'banana', 'carrot', 'paneer'], spread: 'mashedBanana',
      ingredients: ['Moong dal', 'Paneer', 'Ghee', 'Grated carrot', 'Banana'],
      n: { kcal: 180, protein: 4, fat: 3, carbs: 20, iron: 1.5, calcium: 60, sugar: 4 },
      free: ['Tree nut', 'Gluten'],
    },
    hero: { pic: '🍌', name: 'Banana', facts: ['Long & yellow', 'Soft & sweet', 'Grows in big bunches'], say: 'This is a banana. It is long, yellow and sweet, and grows in big bunches. There’s mashed banana in your little tub!' },
    items: [
      e('🍎', 'Apple', 'Apple! Crunchy and red.'),
      e('🍌', 'Banana', 'Banana! Long and yellow.'),
      e('🥭', 'Mango', 'Mango! The king of fruits.'),
      e('🍇', 'Grapes', 'Grapes! Small and round.'),
      e('🍊', 'Orange', 'Orange! Juicy and orange.'),
      e('🍉', 'Watermelon', 'Watermelon! Big and juicy.'),
    ],
  },
  {
    key: 'wed', day: 'Wednesday', short: 'Wed', theme: 'Shapes', buddy: 'tri',
    body: C.mint, lid: C.grape, accent: C.sun, print: '#FFFFFF',
    beads: 'cubes',
    meal: {
      name: 'Veggie Moong Chilla Rolls', desc: 'Rolled lentil crêpes with a soft veggie filling.',
      food: ['chilla', 'apple', 'beetroot', 'ragiStars'], spread: 'hummus',
      ingredients: ['Moong dal', 'Spinach', 'Apple', 'Beetroot', 'Ragi', 'Chickpea'],
      n: { kcal: 200, protein: 5, fat: 5, carbs: 27, iron: 2.4, calcium: 70, sugar: 5 },
      free: ['Tree nut', 'Dairy'],
    },
    hero: { pic: '🍎', name: 'Apple', facts: ['Red or green', 'Crunchy when raw', 'Grows on trees'], say: 'This is an apple. Apples are red or green, and they grow on trees. Today your apple is cooked soft. Can you find it?' },
    items: [
      { kind: 'shape', shape: 'circle', color: C.coral, word: 'Circle', say: 'Circle! Round and round.' },
      { kind: 'shape', shape: 'square', color: C.sky, word: 'Square', say: 'Square! Four sides.' },
      { kind: 'shape', shape: 'triangle', color: C.sun, word: 'Triangle', say: 'Triangle! Three sides.' },
      { kind: 'shape', shape: 'star', color: C.grape, word: 'Star', say: 'Star! Twinkle twinkle.' },
      { kind: 'shape', shape: 'heart', color: C.pink, word: 'Heart', say: 'Heart! I love you.' },
      { kind: 'shape', shape: 'oval', color: C.mint, word: 'Oval', say: 'Oval! Just like an egg.' },
    ],
  },
  {
    key: 'thu', day: 'Thursday', short: 'Thu', theme: 'Vehicles', buddy: 'bloop',
    body: C.coral, lid: C.sky, accent: C.sun, print: '#FFFFFF',
    beads: 'wheels',
    meal: {
      name: 'Sweet Potato & Paneer Bites', desc: 'Roasted sweet potato with soft paneer and banana coins.',
      food: ['sweetPotato', 'banana', 'cucumber', 'bananaBites'], spread: 'sunflower',
      ingredients: ['Sweet potato', 'Paneer', 'Banana', 'Oats', 'Cucumber', 'Sunflower seed'],
      n: { kcal: 210, protein: 4.6, fat: 6, carbs: 30, iron: 1.8, calcium: 110, sugar: 7 },
      free: ['Tree nut', 'Egg'],
    },
    hero: { pic: '🍠', name: 'Sweet potato', facts: ['Orange inside', 'Soft when cooked', 'Grows under the ground'], say: 'This is a sweet potato. It is orange inside, and it grows under the ground! Can you find it in your box?' },
    items: [
      e('🚗', 'Car', 'Car! Beep beep!'),
      e('🚌', 'Bus', 'Bus! The wheels go round and round.'),
      e('🚂', 'Train', 'Train! Choo choo!'),
      e('⛵', 'Boat', 'Boat! It floats on the water.'),
      e('✈️', 'Plane', 'Aeroplane! Zoom, up high!'),
      e('🛺', 'Auto', 'Auto rickshaw! Toot toot!'),
    ],
  },
  {
    key: 'fri', day: 'Friday', short: 'Fri', theme: 'Numbers', buddy: 'cloud',
    body: C.grape, lid: C.mint, accent: C.tangerine, print: '#FFFFFF',
    beads: 'numbers',
    meal: {
      name: 'Oat & Carrot Pancake Stack', desc: 'Mini oat pancakes with carrot, mango and a date spread.',
      food: ['pancakeOat', 'mango', 'carrot', 'makhana'], spread: 'date',
      ingredients: ['Oats', 'Carrot', 'Curd', 'Mango', 'Makhana', 'Dates'],
      n: { kcal: 195, protein: 4.1, fat: 5, carbs: 30, iron: 1.6, calcium: 90, sugar: 8 },
      free: ['Tree nut', 'Soy'],
    },
    hero: { pic: '🥕', name: 'Carrot', facts: ['Orange & crunchy', 'Grows under the ground', 'Good for your eyes'], say: 'This is a carrot. Carrots are orange and crunchy, and they grow under the ground. Can you find the carrot in your box?' },
    items: [1, 2, 3, 4, 5, 6].map((n) => ({
      kind: 'number', n, word: ['One', 'Two', 'Three', 'Four', 'Five', 'Six'][n - 1],
      say: `${['One', 'Two', 'Three', 'Four', 'Five', 'Six'][n - 1]}! Let's count: ${Array.from({ length: n }, (_, i) => i + 1).join(', ')}.`,
    })),
  },
  {
    key: 'sat', day: 'Saturday', short: 'Sat', theme: 'Colours', buddy: 'wavy',
    body: C.tangerine, lid: C.pink, accent: C.sky, print: C.ink,
    beads: 'colours',
    meal: {
      name: 'Rainbow Paneer Bento', desc: 'Every colour on one plate: paneer, papaya, cucumber and beetroot.',
      food: ['paneer', 'papaya', 'cucumber', 'beetroot'], spread: 'curd',
      ingredients: ['Paneer', 'Papaya', 'Cucumber', 'Beetroot', 'Curd'],
      n: { kcal: 185, protein: 5.2, fat: 7, carbs: 21, iron: 1.4, calcium: 160, sugar: 6 },
      free: ['Tree nut', 'Gluten'],
    },
    hero: { pic: '🥒', name: 'Cucumber', facts: ['Green outside', 'Cool & crunchy', 'Grows on a vine'], say: 'This is a cucumber. It is green outside, cool and crunchy, and it grows on a vine. Can you find it?' },
    items: [
      { kind: 'color', color: '#FF4D4D', word: 'Red', say: 'Red! Like a tomato.' },
      { kind: 'color', color: '#3D8BFF', word: 'Blue', say: 'Blue! Like the sky.' },
      { kind: 'color', color: '#FFD23F', word: 'Yellow', say: 'Yellow! Like a banana.' },
      { kind: 'color', color: '#2FC37A', word: 'Green', say: 'Green! Like a leaf.' },
      { kind: 'color', color: '#9B6BFF', word: 'Purple', say: 'Purple! Like grapes.' },
      { kind: 'color', color: '#FF9A3C', word: 'Orange', say: 'Orange! Like an orange.' },
    ],
  },
  {
    key: 'sun', day: 'Sunday', short: 'Sun', theme: 'Sky', buddy: 'egg',
    body: C.teal, lid: C.sun, accent: C.grape, print: '#FFFFFF',
    beads: 'stars',
    meal: {
      name: 'Sunday Idli & Chutney', desc: 'Mini idlis with coconut chutney, banana and oat bites.',
      food: ['idli', 'banana', 'cucumber', 'bananaBites'], spread: 'chutney',
      ingredients: ['Rice', 'Urad dal', 'Coconut', 'Banana', 'Oats', 'Cucumber'],
      n: { kcal: 175, protein: 3.8, fat: 5, carbs: 27, iron: 1.3, calcium: 55, sugar: 5 },
      free: ['Tree nut', 'Dairy'],
    },
    hero: { pic: '🥥', name: 'Coconut', facts: ['Hard & hairy outside', 'White inside', 'Grows on tall palms'], say: 'This is a coconut. It is hard and hairy outside and white inside. Your chutney is made from coconut!' },
    items: [
      e('☀️', 'Sun', 'Sun! Good morning, sun.'),
      e('🌙', 'Moon', 'Moon! Good night, moon.'),
      e('⭐', 'Star', 'Star! Twinkle twinkle, little star.'),
      e('☁️', 'Cloud', 'Cloud! Soft and fluffy.'),
      e('🌧️', 'Rain', 'Rain! Pitter patter.'),
      e('🌈', 'Rainbow', 'Rainbow! So many colours.'),
    ],
  },
];

// Mon = 0 … Sun = 6
export const todayIndex = () => (new Date().getDay() + 6) % 7;
