import { useEffect, useState } from "react";
import { StyleSheet, TextInput, useColorScheme, ActivityIndicator, Pressable } from "react-native";
import { router } from "expo-router";
import Colors from "../../constants/Colors";
import { View, Text} from "../../components/Themed";
import { useSupabase } from "../../context/SupabaseProvider";

export default function Signup() {
  const theme = useColorScheme() ?? 'light';

  const { signInWithOTP, verifyOTP } = useSupabase();

  const [email, setEmail] = useState<string>('');
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState<string | undefined>(undefined);
  const [oneTimeCode, setOneTimeCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  useEffect(() => {
    if (emailErrorMessage !== undefined) {
      setEmailErrorMessage(undefined);
    }
  }, [email]);

  const onEmailSignUp = () => {
    setLoading(true);

    //Magic link
    // signInWithLink(email)
    // .catch(() => {
    //   setEmailErrorMessage('Torna-ho a intentar');
    // })
    // .finally(() => {
    //   setLoading(false);
    // });

    //One time password (OTP)
    signInWithOTP(email)
    .catch(() => {
      setEmailErrorMessage('Torna-ho a intentar');
    })
    .finally(() => {
      setEmailSent(true);
      //TODO PAU show email sent message
      setLoading(false);
    });
  };

  const onCodeSubmit = () => {
    setLoading(true);
    verifyOTP(email, oneTimeCode.toString())
    .catch(() => {
      setEmailErrorMessage('Torna-ho a intentar');
    })
    .finally(() => {
      setLoading(false);
    });
  };

  const onGoToLogIn = () => {
    router.push('/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Creació del compte</Text>
      <View style={styles.inputContainer}>
        { !emailSent ?
          <TextInput
            key="emailInput"
            style={[styles.input, {color: Colors[theme].text, borderColor: emailErrorMessage === undefined ? Colors[theme].text : '#ff3737'}]}
            textContentType="emailAddress"
            autoComplete="email"
            inputMode="email"
            placeholder="Correu electrònic"
            onChangeText={setEmail}
          />
        : <>
          <Text style={styles.email}>{email}</Text>
          <TextInput
            key="oneTimeCodeInput"
            style={[styles.input, {color: Colors[theme].text, borderColor: emailErrorMessage === undefined ? Colors[theme].text : '#ff3737'}]}
            inputMode="numeric"
            placeholder="Codi d'un sol ú"
            onChangeText={setOneTimeCode}
          />
        </>}
        <Text style={styles.inputErrorMessage}>{emailErrorMessage}</Text>
        <View style={{marginTop: 20, backgroundColor: 'transparent'}}>
          { loading ?
            <ActivityIndicator style={{marginTop: 12}} size="small" />
          :
            <>
              { !emailSent ?
                <Pressable
                  disabled={!email.includes('@')}
                  onPress={onEmailSignUp}
                  style={[styles.button, {backgroundColor: Colors[theme].text, opacity: !email.includes('@') ? 0.5 : 1}]}
                >
                  <Text style={[styles.buttonText, {color: Colors[theme].oppositeThemeText}]}>Enviar</Text>
                </Pressable>
              :
                <Pressable
                  disabled={oneTimeCode.length !== 6}
                  onPress={onCodeSubmit}
                  style={[styles.button, {backgroundColor: Colors[theme].text, opacity: oneTimeCode.length !== 6 ? 0.5 : 1}]}
                >
                  <Text style={[styles.buttonText, {color: Colors[theme].oppositeThemeText}]}>Registra'm</Text>
                </Pressable>
              }
            </>
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
  email: {
    fontSize: 25,
    marginBottom: 20
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