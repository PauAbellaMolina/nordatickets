import { Tabs } from 'expo-router';
import TabBarComponent from '../../components/TabBarComponent';

export default function TabLayout() {

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
