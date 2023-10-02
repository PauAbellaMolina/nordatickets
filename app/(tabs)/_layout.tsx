import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable, useColorScheme } from 'react-native';

import Colors from '../../constants/Colors';
import { WalletProvider } from '../../context/WalletProvider';

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    // <WalletProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            headerShown: false,
            title: '',
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
            // headerRight: () => ( //THIS DISPLAYS THE OPEN MODAL BUTTON
            //   <Link href="/modal" asChild>
            //     <Pressable>
            //       {({ pressed }) => (
            //         <FontAwesome
            //           name="info-circle"
            //           size={25}
            //           color={Colors[colorScheme ?? 'light'].text}
            //           style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
            //         />
            //       )}
            //     </Pressable>
            //   </Link>
            // ),
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
    // </WalletProvider>
  );
}
