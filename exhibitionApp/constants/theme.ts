export const Colors = {
  // Brand — #9F1A71
  primary: '#9F1A71',
  primaryLight: '#B9328B',
  primaryDark: '#80135A',
  primarySurface: '#FBE8F4',
  black: '#000000',
  // Indian tricolor accent
  saffron: '#FF9933',
  saffronLight: '#FFE5C0',
  green: '#138808',
  greenLight: '#E6F5E6',

  // Neutral
  white: '#FFFFFF',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceVariant: '#F0F4F8',
  border: '#E5E7EB',
  divider: '#F3F4F6',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',
  placeholder: '#CBD5E1',

  // Stall status
  available: '#22C55E',
  availableLight: '#DCFCE7',
  reserved: '#EAB308',
  reservedLight: '#FEF9C3',
  booked: '#9CA3AF',
  bookedLight: '#F3F4F6',

  // Semantic
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  success: '#10B981',
  successLight: '#D1FAE5',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Booking status badge colors
  pending: '#F59E0B',
  pendingLight: '#FEF3C7',
  approved: '#10B981',
  approvedLight: '#D1FAE5',
  rejected: '#EF4444',
  rejectedLight: '#FEE2E2',
  cancelled: '#6B7280',
  cancelledLight: '#F9FAFB',
};

export const Typography = {
  // Font family loaded via expo-font (Plus Jakarta Sans from Stitch design)
  fontFamily: {
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semiBold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
  },
  // Font sizes
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
  },
  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const Radius = {
  sm: 6,
  md: 8,   // Stitch roundness: ROUND_EIGHT
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
};
