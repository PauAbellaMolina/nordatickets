import React, { useEffect } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, interpolateColor, useSharedValue, withSpring, interpolate } from 'react-native-reanimated';
import { useSupabase } from '../context/SupabaseProvider';
import Colors from '../constants/Colors';
import TabBarIcon from './CustomIcons';

interface TabBarButtonProps {
  onPress: () => void;
  onLongPress: () => void;
  isFocused: boolean;
  routeName: string;
  color: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getIconName(routeName: string): string {
  switch (routeName) {
    case 'index':
      return 'home';
    case 'wallet':
      return 'ticket';
    case 'profile':
      return 'user';
    default:
      return 'question';
  }
}

export default function TabBarButtonComponent({ onPress, onLongPress, isFocused, routeName, color }: TabBarButtonProps) {
  const { theme } = useSupabase();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(
      isFocused ? 1 : .3,
      { duration: 200 }
    );
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(()=>{
    const scaleValue = interpolate(
      scale.value,
      [0, .9],
      [.9, 1]
    );
    const backgroundColor = interpolateColor(
      isFocused ? 1 : 0,
      [0, 1],
      ['transparent', Colors[theme].tabIconActiveBackground]
    );
    return { transform: [{scale: scaleValue}], backgroundColor };
  });

  const handlePress = () => {
    scale.value = withSpring(0.8, { damping: isFocused ? 0 : 15 }, () => {
      scale.value = withTiming(1, { duration: 200 });
    });
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onLongPress={onLongPress}
      style={[styles.button, animatedIconStyle]}
    >
      <TabBarIcon name={getIconName(routeName) as any} color={color} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    margin: 7,
    height: 54
  }
});
