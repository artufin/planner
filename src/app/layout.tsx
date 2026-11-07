import type { Metadata } from "next";
import { Archivo } from 'next/font/google';
// UI primitives first, then app-level overrides.
import '@/components/ui/styles.css';
import "./globals.css";

import Providers from '@/components/Providers'

// Variable on both axes: the width axis (wdth 62–125) is what the display
// type uses to go condensed — see `.pl-display` in components/ui/styles.css.
const archivo = Archivo({
    subsets: ['latin', 'latin-ext'],
    axes: ['wdth'],
    variable: '--font-archivo',
});

export const metadata: Metadata = {
  title: "Planner",
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" className={archivo.variable}>
            <body>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    )
}
