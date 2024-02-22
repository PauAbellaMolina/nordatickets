import { StyleSheet, useColorScheme, Pressable } from "react-native";
import { router } from "expo-router";
import Colors from "../../constants/Colors";
import { View, Text} from "../../components/Themed";
import TiktDark from '../../assets/svgs/tiktdark.svg';
import TiktLight from '../../assets/svgs/tiktlight.svg';
import BlueBlob from '../../assets/svgs/blobs/blue.svg';
import RedBlob from '../../assets/svgs/blobs/red.svg';
import OrangeBlob from '../../assets/svgs/blobs/orange.svg';
import YellowBlob from '../../assets/svgs/blobs/yellow.svg';

export default function Welcome() {
  const theme = useColorScheme() ?? 'light';

  const onGoToSignUp = () => {
    router.push('/signup');
  };
  const onGoToLogIn = () => {
    router.push('/login');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.blob, styles.orangeBlob]}><OrangeBlob width={185} height={185} /></View>
      <View style={[styles.blob, styles.blueBlob]}><BlueBlob width={230} height={230} /></View>
      <View style={[styles.blob, styles.yellowBlob]}><YellowBlob width={70} height={70} /></View>
      <View style={[styles.blob, styles.redBlob]}><RedBlob width={400} height={400} /></View>
      { theme === 'dark' ? <TiktDark width={175} height={175} /> : <TiktLight width={175} height={175} /> }
      <View style={styles.buttonsContainer}>
        <Pressable onPress={onGoToSignUp} style={[styles.button, {backgroundColor: Colors[theme].text}]}>
          <Text style={[styles.buttonText, {color: Colors[theme].oppositeThemeText}]}>Crear compte</Text>
        </Pressable>
        <Pressable onPress={onGoToLogIn} style={[styles.button, {borderWidth: 1, borderColor: Colors[theme].text}]}>
          <Text style={[styles.buttonText, {color: Colors[theme].text}]}>Iniciar sessió</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    height: '100%',
    backgroundColor: 'transparent',
    paddingBottom: 50,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 100
  },
  blob: {
    position: 'absolute',
    backgroundColor: 'transparent',
    zIndex: -1
  },
  orangeBlob: {
    top: -50,
    left: -50
  },
  blueBlob: {
    top: '20%',
    right: -140
  },
  yellowBlob: {
    bottom: '15%',
    right: 30
  },
  redBlob: {
    bottom: -220,
    left: -190
  },
  buttonsContainer: {
    backgroundColor: 'transparent',
    width: '100%',
    alignItems: 'center',
    gap: 25,
    paddingHorizontal: 25
  },
  button: {
    borderRadius: 15,
    paddingVertical: 11,
    paddingHorizontal: 25,
    width: '100%',
    maxWidth: 300
  },
  buttonText: {
    fontWeight: '500',
    fontSize: 18,
    textAlign: 'center'
  }
});