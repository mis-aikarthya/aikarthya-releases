import type { Theme } from '@/model/types';

export const defaultTheme: Theme = {
  colors: {
    // Primary scale (SkillUp teal family)
    primary: '#006783', onPrimary: '#FFFFFF', primaryContainer: '#CBF0FA',
    onPrimaryContainer: '#004E63', primaryFixed: '#BCE9FF',
    onPrimaryFixed: '#001F29', onPrimaryFixedVariant: '#004D63',
    primaryFixedDim: '#62D4FF', inversePrimary: '#62D4FF',

    // Secondary scale (soft blue)
    secondary: '#525E7D', onSecondary: '#FFFFFF',
    secondaryContainer: '#CDD9FE', onSecondaryContainer: '#525F7E',
    secondaryFixed: '#D9E2FF', onSecondaryFixed: '#0D1B36',
    secondaryFixedDim: '#B9C6EA', onSecondaryFixedVariant: '#3A4664',

    // Tertiary scale (gold / warm accent)
    tertiary: '#855300', onTertiary: '#FFFFFF',
    tertiaryContainer: '#D28600', onTertiaryContainer: '#452900',
    tertiaryFixed: '#FFDDB8', onTertiaryFixed: '#2A1700',
    tertiaryFixedDim: '#FFB960', onTertiaryFixedVariant: '#653E00',

    // Surface scale (warm cream family)
    background: '#FAFAF1', onBackground: '#1A1C17',
    surface: '#FAFAF1', onSurface: '#1A1C17',
    surfaceVariant: '#E3E3DA', onSurfaceVariant: '#3D484E',
    surfaceTint: '#006783', inverseSurface: '#2F312B', inverseOnSurface: '#F1F1E8',

    // Surface containers
    surfaceBright: '#FAFAF1', surfaceDim: '#DADBD2',
    surfaceContainerLowest: '#FFFFFF', surfaceContainerLow: '#F4F4EB',
    surfaceContainer: '#EEEEED', surfaceContainerHigh: '#E9E9E0',
    surfaceContainerHighest: '#E3E3DA', neutralSurface: '#F4F4EB',

    // Utility
    outline: '#C8C8C0', outlineVariant: '#BDC8CF',
    shadow: '#000000', scrim: '#000000',

    // Status
    error: '#D94F3D', onError: '#FFFFFF',
    errorContainer: '#FFDAD6', onErrorContainer: '#93000A',
    success: '#2E8B57', warning: '#F5842A', neutralGrey: '#6B6B60',

    // Pastel dashboard colors (attendance / reports)
    pastelGreenBg: '#E8F8F5', pastelGreenText: '#1E8449', pastelGreenBorder: '#A3E4D7',
    pastelYellowBg: '#FEF9E7', pastelYellowText: '#B7950B', pastelYellowBorder: '#F9E79F',
    pastelPurpleBg: '#F5EEF8', pastelPurpleText: '#8E44AD', pastelPurpleBorder: '#D2B4DE',
    pastelOrangeBg: '#FDEDEC', pastelOrangeText: '#D35400', pastelOrangeBorder: '#F5B041',
    pastelRedBg: '#FDEDEC', pastelRedText: '#E74C3C', pastelRedBorder: '#FADBD8',
    pastelBlueBg: '#EBF5FB', pastelBlueText: '#2980B9', pastelBlueBorder: '#AED6F1',

    // Holiday grey (attendance calendar)
    holidayGreyBg: '#E4E4E0', holidayGreyText: '#5A5A52', holidayGreyBorder: '#BDBDB4',

    // Legacy brand aliases
    textPrimary: '#1A1C17', accentBlue: '#4F79C3',
  },
  typography: {
    display: { fontFamily: 'Poppins', fontSize: 32, fontWeight: 800, height: 1.1875 },
    headlineLarge: { fontFamily: 'Poppins', fontSize: 24, fontWeight: 700, height: 1.25 },
    headlineMedium: { fontFamily: 'Poppins', fontSize: 18, fontWeight: 700, height: 1.333 },
    headlineSmall: { fontFamily: 'Poppins', fontSize: 15, fontWeight: 700, height: 1.333 },
    bodyLarge: { fontFamily: 'Poppins', fontSize: 15, fontWeight: 400, height: 1.5 },
    bodyMedium: { fontFamily: 'Poppins', fontSize: 13, fontWeight: 400, height: 1.5 },
    bodySmall: { fontFamily: 'Poppins', fontSize: 12, fontWeight: 400, height: 1.5 },
    labelStrong: { fontFamily: 'Montserrat', fontSize: 12, fontWeight: 700, height: 1.4 },
    labelCaps: { fontFamily: 'Montserrat', fontSize: 11, fontWeight: 700, height: 1.4, letterSpacing: 0.66 },
    tileNumber: { fontFamily: 'Poppins', fontSize: 28, fontWeight: 800, height: 1.1 },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 4, md: 8, lg: 12, pill: 9999 },
  shadow: {
    low: '0 1px 2px rgba(0,0,0,0.08)',
    medium: '0 4px 8px rgba(0,0,0,0.12)',
    high: '0 12px 24px rgba(0,0,0,0.16)',
  },
  breakpoints: { mobile: 600, tablet: 1024, desktop: 1440, wide: 1920 },
};
