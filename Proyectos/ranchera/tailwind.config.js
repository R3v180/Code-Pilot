/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-brown': '#5C4033', // Un marrón tierra oscuro
        'brand-green': '#4A5D23', // Un verde olivo profundo
        'brand-cream': '#F5F5DC', // Un crema suave como fondo
      }
    },
  },
  plugins: [],
}