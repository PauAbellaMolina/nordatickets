import { StyleSheet, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { FeatherIcon } from './CustomIcons';
import Colors from '../constants/Colors';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSupabase } from '../context/SupabaseProvider';

type ImageFullscreenProps = {
  image: string;
  onClose: () => void;
};

export default function ImageFullscreen({ image, onClose }: ImageFullscreenProps) {
  const { theme } = useSupabase();
  const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

  return (
    <Animated.View 
      entering={FadeIn.duration(200)}
      style={[styles.overlay, { width: windowWidth, height: windowHeight }]}
    >
      <Image
        style={styles.image}
        source={image}
        contentFit="contain"
        transition={250}
        contentPosition="center"
      />
      <Pressable style={styles.closeButton} onPress={onClose}>
        <FeatherIcon name="x" size={30} color={Colors[theme].text} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 13
  },
  image: {
    width: '90%',
    height: '90%'
  }
}); 