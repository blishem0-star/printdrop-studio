export type TShirtColor = {
  id: string;
  name: string;
  hex: string;
  textColor: string;
};

export type TShirtSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';

export type Design = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  price: number;
  rating: number;
  reviews: number;
  badge?: 'bestseller' | 'new' | 'trending' | 'ai';
  description: string;
  availableColors: string[];
  svgContent?: string;
  emoji?: string;
  bgGradient: string;
};

export const SHIRT_COLORS: TShirtColor[] = [
  { id: 'black', name: 'Midnight Black', hex: '#0d0d0d', textColor: '#fff' },
  { id: 'white', name: 'Pure White', hex: '#f5f5f5', textColor: '#000' },
  { id: 'navy', name: 'Deep Navy', hex: '#1a2744', textColor: '#fff' },
  { id: 'charcoal', name: 'Charcoal', hex: '#2d2d2d', textColor: '#fff' },
  { id: 'red', name: 'Crimson Red', hex: '#c0392b', textColor: '#fff' },
  { id: 'forest', name: 'Forest Green', hex: '#1e3a2f', textColor: '#fff' },
  { id: 'sand', name: 'Desert Sand', hex: '#d4b896', textColor: '#333' },
  { id: 'slate', name: 'Slate Blue', hex: '#3d5a80', textColor: '#fff' },
];

export const SHIRT_SIZES: TShirtSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const DESIGNS: Design[] = [
  {
    id: '1',
    title: 'Cosmic Wanderer',
    category: 'Abstract',
    tags: ['space', 'minimal', 'art'],
    price: 29.99,
    rating: 4.9,
    reviews: 312,
    badge: 'bestseller',
    description: 'A minimalist cosmic design with floating geometric shapes',
    availableColors: ['black', 'navy', 'charcoal'],
    emoji: '🌌',
    bgGradient: 'from-indigo-950 via-purple-900 to-indigo-950',
  },
  {
    id: '2',
    title: 'Tokyo Neon',
    category: 'Urban',
    tags: ['city', 'neon', 'japanese'],
    price: 32.99,
    rating: 4.8,
    reviews: 198,
    badge: 'trending',
    description: 'Cyberpunk-inspired neon cityscape of Tokyo',
    availableColors: ['black', 'charcoal'],
    emoji: '🏙️',
    bgGradient: 'from-pink-950 via-fuchsia-900 to-purple-950',
  },
  {
    id: '3',
    title: 'Wild Roots',
    category: 'Nature',
    tags: ['botanical', 'earth', 'organic'],
    price: 27.99,
    rating: 4.7,
    reviews: 145,
    badge: 'new',
    description: 'Hand-drawn botanical illustration with wild plants',
    availableColors: ['white', 'sand', 'forest'],
    emoji: '🌿',
    bgGradient: 'from-green-950 via-emerald-900 to-green-950',
  },
  {
    id: '4',
    title: 'Make Waves',
    category: 'Typography',
    tags: ['motivational', 'bold', 'text'],
    price: 24.99,
    rating: 4.9,
    reviews: 421,
    badge: 'bestseller',
    description: 'Bold typographic statement with wave effect',
    availableColors: ['black', 'white', 'navy', 'red'],
    emoji: '🌊',
    bgGradient: 'from-blue-950 via-cyan-900 to-blue-950',
  },
  {
    id: '5',
    title: 'Retro Vibes',
    category: 'Vintage',
    tags: ['retro', '80s', 'sunset'],
    price: 29.99,
    rating: 4.6,
    reviews: 87,
    description: 'Retro 80s aesthetic with sunset palm trees',
    availableColors: ['black', 'charcoal', 'slate'],
    emoji: '🌅',
    bgGradient: 'from-orange-950 via-red-900 to-pink-950',
  },
  {
    id: '6',
    title: 'AI Dream',
    category: 'AI Generated',
    tags: ['ai', 'surreal', 'digital'],
    price: 34.99,
    rating: 5.0,
    reviews: 62,
    badge: 'ai',
    description: 'AI-generated surrealist dreamscape',
    availableColors: ['black', 'charcoal'],
    emoji: '🤖',
    bgGradient: 'from-violet-950 via-purple-900 to-fuchsia-950',
  },
  {
    id: '7',
    title: 'Mountain High',
    category: 'Nature',
    tags: ['mountain', 'adventure', 'outdoor'],
    price: 26.99,
    rating: 4.8,
    reviews: 203,
    description: 'Minimalist mountain range silhouette',
    availableColors: ['white', 'navy', 'slate', 'forest'],
    emoji: '⛰️',
    bgGradient: 'from-slate-950 via-blue-950 to-slate-950',
  },
  {
    id: '8',
    title: 'Street Code',
    category: 'Urban',
    tags: ['graffiti', 'urban', 'street'],
    price: 31.99,
    rating: 4.7,
    reviews: 156,
    badge: 'trending',
    description: 'Urban street art inspired graphic',
    availableColors: ['black', 'white', 'charcoal'],
    emoji: '🎨',
    bgGradient: 'from-yellow-950 via-orange-900 to-red-950',
  },
];

export const CATEGORIES = ['All', 'Abstract', 'Urban', 'Nature', 'Typography', 'Vintage', 'AI Generated'];

export const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    location: 'New York',
    rating: 5,
    text: 'Ordered 3 shirts for my team — the quality is insane. The design process took me literally 3 minutes. Shipping was super fast too.',
    avatar: 'SM',
    design: 'Cosmic Wanderer',
  },
  {
    name: 'Jake R.',
    location: 'Los Angeles',
    rating: 5,
    text: 'The AI designs are next level. I described what I wanted and got exactly that. No more settling for generic designs.',
    avatar: 'JR',
    design: 'AI Dream',
  },
  {
    name: 'Priya K.',
    location: 'London',
    rating: 5,
    text: 'Ordered as a gift. My brother cried (happy tears). The print quality is sharp and the fabric is so soft.',
    avatar: 'PK',
    design: 'Make Waves',
  },
];

export const STATS = [
  { value: '50K+', label: 'Shirts Printed' },
  { value: '4.9★', label: 'Average Rating' },
  { value: '72h', label: 'Fast Delivery' },
  { value: '100%', label: 'Satisfaction' },
];

export const BASE_PRICE = 24.99;
export const SHIPPING_PRICE = 4.99;
