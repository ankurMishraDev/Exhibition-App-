/**
 * Exhibition App - Clean Green Theme
 * Easy to customize - just change the AppTheme colors below
 * 
 * Design inspired by modern vendor/booking apps
 */

import { Platform } from 'react-native';

// ============================================================================
// 🎨 APP THEME - CHANGE THESE TO CUSTOMIZE YOUR ENTIRE APP
// ============================================================================
export const AppTheme = {
  // Primary Color - Main buttons, active states, highlights
  primary: '#22C55E',        // Green
  primaryDark: '#16A34A',    // Darker green for pressed states
  primaryLight: '#86EFAC',   // Light green for backgrounds
  primarySoft: '#DCFCE7',    // Very light green for cards/surfaces
  
  // Secondary Color - Accents, secondary buttons
  secondary: '#059669',      // Teal-green
  secondaryDark: '#047857',
  secondaryLight: '#6EE7B7',
  
  // Accent Color - Special highlights, badges
  accent: '#10B981',         // Emerald
  accentDark: '#059669',
  accentLight: '#A7F3D0',
  
  // Deep Teal - Hero sections, headers, gradients
  deepTeal: '#0D4F4F',
  deepTealLight: '#0E6B6B',
  deepTealDark: '#083B3B',
  deepTealSoft: '#E0F2F2',
};

// ============================================================================
// FULL COLOR PALETTE (derived from AppTheme)
// ============================================================================
export const BrandColors = {
  // Primary Green Palette
  primary: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: AppTheme.primary,     // #22C55E
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  
  // Secondary Teal-Green Palette
  secondary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: AppTheme.secondary,   // #059669
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
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
  
  // Status Colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Legacy colors for backward compatibility
  purple: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  orange: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#059669',
    600: '#047857',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
};

// Stall Status Colors
export const StallColors = {
  available: BrandColors.primary[500],  // Green - Available
  reserved: BrandColors.warning,         // Orange - Reserved
  booked: BrandColors.secondary[600],    // Teal - Booked
  disabled: BrandColors.gray[300],       // Gray - Disabled
};

// Keep backward compatibility
export const SeatColors = StallColors;

// ============================================================================
// LIGHT & DARK MODE THEMES
// ============================================================================
export const Colors = {
  light: {
    // Backgrounds
    text: BrandColors.gray[900],
    textSecondary: BrandColors.gray[500],
    background: '#FFFFFF',
    surface: BrandColors.gray[50],
    surfaceElevated: '#FFFFFF',
    
    // Brand
    tint: AppTheme.primary,
    primary: AppTheme.primary,
    primaryDark: AppTheme.primaryDark,
    primaryLight: AppTheme.primaryLight,
    primarySoft: AppTheme.primarySoft,
    secondary: AppTheme.secondary,
    accent: AppTheme.accent,
    
    // UI Elements
    icon: BrandColors.gray[600],
    iconMuted: BrandColors.gray[400],
    border: BrandColors.gray[200],
    borderLight: BrandColors.gray[100],
    divider: BrandColors.gray[200],
    
    // Tab Bar
    tabIconDefault: BrandColors.gray[400],
    tabIconSelected: AppTheme.primary,
    tabBackground: '#FFFFFF',
    
    // Status
    success: BrandColors.success,
    warning: BrandColors.warning,
    error: BrandColors.error,
    info: BrandColors.info,
    
    // Cards
    cardBackground: '#FFFFFF',
    cardBorder: BrandColors.gray[100],
    
    // Input
    inputBackground: BrandColors.gray[50],
    inputBorder: BrandColors.gray[300],
    inputFocus: AppTheme.primary,
    placeholder: BrandColors.gray[400],
  },
  dark: {
    // Backgrounds
    text: BrandColors.gray[100],
    textSecondary: BrandColors.gray[400],
    background: '#0F0F0F',
    surface: BrandColors.gray[900],
    surfaceElevated: BrandColors.gray[800],
    
    // Brand
    tint: AppTheme.primaryLight,
    primary: AppTheme.primary,
    primaryDark: AppTheme.primaryDark,
    primaryLight: AppTheme.primaryLight,
    primarySoft: '#1A3D2E',
    secondary: AppTheme.secondaryLight,
    accent: AppTheme.accentLight,
    
    // UI Elements
    icon: BrandColors.gray[400],
    iconMuted: BrandColors.gray[500],
    border: BrandColors.gray[700],
    borderLight: BrandColors.gray[800],
    divider: BrandColors.gray[700],
    
    // Tab Bar
    tabIconDefault: BrandColors.gray[500],
    tabIconSelected: AppTheme.primaryLight,
    tabBackground: '#0F0F0F',
    
    // Status
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',
    
    // Cards
    cardBackground: BrandColors.gray[900],
    cardBorder: BrandColors.gray[700],
    
    // Input
    inputBackground: BrandColors.gray[800],
    inputBorder: BrandColors.gray[600],
    inputFocus: AppTheme.primaryLight,
    placeholder: BrandColors.gray[500],
  },
};

// ============================================================================
// COMPONENT STYLES
// ============================================================================
export const ComponentStyles = {
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  input: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  avatar: {
    small: 40,
    medium: 64,
    large: 96,
  },
};

// ============================================================================
// SPACING
// ============================================================================
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ============================================================================
// FONTS
// ============================================================================
export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    semiBold: 'System',
    bold: 'System',
    mono: 'Menlo',
  },
  android: {
    sans: 'Roboto',
    semiBold: 'Roboto-Medium',
    bold: 'Roboto-Bold',
    mono: 'monospace',
  },
  default: {
    sans: 'System',
    semiBold: 'System',
    bold: 'System',
    mono: 'monospace',
  },
});
