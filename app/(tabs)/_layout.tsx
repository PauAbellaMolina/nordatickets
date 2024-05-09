import { Tabs } from 'expo-router';
import Colors from '../../constants/Colors';
import TabBarIcon from '../../components/CustomIcons';
import { useSupabase } from '../../context/SupabaseProvider';

export default function TabLayout() {
  const { theme } = useSupabase();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[theme].tabIconActive,
        tabBarActiveBackgroundColor: Colors[theme].tabIconActiveBackground,
        tabBarInactiveTintColor: Colors[theme].tabIconInactive,
        tabBarStyle: {
          height: 65,
          borderRadius: 35,
          backgroundColor: Colors[theme].tabBarBackground,
          marginHorizontal: 20,
          marginBottom: 25,
          paddingBottom: 0
        },
        tabBarLabelStyle: {
          display: 'none'
        },
        tabBarItemStyle: {
          borderRadius: 50,
          margin: 5
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: '',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          headerShown: false,
          title: '',
          tabBarIcon: ({ color }) => <TabBarIcon name="ticket" color={color} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          title: '',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />
        }}
      />
    </Tabs>
  );
}
