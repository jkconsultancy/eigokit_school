// Icon definitions for student authentication
// Must match eigokit_student/src/components/IconSelector.jsx
export const ICONS = [
  { id: 1, name: 'apple', emoji: '🍎' },
  { id: 2, name: 'banana', emoji: '🍌' },
  { id: 3, name: 'orange', emoji: '🍊' },
  { id: 4, name: 'strawberry', emoji: '🍓' },
  { id: 5, name: 'cat', emoji: '🐱' },
  { id: 6, name: 'dog', emoji: '🐶' },
  { id: 7, name: 'bird', emoji: '🐦' },
  { id: 8, name: 'rabbit', emoji: '🐰' },
  { id: 9, name: 'book', emoji: '📚' },
  { id: 10, name: 'pencil', emoji: '✏️' },
  { id: 11, name: 'ball', emoji: '⚽' },
  { id: 12, name: 'car', emoji: '🚗' },
  { id: 13, name: 'sun', emoji: '☀️' },
  { id: 14, name: 'moon', emoji: '🌙' },
  { id: 15, name: 'star', emoji: '⭐' },
  { id: 16, name: 'heart', emoji: '❤️' },
  { id: 17, name: 'house', emoji: '🏠' },
  { id: 18, name: 'tree', emoji: '🌳' },
  { id: 19, name: 'flower', emoji: '🌸' },
  { id: 20, name: 'fish', emoji: '🐟' },
  { id: 21, name: 'bear', emoji: '🐻' },
  { id: 22, name: 'lion', emoji: '🦁' },
  { id: 23, name: 'elephant', emoji: '🐘' },
  { id: 24, name: 'butterfly', emoji: '🦋' },
];

export const getIconById = (id) => ICONS.find(icon => icon.id === id);
export const getIconsByIds = (ids) => ids.map(id => getIconById(id)).filter(Boolean);

