/**
 * Exhibition App - Fintech/Crypto Style Color Palette
 * Purple, Orange, Green themed design system for modern booking interface
 */

import { Platform } from 'react-native';

// Core Brand Colors
export const BrandColors = {
  // Purple Palette - Primary Brand
  purple: {
    50: '#F8F4FF',
    100: '#EDE4FF', 
    200: '#D6C4FF',
    300: '#B794FF',
    400: '#9654FF',
    500: '#7C3AED', // Primary Purple
    600: '#6D28D9',
    700: '#5B21B6',
    800: '#4C1D95',
    900: '#3C1A78',
  },
  
  // Orange Palette - Secondary/Accent
  orange: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316', // Primary Orange
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },
  
  // Green Palette - Success/Available
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E', // Primary Green
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  
  // Neutral Grays
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
};

// Seat Status Colors
export const SeatColors = {
  available: BrandColors.green[500],    // Green - Available
  reserved: BrandColors.orange[500],    // Orange - Reserved/In-process  
  booked: BrandColors.purple[600],      // Purple - Booked
  disabled: BrandColors.gray[300],      // Gray - Disabled/Unavailable
};

// App Theme Colors
const tintColorLight = BrandColors.purple[500];
const tintColorDark = BrandColors.purple[300];

export const Colors = {
  light: {
    text: BrandColors.gray[900],
    background: '#FFFFFF',
    surface: BrandColors.gray[50],
    tint: tintColorLight,
    icon: BrandColors.gray[600],
    tabIconDefault: BrandColors.gray[400],
    tabIconSelected: tintColorLight,
    border: BrandColors.gray[200],
    primary: BrandColors.purple[500],
    secondary: BrandColors.orange[500],
    success: BrandColors.green[500],
    warning: BrandColors.orange[400],
    error: '#EF4444',
  },
  dark: {
    text: BrandColors.gray[100],
    background: '#0A0A0A',
    surface: BrandColors.gray[900],
    tint: tintColorDark,
    icon: BrandColors.gray[400],
    tabIconDefault: BrandColors.gray[500],
    tabIconSelected: tintColorDark,
    border: BrandColors.gray[700],
    primary: BrandColors.purple[400],
    secondary: BrandColors.orange[400],
    success: BrandColors.green[400],
    warning: BrandColors.orange[300],
    error: '#F87171',
  },
};

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
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
