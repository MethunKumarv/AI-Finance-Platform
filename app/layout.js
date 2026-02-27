import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/ui/header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from 'sonner';

const geist = Geist({subsets: ["latin"]});
export const metadata = {
  title: "AI Finance Platform",
  description: "One stop finance platform",
};

export default function RootLayout({ children }) {
  return ( 
    <ClerkProvider>
    <html lang="en">
      <body
        className={`${geist.className}`}>
          {/*header*/}
          <Header/>
          <main>
            {children}
          </main>
          <Toaster richColors/>
          {/*footer*/}
      </body>
    </html>
    </ClerkProvider>
  );
}
