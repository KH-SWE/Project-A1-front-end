// Import colors from Tailwind config for use in components
import tailwindConfig from '../tailwind.config.js';

// Extract colors with type safety
const themeColors = tailwindConfig.theme?.extend?.colors || {};

export const colors = themeColors as {
  // main palette
  primary: string;
  secondary: string;
  accent: string;
  accentDark: string;
  // background
  backgroundLight: string;
  backgroundDark: string;
  // text
  textOnBgLight: string;
  textOnBgDark: string;
  textAccent: string;
  // brand
  brandPrimary: string;
  brandSecondary: string;
  brandAccent: string;
  // errors and alerts
  errorAlert: string;
  successAlert: string;
  infoAlert: string;
};