import type { Metadata } from "next";
import "./globals.css";
import FooterStatus from "@/components/FooterStatus";

export const metadata: Metadata = {
  title: "NCAA Rules Assistant — UC San Diego Athletics",
  description:
    "Ask NCAA Division I rules questions in plain English and get the exact bylaw cite and rule text. A research aid for Triton Athletics, not a compliance ruling.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-gray-3">
            <div className="mx-auto w-full max-w-prose px-4 py-5 flex items-baseline justify-between gap-4">
              <div>
                <h1 className="text-title font-semibold text-gray-12 leading-none">
                  NCAA Rules Assistant
                </h1>
                <p className="text-meta font-bold uppercase tracking-widest text-gray-7 mt-2">
                  Division I &middot; Research Aid [Beta]
                </p>
              </div>
              <span className="text-meta font-bold uppercase tracking-widest text-gray-8">
                UC San Diego
              </span>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto w-full max-w-prose px-4 py-10">{children}</div>
          </main>

          <FooterStatus />
        </div>
      </body>
    </html>
  );
}
