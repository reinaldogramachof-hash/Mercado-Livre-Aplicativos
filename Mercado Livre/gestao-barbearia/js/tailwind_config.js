tailwind.config = {
    theme: {
        extend: {
            colors: {
                brand: {
                    blue: '#2563EB',      // Primary Blue
                    dark: '#0F172A',      // Slate 900
                    black: '#020617',     // Slate 950
                    orange: '#F59E0B',    // Amber 500
                    gray: '#64748B',      // Slate 500
                    lightblue: '#60A5FA', // Blue 400
                    surface: '#FFFFFF'
                },
                barber: {
                    light: '#F8FAFC',     // Slate 50
                    soft: '#E2E8F0'       // Slate 200
                }
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            }
        }
    }
}
