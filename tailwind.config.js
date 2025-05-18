/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-nodeColors-yellow',
    'bg-nodeColors-pink',
    'bg-nodeColors-green',
    'bg-nodeColors-blue',
    'bg-nodeColors-purple',
  ],
  theme: {
    extend: {
      fontFamily: {
        comic: ["'Patrick Hand'", "cursive"],
      },
      colors: {
        nodeColors: {
          yellow: '#FEF9C3', // bg-yellow-200
          pink: '#FBCFE8',   // bg-pink-200
          green: '#BBF7D0',  // bg-green-200
          blue: '#BFDBFE',   // bg-blue-200
          purple: '#DDD6FE', // bg-purple-200
        },
      },
    },
  },
  plugins: [],
}
