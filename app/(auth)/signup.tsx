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
      const user = result.user;
      sendEmailVerification(user)
      .catch((err) => {
        alert(err);
      });
    })
    .catch((err) => {
      setEmailErrorMessage('Credencials invàlides, torna-ho a intentar');
      setLoading(false);
    });
  }

  const onGoToLogIn = () => {
    router.push('/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Creació del compte</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, {color: Colors[theme].text, borderColor: emailErrorMessage === undefined ? Colors[theme].text : '#ff3737'}]}
          textContentType="emailAddress"
          autoComplete="email"
          keyboardType={'email-address'}
          placeholder="Correu electrònic"
          onChangeText={setEmail}
        />
        <TextInput
          style={[styles.input, styles.inputPassword, {color: Colors[theme].text, borderColor: emailErrorMessage === undefined && passwordErrorMessage === undefined ? Colors[theme].text : '#ff3737'}]}
          textContentType="password"
          secureTextEntry={true}
          autoComplete="password"
          keyboardType={'visible-password'}
          placeholder="Contrasenya"
          onChangeText={setPassword}
        />
        <TextInput
          style={[styles.input, styles.inputPassword, {color: Colors[theme].text, borderColor: emailErrorMessage === undefined && passwordErrorMessage === undefined ? Colors[theme].text : '#ff3737'}]}
          textContentType="password"
          secureTextEntry={true}
          autoComplete="password"
          keyboardType={'visible-password'}
          placeholder="Repetir contrasenya"
          onChangeText={setPasswordRepeated}
        />
        <Text style={styles.inputErrorMessage}>{emailErrorMessage}{passwordErrorMessage}</Text>
        <View style={{marginTop: 20, backgroundColor: 'transparent'}}>
          { loading ?
            <ActivityIndicator style={{marginTop: 12}} size="small" />
          :
            <Pressable
              disabled={!email.includes('@') || password.length === 0 || passwordErrorMessage !== undefined}
              onPress={onEmailSignUp}
              style={[styles.button, {backgroundColor: Colors[theme].text, opacity: !email.includes('@') || password.length === 0 || passwordErrorMessage !== undefined ? 0.5 : 1}]}
            >
              <Text style={[styles.buttonText, {color: Colors[theme].oppositeThemeText}]}>Registra'm</Text>
            </Pressable>
          }
        </View>
      </View>
      <View style={styles.bottomActionContainer}>
        <Text style={styles.bottomActionTitle}>Ja tens un compte?</Text>
        <Pressable onPress={onGoToLogIn}><Text style={styles.bottomActionLink}>Iniciar sessió</Text></Pressable>
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