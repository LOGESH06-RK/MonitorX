import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { LanguageProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth-context';
import { ProfileProvider } from '@/lib/profile-context';
import { AuthGate } from '@/components/AuthGate';

export default function RootLayout() {
  useFrameworkReady();

  // Permanently suppress the Expo DevTools FAB (thunder/lightning icon) on web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const STYLE_ID = 'hide-expo-dev-menu-permanent';
      if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
          /* Permanently hide Expo dev-tools floating action button and overlay */
          #expo-dev-menu-fab,
          [data-testid="DevMenuFAB"],
          [data-expo-dev-menu],
          [aria-label="Open Dev Menu"],
          [aria-label*="Dev Menu"],
          [aria-label*="dev menu" i],
          [class*="expo-dev-menu"],
          div[style*="position: fixed"][style*="bottom:"][style*="left:"] > button,
          div[style*="position: fixed"][style*="bottom:"][style*="left:"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            width: 0 !important;
            height: 0 !important;
          }
        `;
        document.head.appendChild(style);
      }

      // Mutation observer to clean up or hide any dev menu dynamically mounted by Expo
      const hideDevMenuElements = () => {
        const devElements = document.querySelectorAll(
          '#expo-dev-menu-fab, [data-testid="DevMenuFAB"], [data-expo-dev-menu], [aria-label*="Dev Menu" i]'
        );
        devElements.forEach(el => {
          (el as HTMLElement).style.setProperty('display', 'none', 'important');
        });
      };

      hideDevMenuElements();
      const observer = new MutationObserver(hideDevMenuElements);
      observer.observe(document.body, { childList: true, subtree: true });
      return () => observer.disconnect();
    }
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <ProfileProvider>
          <AuthGate>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </AuthGate>
        </ProfileProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
