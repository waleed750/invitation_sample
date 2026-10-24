import type {DocumentTheme} from './schema';

export interface ThemePreset {
  id: string;
  name: {ar: string; en: string};
  colors: DocumentTheme['colors'];
  fonts: DocumentTheme['fonts'];
}

/** Curated looks the editor can apply in one tap. Colors are all plain hex (the contract's safe-color grammar). */
export const THEME_PRESETS: readonly ThemePreset[] = [
  {id: 'ivory-gold', name: {ar: 'عاجي وذهبي', en: 'Ivory & gold'}, colors: {background: '#fbf6ee', foreground: '#2a2118', muted: '#7a6a58', ivory: '#fffdf8'}, fonts: {heading: 'Amiri', body: 'Tajawal'}},
  {id: 'midnight-gold', name: {ar: 'ليل وذهب', en: 'Midnight & gold'}, colors: {background: '#0f1430', foreground: '#f3e6c4', muted: '#a99c78', ivory: '#1a2048'}, fonts: {heading: 'Amiri', body: 'Cairo'}},
  {id: 'sage-blush', name: {ar: 'أخضر هادئ ووردي', en: 'Sage & blush'}, colors: {background: '#f4f1ea', foreground: '#2f3a2f', muted: '#7d8a76', ivory: '#fbf7f4'}, fonts: {heading: 'El Messiri', body: 'Tajawal'}},
  {id: 'terracotta-teal', name: {ar: 'طوبي وفيروزي', en: 'Terracotta & teal'}, colors: {background: '#f7efe6', foreground: '#3a2418', muted: '#8a6a55', ivory: '#fffaf3'}, fonts: {heading: 'Aref Ruqaa', body: 'Cairo'}},
  {id: 'mono', name: {ar: 'أبيض وأسود', en: 'Black & white'}, colors: {background: '#ffffff', foreground: '#111111', muted: '#6b6b6b', ivory: '#f6f6f6'}, fonts: {heading: 'IBM Plex Sans Arabic', body: 'IBM Plex Sans Arabic'}}
];

export function findThemePreset(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find((preset) => preset.id === id);
}
