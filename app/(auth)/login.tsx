import { useEffect, useRef, useState } from "react";
import { StyleSheet, TextInput, Button, useColorScheme, ActivityIndicator } from "react-native";
import { UserCredential, signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { router } from "expo-router";
import { FIREBASE_CONFIG, FIREBASE_AUTH } from '../../firebaseConfig';
import Colors from "../../constants/Colors";
import { View, Text} from "../../components/Themed";

export default function Login() {
  const theme = useColorScheme() ?? 'light';

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const recaptchaRef = useRef<FirebaseRecaptchaVerifierModal>(null);

  useEffect(() => {
    if (passwordErrorMessage !== undefined) {
      setPasswordErrorMessage(undefined);
    }
  }, [email, password]);

  const onEmailLogIn = () => {
    if (recaptchaRef.current) {
      setLoading(true);
      signInWithEmailAndPassword(FIREBASE_AUTH, email, password)
      .then((result: UserCredential) => {
        console.log('PAU LOG-> result: ', result);
      })
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
  }

  const onGoToSignUp = () => {
    router.push('/signup');
  };

  return (
    <>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaRef}
        firebaseConfig={FIREBASE_CONFIG}
        attemptInvisibleVerification={true}
      />
      <View style={styles.container}>
        <Text style={styles.title}>Log In</Text>
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
              <Button
                disabled={!email.includes('@') || password.length === 0 || passwordErrorMessage !== undefined}
                title='Log In'
                onPress={onEmailLogIn}
              />
            }
          </View>
        </View>
        <View style={{position: 'absolute', bottom: 0, backgroundColor: 'transparent'}}>
          <Text>Don't have an account?</Text>
          <Button
            title='Sign up'
            onPress={onGoToSignUp}
          />
        </View>
      </View>
    </>
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