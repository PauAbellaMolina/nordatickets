import { useEffect } from 'react';
import { Pressable, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StripeProvider } from '@stripe/stripe-react-native';
import { AuthProvider } from "../context/AuthProvider";
import { WalletProvider } from '../context/WalletProvider';
import Colors from '../constants/Colors';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)', //TODO PAU info this makes everything work, if this is not (wallet), navigation fails
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
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
        <StripeProvider
          publishableKey="pk_test_51NwRmwEYo7DYpOLZtsO6zQN9tEaBXAtmXlXUflacKeBu5TgUgzTxtx4q06S6iNbx4SUGtvY2voPp3dnEBN6arB5i00m7Ntbs9M"
          // urlScheme="your-url-scheme" // required for 3D Secure and bank redirects
          // merchantIdentifier="merchant.com.{{YOUR_APP_NAME}}" // required for Apple Pay
        >
          <WalletProvider>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)/login" options={{ title: 'Log In', headerShown: false }} />
              <Stack.Screen name="(screens)/loadingApp" options={{ headerShown: false }} />
              <Stack.Screen name="(screens)/event/[id]" options={{ title: 'Event details', headerShown: false }} />
              <Stack.Screen name="(screens)/wallet/addFunds" options={{ title: 'Add funds', headerShown: false }} />
              <Stack.Screen name="(screens)/wallet/activateTicket/[...activateTicketParams]" options={{ contentStyle: { backgroundColor: 'transparent' }, presentation: 'modal', title: 'Activate ticket', headerShown: false }} />
              {/* , headerRight: () => <CancelButton onPress={() => router.back()} /> */}
            </Stack>
          </WalletProvider>
        </StripeProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

function CancelButton({ onPress }: { onPress: () => void }) {
  const theme = useColorScheme() ?? 'light';

  return (
    <Pressable onPress={onPress}>
      <FontAwesome name="times" size={22} color={Colors[theme].text} />
    </Pressable>
  );
}
