import { Stack } from 'expo-router';
import { EventScreensProvider } from '../../../context/EventScreensProvider';
import { useSupabase } from '../../../context/SupabaseProvider';

export default function EventLayout() {
  const { i18n } = useSupabase();
  
  return (
    <EventScreensProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="[id]" options={{ title: i18n?.t('event') }} />
        <Stack.Screen 
          name="paymentModal/index"
          options={{ 
            contentStyle: { backgroundColor: 'transparent' },
            presentation: 'modal',
            title: i18n?.t('payment')
          }}
        />
        <Stack.Screen 
          name="authModal/index"
          options={{ 
            contentStyle: { backgroundColor: 'transparent' },
            presentation: 'modal',
            title: i18n?.t('welcome')
          }}
        />
      </Stack>
    </EventScreensProvider>
  );
}