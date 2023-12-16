import { useEffect, useState } from "react";
import { StyleSheet, TextInput, useColorScheme, ActivityIndicator, Pressable } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
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

  const onGoToSignUp = () => {
    router.push('/signup');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tickets MVP</Text>
      <Text style={styles.subtitle}>Log In</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, {color: Colors[theme].text, borderColor: passwordErrorMessage === undefined ? 'transparent' : '#ff3737'}]}
          textContentType="emailAddress"
          autoComplete="email"
          keyboardType={'email-address'}
          placeholder="Your email"
          onChangeText={setEmail}
        />
        <TextInput
          style={[styles.inputPassword, {color: Colors[theme].text, borderColor: passwordErrorMessage === undefined ? 'transparent' : '#ff3737'}]}
          textContentType="password"
          secureTextEntry={true}
          autoComplete="password"
          keyboardType={'visible-password'}
          placeholder="Your password"
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
              style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5}}
            >
              <Text style={{fontSize: 20, color: '#007aff', textAlign: 'center'}}>Log in</Text>
              <FeatherIcon name="arrow-right" size={20} color={'#007aff'} />
            </Pressable>
          }
        </View>
      </View>
      <View style={{position: 'absolute', bottom: 0, backgroundColor: 'transparent'}}>
        <Text>Don't have an account?</Text>
        <Pressable onPress={onGoToSignUp}><Text style={{color: '#007aff', textAlign: 'center', marginTop: 6}}>Sign up</Text></Pressable>
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