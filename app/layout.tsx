import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import Header, { FuriganaProvider } from '@/components/Header';
import { SettingsProvider, SettingsModal } from '@/components/SettingsProvider';
import { LevelProvider } from '@/components/LevelProvider';

export const metadata: Metadata = {
  title: '日本語マスター - Japanese Learning App',
  description: 'App trắc nghiệm tiếng Nhật JLPT N1-N5 với giải thích chi tiết',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <SettingsProvider>
          <AuthProvider>
            <LevelProvider>
              <FuriganaProvider>
                <Header />
                <SettingsModal />
                <main className="min-h-[calc(100vh-64px)] app-scale-wrapper">
                  {children}
                </main>
              </FuriganaProvider>
            </LevelProvider>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
