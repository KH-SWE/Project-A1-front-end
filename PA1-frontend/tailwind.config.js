/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
        colors: {
            // main palette
            primary: '#D65365', // pastel red
            secondary: '#FFE374', // pastel yellow
            accent: '#1E1E1E', // very dark gray, almost black
            accentDark: '#FFFFFF', // white

            // background
            backgroundLight: '#FFFFFF', // white
            backgroundDark: '#333333', // very dark gray, almost black

            // text
            textOnBgLight: '#000000', // black
            textOnBgDark: '#FFFFFF', // white
            textAccent: '#7D7D7D', // medium gray

            // brand
            brandPrimary: '#D6001C', // vivid red
            brandSecondary: '#FFCC01', // vivid yellow
            brandAccent: '#1E1E1E', // very dark gray, almost black

            // errors and alerts
            errorAlert: '#B71C1C', // strong red
            successAlert: '#E0A800', // strong yellow
            infoAlert: '#3A86FF', // strong blue
        },
        fontSize: {
            // Mobile-optimized typography scale
            'xs': ['12px', { lineHeight: '16px' }],     // Small labels, captions
            'sm': ['14px', { lineHeight: '20px' }],     // Secondary text, small buttons
            'base': ['16px', { lineHeight: '24px' }],   // Body text, default
            'lg': ['18px', { lineHeight: '28px' }],     // Large body text
            'xl': ['20px', { lineHeight: '30px' }],     // Small headings
            '2xl': ['24px', { lineHeight: '32px' }],    // Medium headings
            '3xl': ['30px', { lineHeight: '36px' }],    // Large headings
            '4xl': ['36px', { lineHeight: '40px' }],    // Hero headings
            '5xl': ['48px', { lineHeight: '52px' }],    // Display text
            '6xl': ['60px', { lineHeight: '64px' }],    // Large display text
            
            // Custom semantic sizes
            'caption': ['14px', { lineHeight: '16px', letterSpacing: '0.4px' }],
            'button': ['16px', { lineHeight: '24px', fontWeight: '600' }],
            'heading': ['24px', { lineHeight: '32px', fontWeight: '700' }],
            'title': ['32px', { lineHeight: '36px', fontWeight: '800' }],
            'display': ['48px', { lineHeight: '52px', fontWeight: '900' }],
        },
        fontWeight: {
            'thin': '100',
            'extralight': '200',
            'light': '300',
            'normal': '400',
            'medium': '500',
            'semibold': '600',
            'bold': '700',
            'extrabold': '800',
            'black': '900',
        },
        letterSpacing: {
            'tighter': '-0.05em',
            'tight': '-0.025em',
            'normal': '0em',
            'wide': '0.025em',
            'wider': '0.05em',
            'widest': '0.1em',
        },
    },
  },
  plugins: [],
}