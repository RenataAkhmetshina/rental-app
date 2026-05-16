import { AuthProvider } from '../context/AuthContext';
import { WSProvider } from '../context/WSContext';
import Navbar from '../components/layout/Navbar';
import '../styles/globals.css';

export const metadata = {
  title: 'Rental System',
  description: 'Browse apartments, houses, and rooms for rent.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <WSProvider>
            <Navbar />
            <main className="main-content">{children}</main>
          </WSProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
