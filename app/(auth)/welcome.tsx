import { StyleSheet, useColorScheme, Pressable } from "react-native";
import { router } from "expo-router";
import Colors from "../../constants/Colors";
import { View, Text} from "../../components/Themed";
import TiktDark from '../../assets/svgs/tiktdark.svg';
import TiktLight from '../../assets/svgs/tiktlight.svg';
import BlobsBackground from "../../components/BlobsBackground";

export default function Welcome() {
  const theme = useColorScheme() ?? 'light';

  const onGoToSignUp = () => {
    router.push('/signup');
  };
  const onGoToLogIn = () => {
    router.push('/login');
  };

  return (
    <BlobsBackground style={styles.container}>
      { theme === 'dark' ? <TiktDark width={175} height={175} /> : <TiktLight width={175} height={175} /> }
      <View style={styles.buttonsContainer}>
        <Pressable onPress={onGoToSignUp} style={[styles.button, {backgroundColor: Colors[theme].text}]}>
          <Text style={[styles.buttonText, {color: Colors[theme].oppositeThemeText}]}>Crear compte</Text>
        </Pressable>
        <Pressable onPress={onGoToLogIn} style={[styles.button, {borderWidth: 1, borderColor: Colors[theme].text}]}>
          <Text style={[styles.buttonText, {color: Colors[theme].text}]}>Iniciar sessió</Text>
        </Pressable>
      </View>
    </BlobsBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 50,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 100
  },
  buttonsContainer: {
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