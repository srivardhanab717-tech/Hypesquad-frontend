/**
 * HypeSquad Theme Tokens
 *
 * Light + Dark themes sharing one structure.
 * Orange (#FF6B35) is the primary brand accent in both modes.
 * Theme preference persists via AsyncStorage (non-sensitive).
 */

// ---------------------------------------------------------------------------
// Spacing scale
// ---------------------------------------------------------------------------

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ---------------------------------------------------------------------------
// Typography scale
// ---------------------------------------------------------------------------

export const typography = {
  heading1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  heading2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  heading3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  bodyBold: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  captionBold: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 20 },
} as const;

// ---------------------------------------------------------------------------
// Color palettes
// ---------------------------------------------------------------------------

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textInverse: string;
  border: string;
  borderLight: string;
  disabled: string;
  overlay: string;
  card: string;
  tabBar: string;
  tabBarInactive: string;
}

const sharedColors = {
  primary: '#FF6B35',
  primaryLight: '#FF8F66',
  primaryDark: '#CC5528',
  error: '#E53935',
  success: '#43A047',
  warning: '#FB8C00',
  info: '#1E88E5',
};

const lightColors: ThemeColors = {
  ...sharedColors,
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceElevated: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  textInverse: '#FFFFFF',
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  disabled: '#BDBDBD',
  overlay: 'rgba(0, 0, 0, 0.5)',
  card: '#FFFFFF',
  tabBar: '#FFFFFF',
  tabBarInactive: '#999999',
};

const darkColors: ThemeColors = {
  ...sharedColors,
  background: '#121212',
  surface: '#1E1E1E',
  surfaceElevated: '#2C2C2C',
  text: '#F5F5F5',
  textSecondary: '#A0A0A0',
  textInverse: '#1A1A1A',
  border: '#333333',
  borderLight: '#2A2A2A',
  disabled: '#555555',
  overlay: 'rgba(0, 0, 0, 0.7)',
  card: '#1E1E1E',
  tabBar: '#1A1A1A',
  tabBarInactive: '#777777',
};

export interface Theme {
  dark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  typography: typeof typography;
}

// ---------------------------------------------------------------------------
// Exported themes
// ---------------------------------------------------------------------------

export const lightTheme: Theme = {
  dark: false,
  colors: lightColors,
  spacing,
  typography,
};

export const darkTheme: Theme = {
  dark: true,
  colors: darkColors,
  spacing,
  typography,
};
