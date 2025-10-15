// file: src/app/layout.js
import './globals.css';
import { Inter, Poppins } from 'next/font/google';
import { AuthProvider } from './providers';
import ClientTransition from '@/components/ui/ClientTransition';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-poppins',
});

export const metadata = {
  title: 'InfoSalud',
  description: 'Seguimiento de Pacientes Crónicos',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} ${poppins.variable}`}>
      <body>
        {/* SessionProvider dentro de un componente cliente */}
        <AuthProvider>
          {/* Transición global */}
          <ClientTransition>
            {children}
          </ClientTransition>
        </AuthProvider>
      </body>
    </html>
  );
}
