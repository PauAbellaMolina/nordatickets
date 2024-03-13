import { Platform, View, StyleSheet, Pressable } from "react-native";
import { FeatherIcon } from "./CustomIcons";
import Colors from '../constants/Colors';
import { router } from "expo-router";

export default function GoBackArrow({ light }: { light?: boolean }) {
  return (<>
    { Platform.OS === 'web' ? 
      <View style={styles.goBackArrow}>
        <Pressable onPress={() => router.back()}>
          <FeatherIcon name="arrow-left" size={35} color={light ? Colors['dark'].text : Colors['light'].text} />
        </Pressable>
      </View>
    : <></>
    }
  </>);
}

const styles = StyleSheet.create({
  goBackArrow: {
    position: 'absolute',
    top: 15,
    left: 15
  },
});