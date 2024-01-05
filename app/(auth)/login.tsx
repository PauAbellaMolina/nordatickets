import { useEffect, useState } from "react";
import { StyleSheet, TextInput, useColorScheme, ActivityIndicator, Pressable, Platform, Alert } from "react-native";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { router } from "expo-router";
import { FIREBASE_AUTH } from '../../firebaseConfig';
import Colors from "../../constants/Colors";
import { View, Text} from "../../components/Themed";
import { FeatherIcon } from "../components/icons";

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
          setPasswordErrorMessage('Invalid email');
          break;
        case 'auth/invalid-login-credentials':
          setPasswordErrorMessage('Wrong email or password');
          break;
        default:
          setPasswordErrorMessage('Try again');
          break;
      }
    });
  }

  const onForgotPassword = async () => {
    if (Platform.OS === 'web') {
      if (!window.confirm("Correu de restabliment de la contrasenya: " + email + ". Enviar?")) {
        return;
      }
    } else {
      const AsyncAlert = async () => new Promise<boolean>((resolve) => {
        Alert.prompt(
          "Restablir contrasenya",
          "Correu de restabliment de la contrasenya: " + email + ". Enviar?",
          [
            {
              text: "No",
              onPress: () => {
                resolve(true);
              },
              style: "cancel"
            },
            {
              text: "Sí, desactivar",
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
      <Text style={styles.title}>ElsTeusTickets</Text>
      <Text style={styles.subtitle}>Iniciar sessió</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, {color: Colors[theme].text, borderColor: passwordErrorMessage === undefined ? 'transparent' : '#ff3737'}]}
          textContentType="emailAddress"
          autoComplete="email"
          keyboardType={'email-address'}
          placeholder="Correu electrònic"
          onChangeText={setEmail}
        />
        <TextInput
          style={[styles.inputPassword, {color: Colors[theme].text, borderColor: passwordErrorMessage === undefined ? 'transparent' : '#ff3737'}]}
          textContentType="password"
          secureTextEntry={true}
          autoComplete="password"
          keyboardType={'visible-password'}
          placeholder="Contrasenya"
          onChangeText={setPassword}
        />
        <Text style={{color: '#ff3737', height: 20}}>{passwordErrorMessage}</Text>
        <View style={{marginTop: 20, backgroundColor: 'transparent'}}>
          { loading ?
            <ActivityIndicator style={{marginTop: 12}} size="small" />
          :
            <Pressable
              disabled={!email.includes('@') || password.length === 0 || passwordErrorMessage !== undefined}
              onPress={onEmailLogIn}
              style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5}}
            >
              <Text style={{fontSize: 20, color: '#007aff', textAlign: 'center'}}>Entrar</Text>
              <FeatherIcon name="arrow-right" size={20} color={'#007aff'} />
            </Pressable>
          }
          { passwordErrorMessage === 'Wrong email or password' ?
          <View style={{marginTop: 40}}>
            <Text style={{textAlign: 'center'}}>Has oblidat la contrasenya?</Text>
            <Pressable onPress={onForgotPassword}><Text style={{color: '#007aff', textAlign: 'center', marginTop: 6}}>Restablir contrasenya</Text></Pressable>
          </View> 
        : null }
        </View>
      </View>
      <View style={{position: 'absolute', bottom: 0, backgroundColor: 'transparent'}}>
        <Text style={{textAlign: 'center'}}>No tens un compte?</Text>
        <Pressable onPress={onGoToSignUp}><Text style={{color: '#007aff', textAlign: 'center', marginTop: 6}}>Registra't</Text></Pressable>
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
    fontSize: 30,
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '500'
  },
  inputContainer: {
    backgroundColor: 'transparent',
    marginTop: 100,
    alignItems: 'center'
  },
  input: {
    pointerEvents: 'box-only',
    marginBottom: 15,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 30,
    textAlign: 'center',
    width: '100%',
    maxWidth: 400
  },
  inputPassword: {
    pointerEvents: 'box-only',
    marginBottom: 15,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 26,
    textAlign: 'center',
    width: '100%',
    maxWidth: 400
  }
});