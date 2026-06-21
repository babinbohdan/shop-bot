import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ToyShop — Дитячі іграшки та товари",
  description:
    "Інтернет-магазин якісних дитячих іграшок. Широкий асортимент, швидка доставка Новою Поштою.",
  keywords: ["іграшки", "дитячі товари", "купити іграшки", "Нова Пошта"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={nunito.variable}>
      <body className="bg-[#fafbff] text-gray-800 antialiased min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
