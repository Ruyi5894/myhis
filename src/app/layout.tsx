import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { VERSION, APP_INFO } from "@/config/version";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${APP_INFO.name}`,
  description: APP_INFO.subtitle,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {children}
        {/* 版本信息浮窗 */}
        <div className="fixed bottom-4 right-4 bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg opacity-60 hover:opacity-100 transition-opacity z-50">
          <div className="font-bold">{VERSION.current} - {VERSION.name}</div>
          <div className="text-slate-400">{VERSION.buildDate}</div>
        </div>
      </body>
    </html>
  );
}
