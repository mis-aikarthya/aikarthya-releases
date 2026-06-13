import type { Theme } from '@/model/types';

export const defaultTheme: Theme = {
  colors: {
    primary: '#006783', onPrimary: '#FFFFFF', primaryContainer: '#CBF0FA',
    onPrimaryContainer: '#004E63', primaryFixedDim: '#62D4FF',
    secondary: '#525E7D', onSecondary: '#FFFFFF', onSecondaryFixed: '#0D1B36',
    background: '#FAFAF1', onBackground: '#1A1C17', surface: '#FAFAF1', onSurface: '#1A1C17',
    surfaceVariant: '#E3E3DA', onSurfaceVariant: '#3D484E',
    surfaceContainerLowest: '#FFFFFF', surfaceContainerLow: '#F4F4EB',
    surfaceContainerHigh: '#E9E9E0', neutralSurface: '#F4F4EB',
    outline: '#C8C8C0', error: '#D94F3D', onError: '#FFFFFF', errorContainer: '#FFDAD6',
    success: '#2E8B57', warning: '#F5842A', neutralGrey: '#6B6B60',
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
