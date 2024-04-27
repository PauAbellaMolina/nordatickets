import React, { useState } from "react";
import { LayoutChangeEvent, View, Text, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export const CollapsableMoreInfoComponent = ({
  children,
  expanded,
}: {
  children: React.ReactNode;
  expanded: boolean;
}) => {
  const [height, setHeight] = useState(0);
  const animatedHeight = useSharedValue(0);
  const { height: windowHeight } = Dimensions.get('window');

  const onLayout = (event: LayoutChangeEvent) => {
    const percentOfScreenHeight = .77 * windowHeight;
    const elementHeight = event.nativeEvent.layout.height;
    const onLayoutHeight = elementHeight > percentOfScreenHeight ? percentOfScreenHeight : elementHeight;

    if (onLayoutHeight > 0 && height !== onLayoutHeight) {
      setHeight(onLayoutHeight);
    }
  };

  const collapsableStyle = useAnimatedStyle(() => {
    animatedHeight.value = expanded ? withTiming(height) : withTiming(0);

    return {
      height: animatedHeight.value,
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