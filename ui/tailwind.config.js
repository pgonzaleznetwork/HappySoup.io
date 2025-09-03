/** @type {import('tailwindcss').Config} */
import PrimeUI from 'tailwindcss-primeui';

export default {
    darkMode: ['selector', '[class*="app-dark"]'],
    content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
    plugins: [PrimeUI],
    theme: {
        extend: {
            animation: {
                'infinite-scroll': 'infinite-scroll 25s linear infinite',
                float: 'float 3.5s ease-in-out infinite',
                wiggle: 'wiggle 3.5s ease-in-out infinite'
            },
            keyframes: {
                'infinite-scroll': {
                    from: { transform: 'translateX(0)' },
                    to: { transform: 'translateX(-100%)' }
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-6px) scale(1.005)' }
                },
                wiggle: {
                    '0%, 30%, 100%': {
                        transform: 'rotate(0deg)'
                    },
                    '10%, 20%': {
                        transform: 'rotate(-1deg)'
                    },
                    '15%, 25%': {
                        transform: 'rotate(1deg)'
                    }
                }
            }
        },
        screens: {
            sm: '576px',
            md: '768px',
            lg: '992px',
            xl: '1200px',
            '2xl': '1920px'
        }
    }
};
