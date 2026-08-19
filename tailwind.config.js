/**
 * A paleta mora em src/index.css como tripla RGB (ex.: `--primary: 255 107 0`).
 * Aqui ela é lida com `<alpha-value>` para que `bg-superficie/95` e
 * `border-primaria/50` continuem funcionando. Um lugar só define a cor.
 */
const cor = (nome) => `rgb(var(${nome}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: cor('--bg'),

        superficie: cor('--surface'),
        superficie2: cor('--surface-2'),
        superficie3: cor('--surface-3'),

        primaria: cor('--primary'),
        primariaClara: cor('--primary-light'),

        texto: cor('--text'),
        textoSec: cor('--text-secondary'),
        textoFraco: cor('--text-muted'),

        sucesso: cor('--success'),
        aviso: cor('--warning'),
        perigo: cor('--danger'),
        info: cor('--info'),

        // Borda translúcida: sobe com a superfície em vez de virar um risco
        // sólido. Não aceita modificador de opacidade, e nada usa.
        borda: 'var(--border)',

        // --- Nomes da Fase 1-3, mantidos para as telas ainda não redesenhadas.
        // Cada tela some daqui quando for reescrita na sua etapa.
        painel: cor('--surface'),
        painel2: cor('--surface-2'),
        linha: 'var(--border)',
        laranja: cor('--primary'),
        apagado: cor('--text-secondary'),
        verde: cor('--success'),
        amarelo: cor('--warning'),
        vermelho: cor('--danger'),
      },

      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },

      fontSize: {
        // Escala do produto. `painel` é o número gigante do odômetro.
        micro: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
        rotulo: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.1em' }],
        corpo: ['0.9375rem', { lineHeight: '1.45rem' }],
        titulo: ['1.375rem', { lineHeight: '1.6rem', letterSpacing: '-0.02em' }],
        display: ['2rem', { lineHeight: '2.1rem', letterSpacing: '-0.03em' }],
        painel: ['3.25rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
      },

      borderRadius: {
        DEFAULT: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
      },

      minHeight: { toque: '48px' },
      minWidth: { toque: '48px' },

      maxWidth: {
        conteudo: '30rem',
        painel: '78rem',
      },

      transitionTimingFunction: {
        saida: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },

      keyframes: {
        subir: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        entrar: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        surgir: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        pulsar: {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.7' },
        },
      },

      animation: {
        subir: 'subir 260ms cubic-bezier(0.16, 1, 0.3, 1)',
        entrar: 'entrar 260ms cubic-bezier(0.16, 1, 0.3, 1) both',
        surgir: 'surgir 200ms ease-out both',
        pulsar: 'pulsar 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
