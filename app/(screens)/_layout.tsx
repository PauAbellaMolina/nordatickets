import { Stack } from 'expo-router';
import { useSupabase } from '../../context/SupabaseProvider';

export default function ScreensLayout() {
  const { i18n } = useSupabase();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="event" options={{ headerShown: false }} />
      <Stack.Screen name="wallet/activateTicket/[id]" options={{ contentStyle: { backgroundColor: 'transparent' }, presentation: 'modal', title: i18n?.t('activateTicket') }} />
      <Stack.Screen name="profile/receipts/index" options={{ title: i18n?.t('purchaseReceipts') }} />
      <Stack.Screen name="profile/receipts/[id]" options={{ title: i18n?.t('purchaseReceiptsDetails') }} />
      <Stack.Screen name="profile/receipts/refund/[id]" options={{ title: i18n?.t('refundReceiptsDetails') }} />
      <Stack.Screen name="profile/help/index" options={{ title: i18n?.t('helpAndFaqs') }} />
      <Stack.Screen name="profile/birthdate/index" options={{ title: i18n?.t('birthdateConfig') }} />
      <Stack.Screen name="profile/terms/index" options={{ title: i18n?.t('termsAndPrivacy') }} />
    </Stack>
  );
}