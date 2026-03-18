tailwind.config = {
    darkMode: 'media',
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#0D9488',
                    primary: '#0D9488',
                    light:   '#14B8A6',
                    dark:    '#0F766E',
                    darker:  '#115E59',
                    black:   '#0f172a',
                    red:     '#EF4444',
                    yellow:  '#F59E0B',
                    gray:    '#64748B'
                },
                sorveteria: {
                    light:  '#F0FDFA',
                    soft:   '#CCFBF1',
                    dark:   '#0B0F19',
                    card:   '#151B2C',
                    border: 'rgba(255, 255, 255, 0.08)'
                },
                success: '#0D9488',
                danger:  '#EF4444'
            },
            fontFamily: {
                sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(13, 148, 136, 0.10)',
                'card':  '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
            },
            animation: {
                'pulse-slow': 'pulse 3s infinite',
                'slide-in':   'slideIn 0.3s ease-out',
                'fade-in':    'fadeIn 0.5s ease-out',
                'slide-up':   'slideUp 0.3s ease-out'
            },
            keyframes: {
                slideUp: {
                    'from': { transform: 'translateY(20px)', opacity: '0' },
                    'to':   { transform: 'translateY(0)',    opacity: '1' }
                }
            }
        }
    }
}
