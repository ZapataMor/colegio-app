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
  ink: '#0A1626',
  midnight: '#07111F',
} as const;

export const Colors = {
  light: {
    text: '#0A1626',
    background: '#F7FCFF',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#DDF4FC',
    textSecondary: '#526173',
    border: '#CAE9F5',
    primary: BrandPalette.primary,
    primaryText: '#073047',
    accent: BrandPalette.green,
    warning: BrandPalette.yellow,
    softAccent: BrandPalette.cream,
    danger: BrandPalette.coral,
    navBackground: '#EAF8FD',
    surfaceMuted: '#F0FAFE',
  },
  dark: {
    text: '#FFFFFF',
    background: '#030B14',
    backgroundElement: '#0D1A2B',
    backgroundSelected: '#16314A',
    textSecondary: '#B8C9D6',
    border: '#1D3A52',
    primary: BrandPalette.primary,
    primaryText: '#03121C',
    accent: BrandPalette.green,
    warning: BrandPalette.yellow,
    softAccent: '#3B3A24',
    danger: BrandPalette.coral,
    navBackground: '#07111F',
    surfaceMuted: '#102235',
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
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
