/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores Oficiais da Polícia Científica de Alagoas (PCAL)
        pc: {
          // Azul Oficial / Marinha Institucional
          navy: '#274578',
          'navy-dark': '#122443',
          'navy-deep': '#0B1629',
          'navy-light': '#3E69B1',
          'navy-soft': '#668ED0',
          'navy-subtle': '#C9D7EE',
          'navy-bg': '#F4F7FC',

          // Dourado do Brasão Oficial
          gold: '#C5B641',
          'gold-light': '#EFDD51',
          'gold-medium': '#9D9032',
          'gold-dark': '#797025',
          'gold-deep': '#302B09',

          // Vermelho Oficial de Alerta / Brasão
          red: '#D12429',
          'red-light': '#FA9C93',
          'red-bg': '#FCD5D1',
          'red-dark': '#97171B',

          // Platina / Cinza Oficial
          platina: '#E7EAE8',
          'platina-light': '#F6F8F7',
          'platina-border': '#BEC4C0',
          'platina-muted': '#797C7A',
          'platina-dark': '#353736',
          'platina-black': '#161717',
        },
        // Mapeamento harmonizado de blue para a paleta oficial da Polícia Científica
        blue: {
          50: '#F4F7FC',
          100: '#C9D7EE',
          200: '#95B1DE',
          300: '#668ED0',
          400: '#3E69B1',
          500: '#274578', // Oficial Navy
          600: '#233E6C',
          700: '#1F3760',
          800: '#182C4F',
          900: '#122443', // Deep Navy
          950: '#0B1629',
        },
        judicial: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
