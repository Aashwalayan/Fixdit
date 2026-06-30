export const THEME_STORAGE_KEY = 'fixdit_theme';

export type ThemePreference =
  | 'system'
  | 'light'
  | 'dark'
  | 'fixdit-orange'
  | 'midnight-blue'
  | 'forest-green';

const THEME_ALIASES: Record<string, ThemePreference> = {
  system: 'system',
  light: 'light',
  dark: 'dark',
  'fixdit orange': 'fixdit-orange',
  'fixdit-orange': 'fixdit-orange',
  'midnight blue': 'midnight-blue',
  'midnight-blue': 'midnight-blue',
  'forest green': 'forest-green',
  'forest-green': 'forest-green',
};

export const THEME_LABELS: Record<ThemePreference, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
  'fixdit-orange': 'Fixdit Orange',
  'midnight-blue': 'Midnight Blue',
  'forest-green': 'Forest Green',
};

export const THEME_OPTIONS: ThemePreference[] = [
  'light',
  'dark',
  'system',
  'fixdit-orange',
  'midnight-blue',
  'forest-green',
];

export const normalizeThemePreference = (value?: string | null): ThemePreference => {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  return THEME_ALIASES[normalized] || 'system';
};

export const getStoredThemePreference = (): ThemePreference => {
  if (typeof window === 'undefined') {
    return 'system';
  }

  return normalizeThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
};

export const applyThemePreference = (value?: string | null) => {
  if (typeof document === 'undefined') {
    return 'system';
  }

  const theme = normalizeThemePreference(value);
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  return theme;
};
