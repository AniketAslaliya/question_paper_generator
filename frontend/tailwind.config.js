/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#000000',
                secondary: '#F1F3E0',
                cream: '#F1F3E0',
                dark: '#000000',
                accent: '#2D2D2D',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            borderWidth: {
                '3': '3px',
            },
        },
    },
    plugins: [],
}
