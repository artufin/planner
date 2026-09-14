import type { Metadata } from "next";
import { Manrope } from 'next/font/google';
// The design system first, then app-level overrides.
import '@planner/ui/styles.css';
import "./globals.css";

import Providers from '@/components/Providers'

const manrope = Manrope({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: "Planner :)",
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" className={manrope.variable}>
            <body>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    )
}
