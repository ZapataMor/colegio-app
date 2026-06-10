/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const BrandPalette = {
  primary: '#0F766E',
  white: '#FFFFFF',
  green: '#3F8C6A',
  yellow: '#C9891A',
  cream: '#F6EBDD',
  coral: '#D95C45',
  ink: '#10212B',
  midnight: '#09141D',
} as const;

export const Colors = {
  light: {
    text: '#10212B',
    background: '#F5F1E8',
    backgroundElement: '#FFFCF6',
    backgroundSelected: '#E4F1EE',
    textSecondary: '#5D675F',
    border: '#D6D0C3',
    primary: BrandPalette.primary,
    primaryText: '#F6FBF9',
    accent: BrandPalette.green,
    warning: BrandPalette.yellow,
    softAccent: BrandPalette.cream,
    danger: BrandPalette.coral,
    navBackground: '#EFE7D9',
    surfaceMuted: '#F7F1E6',
  },
  dark: {
    text: '#F7F2E8',
    background: '#09141D',
    backgroundElement: '#10212B',
    backgroundSelected: '#173C39',
    textSecondary: '#B2B8AE',
    border: '#1E3942',
    primary: BrandPalette.primary,
    primaryText: '#F6FBF9',
    accent: BrandPalette.green,
    warning: BrandPalette.yellow,
    softAccent: '#2F2C25',
    danger: BrandPalette.coral,
    navBackground: '#0C1A22',
    surfaceMuted: '#132831',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 14,
  four: 22,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
