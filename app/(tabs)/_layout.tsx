import { useColorScheme } from 'react-native';
import { Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '../../constants/Colors';

// TODO PAU info available icons here -> https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
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
        name="two"
        options={{
          headerShown: false,
          title: '',
          tabBarIcon: ({ color }) => <TabBarIcon name="ticket" color={color} />
        }}
      />
      <Tabs.Screen
        name="three"
        options={{
          headerShown: false,
          title: '',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />
        }}
      />
    </Tabs>
  );
}
