import React, { useState } from "react";
import { LayoutChangeEvent, View, Dimensions } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

export const CollapsableMoreInfoComponent = ({ children, expanded }: { children: React.ReactNode; expanded: boolean }) => {
  const [height, setHeight] = useState(0);
  const animatedHeight = useSharedValue(0);
  const { height: windowHeight } = Dimensions.get('window');
  const config = {
    duration: 500,
    easing: Easing.bezier(0.35, 1, 0.25, 1)
  };

  const onLayout = (event: LayoutChangeEvent) => {
    const percentOfScreenHeight = windowHeight - 215;
    const elementHeight = event.nativeEvent.layout.height;
    const onLayoutHeight = elementHeight > percentOfScreenHeight ? percentOfScreenHeight : elementHeight;

    if (onLayoutHeight > 0 && height !== onLayoutHeight) {
      setHeight(onLayoutHeight);
    }
  };

  const collapsableStyle = useAnimatedStyle(() => {
    animatedHeight.value = expanded ? withTiming(height, config) : withTiming(0, config);

    return {
      height: animatedHeight.value
    };
  }, [expanded]);

  return (
    <Animated.View style={[collapsableStyle, { overflow: "scroll", marginTop: 10 }]}>
      <View style={{ position: "absolute" }} onLayout={onLayout}>
        {children}
      </View>
    </Animated.View>
  );
};