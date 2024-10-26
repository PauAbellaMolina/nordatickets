import { Tabs } from 'expo-router';
import { useSupabase } from '../../context/SupabaseProvider';
import TabBarComponent from '../../components/TabBarComponent';

export default function TabLayout() {
  const { theme } = useSupabase();

  return (
    <Tabs tabBar={(props) => <TabBarComponent {...props} />} >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          headerShown: false
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false
        }}
      />
    </Tabs>
  );
}
