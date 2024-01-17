import { useEffect } from 'react';
import { Pressable, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { AuthProvider } from "../context/AuthProvider";
import { WalletProvider } from '../context/WalletProvider';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)', //PAU info this makes everything work, if this is not (wallet), navigation fails
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
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <WalletProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/welcome" options={{ title: 'ElsTeusTickets', headerShown: false }} />
            <Stack.Screen name="(auth)/login" options={{ title: 'Log In', headerShown: false }} />
            <Stack.Screen name="(auth)/signup" options={{ title: 'Sign Up', headerShown: false }} />
            <Stack.Screen name="(screens)/loadingApp" options={{ headerShown: false }} />
            <Stack.Screen name="(screens)/event/[id]" options={{ title: 'Event details', headerShown: false }} />
            <Stack.Screen name="(screens)/event/paymentModal/[...paymentParams]" options={{ contentStyle: { backgroundColor: 'transparent' }, presentation: 'modal', title: 'Pay', headerShown: false }} />
            <Stack.Screen name="(screens)/wallet/activateTicket/[...activateTicketParams]" options={{ contentStyle: { backgroundColor: 'transparent' }, presentation: 'modal', title: 'Activate ticket', headerShown: false }} />
          </Stack>
        </WalletProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
