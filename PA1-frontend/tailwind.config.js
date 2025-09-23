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

            // brand
            brandPrimary: '#D6001C', // vivid red
            brandSecondary: '#FFCC01', // vivid yellow
            brandAccent: '#1E1E1E', // very dark gray, almost black

            // errors and alerts
            errorAlert: '#B71C1C', // strong red
            successAlert: '#E0A800', // strong yellow
            infoAlert: '#3A86FF', // strong blue
        },
    },
  },
  plugins: [],
}