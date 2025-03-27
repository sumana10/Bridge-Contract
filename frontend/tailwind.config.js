/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      backgroundImage: {
        'custom-gradient':
          ` linear-gradient(to right, #dae2f8, #d6a4a4);`
      },
      colors: {
        'silver': '#dae2f8',  // You can name it anything you like
      },
    },
  },
  plugins: [],
};
