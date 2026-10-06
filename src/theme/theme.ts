import type { ViewStyle } from 'react-native';

export const colors = {
  bg: '#FFFFFF',
  card: '#F4F8F7',
  text: '#203D38',
  muted: '#657C77',
  accent: '#167B62',
  blue: '#3979B8',
  greenSoft: '#E7F4ED',
  blueSoft: '#EAF2FB',
  border: '#E1EBE7',
  error: '#A53C47',
  errorSoft: '#FFF0F1',
};

export const softShadow: ViewStyle['boxShadow'] = [
  { offsetX: 5, offsetY: 6, blurRadius: 16, color: '#DCE5E180' },
  { offsetX: -5, offsetY: -5, blurRadius: 14, color: '#FFFFFF' },
];
export const insetShadow: ViewStyle['boxShadow'] = [
  { offsetX: 2, offsetY: 3, blurRadius: 6, color: '#D6E1DC90', inset: true },
  { offsetX: -2, offsetY: -2, blurRadius: 5, color: '#FFFFFF', inset: true },
];
