import { AuthProvider } from "@/lib/auth-context";
import { QueryProvider } from "@/lib/query-provider";
import "./globals.css";
import { Toaster } from "sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider><AuthProvider>{children}<Toaster /></AuthProvider></QueryProvider>
      </body>
    </html>
  );
}
