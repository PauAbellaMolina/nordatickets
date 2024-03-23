import { useEffect } from 'react';
import { Pressable, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SupabaseProvider } from '../context/SupabaseProvider';

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
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <SupabaseProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/welcome" options={{ title: 'ElTeuTikt', headerShown: false }} />
          <Stack.Screen name="(auth)/login" options={{ title: 'Iniciar sessió', headerShown: false }} />
          <Stack.Screen name="(auth)/signup" options={{ title: 'Creació del compte', headerShown: false }} />
          <Stack.Screen name="(screens)/event/[id]" options={{ title: 'Esdeveniment', headerShown: false }} />
          <Stack.Screen name="(screens)/event/paymentModal/index" options={{ contentStyle: { backgroundColor: 'transparent' }, presentation: 'modal', title: 'Pagament', headerShown: false }} />
          <Stack.Screen name="(screens)/wallet/activateTicket/[id]" options={{ contentStyle: { backgroundColor: 'transparent' }, presentation: 'modal', title: 'Activar ticket', headerShown: false }} />
          <Stack.Screen name="(screens)/profile/receipts/index" options={{ title: 'Rebuts de compra', headerShown: false }} />
          <Stack.Screen name="(screens)/profile/receipts/[id]" options={{ title: 'Detalls del rebut de compra', headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </SupabaseProvider>
  );
}
