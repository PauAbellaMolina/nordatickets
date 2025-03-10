import React, { useEffect, useRef } from "react";
import { LayoutChangeEvent, View, Dimensions, ScrollView } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

export const CollapsableComponent = ({ children, expanded, maxHeight }: { children: React.ReactNode; expanded: boolean; maxHeight?: number }) => {
  const animatedHeight = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const isFirstRender = useRef(true);
  const { height: windowHeight } = Dimensions.get('window');
  
  const config = {
    duration: isFirstRender.current ? 0 : 500,
    easing: Easing.bezier(0.35, 1, 0.25, 1)
  };

  const getMaxHeight = () => maxHeight ? maxHeight : windowHeight - 100;

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
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
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
          <ScrollView>
            {children}
          </ScrollView>
        </View>
      </ScrollView>
    </Animated.View>
  );
};