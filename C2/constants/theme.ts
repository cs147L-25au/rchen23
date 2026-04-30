import { Platform } from 'react-native';

export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  card: string;
  navBar: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Borders & dividers
  border: string;
  divider: string;

  // Primary accent (Netflix red)
  primary: string;
  primarySubtle: string; // tinted bg for highlights

  // Semantic states
  liked: string;
  bookmarked: string;
  watched: string;
  actionAccent: string; // links, reply, active comments

  // Score colours (list screen)
  scoreHigh: string;
  scoreMid: string;
  scoreLow: string;

  // Inputs
  inputBackground: string;
  inputBorder: string;
  placeholder: string;

  // Overlays / modals
  overlay: string;
  overlayLight: string;
  modalBackground: string;

  // Follow button pair
  followButton: string;
  followingButton: string;
  followingButtonText: string;

  // Misc surfaces
  avatarFallback: string;
  posterPlaceholder: string;
  closeButton: string;

  // Rating sentiment button backgrounds
  ratingLikedBg: string;
  ratingAlrightBg: string;
  ratingDislikedBg: string;

  // Selected option in modal pickers
  selectedOption: string;

  // Disabled state
  disabled: string;
  disabledText: string;
}

// ─── Dark theme (Netflix-style default) ───────────────────────────────────────
export const darkTheme: ThemeColors = {
  background: '#141414',
  surface: '#1C1C1C',
  card: '#222222',
  navBar: '#0F0F0F',

  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textMuted: '#737373',

  border: '#2D2D2D',
  divider: '#2D2D2D',

  primary: '#E50914',
  primarySubtle: '#2D1012',

  liked: '#E50914',
  bookmarked: '#E50914',
  watched: '#46D369',
  actionAccent: '#E50914',

  scoreHigh: '#46D369',
  scoreMid: '#F5A623',
  scoreLow: '#E50914',

  inputBackground: '#262626',
  inputBorder: '#3D3D3D',
  placeholder: '#737373',

  overlay: 'rgba(0,0,0,0.82)',
  overlayLight: 'rgba(0,0,0,0.55)',
  modalBackground: '#1C1C1C',

  followButton: '#E50914',
  followingButton: '#2D2D2D',
  followingButtonText: '#B3B3B3',

  avatarFallback: '#2D2D2D',
  posterPlaceholder: '#262626',
  closeButton: '#2D2D2D',

  ratingLikedBg: '#1A2E1A',
  ratingAlrightBg: '#2E2614',
  ratingDislikedBg: '#2D1012',

  selectedOption: '#E50914',
  disabled: '#3D3D3D',
  disabledText: '#737373',
};

// ─── Light theme ──────────────────────────────────────────────────────────────
export const lightTheme: ThemeColors = {
  background: '#F5F5F5',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  navBar: '#FFFFFF',

  textPrimary: '#141414',
  textSecondary: '#5C5C5C',
  textMuted: '#909090',

  border: '#E0E0E0',
  divider: '#E8E8E8',

  primary: '#C41E3A',
  primarySubtle: '#FFF0F0',

  liked: '#C41E3A',
  bookmarked: '#C41E3A',
  watched: '#2A6F2A',
  actionAccent: '#C41E3A',

  scoreHigh: '#2A6F2A',
  scoreMid: '#B08A00',
  scoreLow: '#B22222',

  inputBackground: '#F5F5F5',
  inputBorder: '#E0E0E0',
  placeholder: '#999999',

  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',
  modalBackground: '#FFFFFF',

  followButton: '#C41E3A',
  followingButton: '#F0F0F0',
  followingButtonText: '#555555',

  avatarFallback: '#E0E0E0',
  posterPlaceholder: '#F0F0F0',
  closeButton: '#F2F2F2',

  ratingLikedBg: '#E4F5E4',
  ratingAlrightBg: '#FFF6D7',
  ratingDislikedBg: '#FCE4E3',

  selectedOption: '#C41E3A',
  disabled: '#CCCCCC',
  disabledText: '#F2F2F2',
};

// ─── Legacy Colors export (used by existing hooks) ────────────────────────────
export const Colors = {
  light: {
    text: lightTheme.textPrimary,
    background: lightTheme.background,
    tint: lightTheme.primary,
    icon: lightTheme.textMuted,
    tabIconDefault: lightTheme.textMuted,
    tabIconSelected: lightTheme.primary,
  },
  dark: {
    text: darkTheme.textPrimary,
    background: darkTheme.background,
    tint: darkTheme.primary,
    icon: darkTheme.textMuted,
    tabIconDefault: darkTheme.textMuted,
    tabIconSelected: darkTheme.primary,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
