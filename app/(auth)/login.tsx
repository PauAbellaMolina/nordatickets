import { useEffect, useState } from "react";
import { StyleSheet, TextInput, useColorScheme, ActivityIndicator, Pressable, Platform, Alert } from "react-native";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { router } from "expo-router";
import { FIREBASE_AUTH } from '../../firebaseConfig';
import Colors from "../../constants/Colors";
import { View, Text} from "../../components/Themed";

export default function Login() {
  const theme = useColorScheme() ?? 'light';

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (passwordErrorMessage !== undefined) {
      setPasswordErrorMessage(undefined);
    }
  }, [email, password]);

  const onEmailLogIn = () => {
    setLoading(true);
    signInWithEmailAndPassword(FIREBASE_AUTH, email, password)
    // .then((result: UserCredential) => {
    //   console.log('PAU LOG-> result: ', result);
    // })
    .catch((err) => {
      console.log('PAU LOG-> err login in: ', err);
      // alert(err);
      setLoading(false);
      switch (err.code) {
        case 'auth/invalid-email':
          setPasswordErrorMessage('Correu electrònic invàlid');
          break;
        case 'auth/invalid-login-credentials':
          setPasswordErrorMessage('Correu o contrasenya incorrectes');
          break;
        default:
          setPasswordErrorMessage('Torna-ho a intentar');
          break;
      }
    });
  }

  const onForgotPassword = async () => {
    if (Platform.OS === 'web') {
      if (!window.confirm("Correu de restabliment de la contrasenya: " + email + " \nEnviar correu?")) {
        return;
      }
    } else {
      const AsyncAlert = async () => new Promise<boolean>((resolve) => {
        Alert.prompt(
          "Restablir contrasenya",
          "Correu de restabliment de la contrasenya: " + email + " Enviar correu?",
          [
            {
              text: "No",
              onPress: () => {
                resolve(true);
              },
              style: "cancel"
            },
            {
              text: "Sí, enviar",
              onPress: () => {
                resolve(false);
              }
            }
          ],
          "default"
        );
      });
      if (await AsyncAlert()) {
        return;
      };
    }

    sendPasswordResetEmail(FIREBASE_AUTH, email)
    .then(() => {
      alert('Correu enviat, segueix les instruccions per restablir la contrasenya.');
    })
    .catch((err) => {
      alert(err);
    });
  }

  const onGoToSignUp = () => {
    router.push('/signup');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sessió</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, {color: Colors[theme].text, borderColor: passwordErrorMessage === undefined ? Colors[theme].text : '#ff3737'}]}
          textContentType="emailAddress"
          autoComplete="email"
          keyboardType={'email-address'}
          placeholder="Correu electrònic"
          onChangeText={setEmail}
        />
        <TextInput
          style={[styles.input, styles.inputPassword, {color: Colors[theme].text, borderColor: passwordErrorMessage === undefined ? Colors[theme].text : '#ff3737'}]}
          textContentType="password"
          secureTextEntry={true}
          autoComplete="password"
          keyboardType={'visible-password'}
          placeholder="Contrasenya"
          onChangeText={setPassword}
        />
        <Text style={styles.inputErrorMessage}>{passwordErrorMessage}</Text>
        <View style={{marginTop: 20, backgroundColor: 'transparent'}}>
          { loading ?
            <ActivityIndicator style={{marginTop: 12}} size="small" />
          : 
            <Pressable
              disabled={!email.includes('@') || password.length === 0 || passwordErrorMessage !== undefined}
              onPress={onEmailLogIn}
              style={[styles.button, {backgroundColor: Colors[theme].text, opacity: !email.includes('@') || password.length === 0 || passwordErrorMessage !== undefined ? 0.5 : 1}]}
            >
              <Text style={[styles.buttonText, {color: Colors[theme].oppositeThemeText}]}>Entrar</Text>
            </Pressable>
          }
          { passwordErrorMessage === 'Correu o contrasenya incorrectes' ?
            <View style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordTitle}>Has oblidat la contrasenya?</Text>
              <Pressable onPress={onForgotPassword}><Text style={styles.forgotPasswordLink}>Restablir contrasenya</Text></Pressable>
            </View> 
          : null }
        </View>
      </View>
      <View style={styles.bottomActionContainer}>
        <Text style={styles.bottomActionTitle}>No tens un compte?</Text>
        <Pressable onPress={onGoToSignUp}><Text style={styles.bottomActionLink}>Registra't</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '90%',
    backgroundColor: 'transparent',
    marginTop: 50,
    paddingTop: 30,
    paddingHorizontal: 15,
    alignItems: 'center',
    gap: 20
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold'
  },
  inputContainer: {
    backgroundColor: 'transparent',
    marginTop: 100,
    alignItems: 'center',
    paddingHorizontal: 25
  },
  input: {
    pointerEvents: 'box-only',
    marginBottom: 25,
    borderRadius: 15,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    fontSize: 20,
    textAlign: 'center',
    width: '100%',
    maxWidth: 300
  },
  inputPassword: {
    paddingVertical: 8,
    marginBottom: 18
  },
  inputErrorMessage: {
    color: '#ff3737',
    height: 20
  },
  forgotPasswordContainer: {
    marginTop: 40
  },
  forgotPasswordTitle: {
    fontSize: 16,
    textAlign: 'center'
  },
  forgotPasswordLink: {
    fontSize: 14,
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginTop: 6
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
  },
  bottomActionContainer: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'transparent'
  },
  bottomActionTitle: {
    fontSize: 16
  },
  bottomActionLink: {
    fontSize: 14,
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginTop: 6
  }
});