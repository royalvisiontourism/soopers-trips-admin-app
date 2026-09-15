import { Poppins } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const poppins = Poppins({
  variable: "--font-primary",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Soopers Trips - Admin",
  description: "Soopers Trips Tourism L.L.C Admin Panel",
  icons: {
    icon: [
      { url: '/img/general/logo.png', type: 'image/png' },
      { url: '/img/general/logo.png', sizes: 'any' },
    ],
    apple: [
      { url: '/img/general/logo.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/img/general/logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
