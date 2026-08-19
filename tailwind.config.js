/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0C0E11',
        painel: '#15181D',
        painel2: '#1C2027',
        linha: '#2A2F37',
        laranja: '#FF6B00',
        texto: '#E9ECEF',
        apagado: '#8E97A2',
        verde: '#10B981',
        amarelo: '#F59E0B',
        vermelho: '#EF4444',
      },
      borderRadius: {
        DEFAULT: '10px',
        lg: '12px',
        xl: '14px',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
      minHeight: {
        toque: '48px',
      },
      minWidth: {
        toque: '48px',
      },
    },
  },
  plugins: [],
}
