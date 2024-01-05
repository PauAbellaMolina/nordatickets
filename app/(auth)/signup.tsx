import { useEffect, useState } from "react";
import { StyleSheet, TextInput, useColorScheme, ActivityIndicator, Pressable } from "react-native";
import { UserCredential, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { router } from "expo-router";
import { FIREBASE_AUTH } from '../../firebaseConfig';
import Colors from "../../constants/Colors";
import { View, Text} from "../../components/Themed";
import { FeatherIcon } from "../components/icons";

export default function Signup() {
  const theme = useColorScheme() ?? 'light';

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordRepeated, setPasswordRepeated] = useState<string>('');
  const [emailErrorMessage, setEmailErrorMessage] = useState<string | undefined>(undefined);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (emailErrorMessage !== undefined) {
      setEmailErrorMessage(undefined);
    }
    if (password.length > 0 && password.length < 8) {
      setPasswordErrorMessage('Password must be at least 8 characters long');
    }
    else if (password.length > 0 && password !== passwordRepeated) {
      setPasswordErrorMessage('Passwords do not match');
    }
    else {
      setPasswordErrorMessage(undefined);
    }
  }, [password, passwordRepeated]);
  
  useEffect(() => {
    if (emailErrorMessage !== undefined) {
      setEmailErrorMessage(undefined);
    }
  }, [email]);

  const onEmailSignUp = () => {
    setLoading(true);
    createUserWithEmailAndPassword(FIREBASE_AUTH, email, password)
    .then((result: UserCredential) => {
      // console.log('PAU LOG-> result: ', result);
      const user = result.user;
      sendEmailVerification(user)
      .then(() => {
        console.log('PAU LOG-> Email sent');
      })
      .catch((err) => {
        console.log('PAU LOG-> err sending email: ', err);
        // alert(err);
      });
    })
    .catch((err) => {
      console.log('PAU LOG-> err creating user: ', err);
      // alert(err);
      setEmailErrorMessage('Invalid credentials, try again');
      setLoading(false);
    });
  }

  const onGoToLogIn = () => {
    router.push('/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ElsTeusTickets</Text>
      <Text style={styles.subtitle}>Creació del compte</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, {color: Colors[theme].text, borderColor: emailErrorMessage === undefined ? 'transparent' : '#ff3737'}]}
          textContentType="emailAddress"
          autoComplete="email"
          keyboardType={'email-address'}
          placeholder="Correu electrònic"
          onChangeText={setEmail}
        />
        <TextInput
          style={[styles.inputPassword, {color: Colors[theme].text, borderColor: emailErrorMessage === undefined && passwordErrorMessage === undefined ? 'transparent' : '#ff3737'}]}
          textContentType="password"
          secureTextEntry={true}
          autoComplete="password"
          keyboardType={'visible-password'}
          placeholder="Contrasenya"
          onChangeText={setPassword}
        />
        <TextInput
          style={[styles.inputPassword, {color: Colors[theme].text, borderColor: emailErrorMessage === undefined && passwordErrorMessage === undefined ? 'transparent' : '#ff3737'}]}
          textContentType="password"
          secureTextEntry={true}
          autoComplete="password"
          keyboardType={'visible-password'}
          placeholder="Repetir contrasenya"
          onChangeText={setPasswordRepeated}
        />
        <Text style={{color: '#ff3737', height: 20}}>{emailErrorMessage}{passwordErrorMessage}</Text>
        <View style={{marginTop: 20, backgroundColor: 'transparent'}}>
          { loading ?
            <ActivityIndicator style={{marginTop: 12}} size="small" />
          :
            <Pressable
              disabled={!email.includes('@') || password.length === 0 || passwordErrorMessage !== undefined}
              onPress={onEmailSignUp}
              style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5}}
            >
              <Text style={{fontSize: 20, color: '#007aff', textAlign: 'center'}}>Registra'm</Text>
              <FeatherIcon name="arrow-right" size={20} color={'#007aff'} />
            </Pressable>
          }
        </View>
      </View>
      <View style={{position: 'absolute', bottom: 0, backgroundColor: 'transparent'}}>
        <Text>Ja tens un compte?</Text>
        <Pressable onPress={onGoToLogIn}><Text style={{color: '#007aff', textAlign: 'center', marginTop: 6}}>Iniciar sessió</Text></Pressable>
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