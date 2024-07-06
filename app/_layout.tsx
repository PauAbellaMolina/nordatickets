import { useEffect, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SupabaseProvider, useSupabase } from '../context/SupabaseProvider';
import WebSplashScreen from '../components/WebSplashScreen';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState<boolean>(false);
  const [loaded, error] = useFonts({
    ...FontAwesome.font
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      setTimeout(() => {  
        SplashScreen.hideAsync();
        setAppIsReady(true);
      }, 500);
    }
  }, [loaded]);

  if (!appIsReady) {
    if(Platform.OS === 'web') {
      return <WebSplashScreen />;
    }
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const { i18n } = useSupabase();
  const colorScheme = useColorScheme();

  return (
    <SupabaseProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/welcome" options={{ title: 'ElTeuTikt', headerShown: false }} />
          <Stack.Screen name="(auth)/login" options={{ title: i18n?.t('logIn'), headerShown: false }} />
          <Stack.Screen name="(auth)/signup" options={{ title: i18n?.t('accountCreation'), headerShown: false }} />
          <Stack.Screen name="(auth)/terms" options={{ title: i18n?.t('termsAndPrivacy'), headerShown: false }} />
          <Stack.Screen name="(screens)/event/[id]" options={{ title: i18n?.t('event'), headerShown: false }} />
          <Stack.Screen name="(screens)/event/paymentModal/index" options={{ contentStyle: { backgroundColor: 'transparent' }, presentation: 'modal', title: i18n?.t('payment'), headerShown: false }} />
          <Stack.Screen name="(screens)/wallet/activateTicket/[id]" options={{ contentStyle: { backgroundColor: 'transparent' }, presentation: 'modal', title: i18n?.t('activateTicket'), headerShown: false }} />
          <Stack.Screen name="(screens)/profile/receipts/index" options={{ title: i18n?.t('purchaseReceipts'), headerShown: false }} />
          <Stack.Screen name="(screens)/profile/receipts/[id]" options={{ title: i18n?.t('purchaseReceiptsDetails'), headerShown: false }} />
          <Stack.Screen name="(screens)/profile/help/index" options={{ title: i18n?.t('helpAndFaqs'), headerShown: false }} />
          <Stack.Screen name="(screens)/profile/birthdate/index" options={{ title: i18n?.t('birthdateConfig'), headerShown: false }} />
          <Stack.Screen name="(screens)/profile/terms/index" options={{ title: i18n?.t('termsAndPrivacy'), headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </SupabaseProvider>
  );
}
