import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Stack, Tabs } from 'expo-router';
import { Pressable, useColorScheme } from 'react-native';

import { WalletProvider } from '../../../context/WalletProvider';
import { AuthProvider } from '../../../context/AuthProvider';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';

export default function WalletLayout() {
  // const colorScheme = useColorScheme();

  return (
    // <AuthProvider>
      // <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <WalletProvider>
          <Stack>
            <Stack.Screen name="addFunds" options={{ headerShown: false }} />
          </Stack>
        </WalletProvider>
      // </ThemeProvider>
    // </AuthProvider>
  );
}
