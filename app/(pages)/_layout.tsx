import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Stack, Tabs } from 'expo-router';
import { Pressable, useColorScheme } from 'react-native';

import { WalletProvider } from '../../context/WalletProvider';
import { AuthProvider } from '../../context/AuthProvider';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';

export default function PagesLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(wallet)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
