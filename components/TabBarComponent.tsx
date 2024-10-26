import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSupabase } from '../context/SupabaseProvider';
import Colors from '../constants/Colors';
import TabBarButtonComponent from './TabBarButtonComponent';

export default function TabBarComponent({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useSupabase();

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].tabBarBackground }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabBarButtonComponent
            key={route.name}
            onPress={onPress}
            onLongPress={onLongPress}
            isFocused={isFocused}
            routeName={route.name}
            color={isFocused ? Colors[theme].tabIconActive : Colors[theme].tabIconInactive}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    userSelect: 'none',
    flexDirection: 'row',
    alignItems: 'center',
    height: 65,
    borderRadius: 35,
    borderWidth: 0,
    marginTop: 5,
    marginHorizontal: 15,
    marginBottom: 15,
    paddingBottom: 0
  }
});