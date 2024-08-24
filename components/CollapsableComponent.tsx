import React, { useEffect, useState } from "react";
import { LayoutChangeEvent, View, Dimensions, ScrollView } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

export const CollapsableComponent = ({ children, expanded, maxHeight }: { children: React.ReactNode; expanded: boolean; maxHeight?: number }) => {
  const animatedHeight = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const { height: windowHeight } = Dimensions.get('window');
  
  const config = {
    duration: 500,
    easing: Easing.bezier(0.35, 1, 0.25, 1)
  };

  const getMaxHeight = () => maxHeight ? maxHeight : windowHeight - 215;

  const updateHeight = (newHeight: number) => {
    const maxAllowedHeight = getMaxHeight();
    contentHeight.value = newHeight;
    if (expanded) {
      animatedHeight.value = withTiming(Math.min(newHeight, maxAllowedHeight), config);
    }
  };

  const onLayout = (event: LayoutChangeEvent) => {
    const newHeight = event.nativeEvent.layout.height;
    runOnJS(updateHeight)(newHeight);
  };

  useEffect(() => {
    if (expanded) {
      animatedHeight.value = withTiming(Math.min(contentHeight.value, getMaxHeight()), config);
    } else {
      animatedHeight.value = withTiming(0, config);
    }
  }, [expanded]);

  const collapsableStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    overflow: "hidden"
  }));

  return (
    <Animated.View style={collapsableStyle}>
      <ScrollView 
        scrollEnabled={expanded}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View onLayout={onLayout}>
          {children}
        </View>
      </ScrollView>
    </Animated.View>
  );
};