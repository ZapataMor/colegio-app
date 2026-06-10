/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const BrandPalette = {
  primary: '#79D0F2',
  white: '#FFFFFF',
  green: '#8FBF26',
  yellow: '#F2E635',
  cream: '#F2EDA7',
  coral: '#F25C5C',
  ink: '#102033',
  midnight: '#07111F',
} as const;

export const Colors = {
  light: {
    text: '#102033',
    background: '#F7FBFD',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#DDF4FC',
    textSecondary: '#5F7182',
    border: '#BEE6F6',
    primary: BrandPalette.primary,
    primaryText: '#07111F',
    accent: BrandPalette.green,
    warning: BrandPalette.yellow,
    softAccent: BrandPalette.cream,
    danger: BrandPalette.coral,
    navBackground: '#EAF8FD',
    surfaceMuted: '#EFF8FC',
  },
  dark: {
    text: '#F4FBFF',
    background: '#02070C',
    backgroundElement: '#101827',
    backgroundSelected: '#123447',
    textSecondary: '#A8B6C5',
    border: '#24455A',
    primary: BrandPalette.primary,
    primaryText: '#07111F',
    accent: BrandPalette.green,
    warning: BrandPalette.yellow,
    softAccent: '#34351F',
    danger: BrandPalette.coral,
    navBackground: '#07111F',
    surfaceMuted: '#142233',
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
