import { useColorScheme } from 'react-native';
import { Tabs } from 'expo-router';
import Colors from '../../constants/Colors';
import TabBarIcon from '../../components/CustomIcons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tabIconActive,
        tabBarActiveBackgroundColor: Colors[colorScheme ?? 'light'].tabIconActiveBackground,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconInactive,
        tabBarStyle: {
          height: 65,
          borderRadius: 35,
          backgroundColor: Colors[colorScheme ?? 'light'].tabBarBackground,
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
