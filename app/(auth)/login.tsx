import { useEffect, useState } from "react";
import { StyleSheet, TextInput, useColorScheme, ActivityIndicator, Pressable } from "react-native";
import { router } from "expo-router";
import Colors from "../../constants/Colors";
import { View, Text} from "../../components/Themed";
import { useSupabase } from "../../context/SupabaseProvider";

export default function Login() {
  const theme = useColorScheme() ?? 'light';

  const { signInWithLink } = useSupabase();

  const [email, setEmail] = useState<string>('');
  const [emailErrorMessage, setEmailErrorMessage] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (emailErrorMessage !== undefined) {
      setEmailErrorMessage(undefined);
    }
  }, [email]);

  const onEmailLogIn = () => {
    setLoading(true);
    signInWithLink(email)
    .catch(() => {
      setEmailErrorMessage('Torna-ho a intentar');
    })
    .finally(() => {
      setLoading(false);
      //TODO PAU show email sent message
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
          style={[styles.input, {color: Colors[theme].text, borderColor: emailErrorMessage === undefined ? Colors[theme].text : '#ff3737'}]}
          textContentType="emailAddress"
          autoComplete="email"
          keyboardType={'email-address'}
          placeholder="Correu electrònic"
          onChangeText={setEmail}
        />
        <Text style={styles.inputErrorMessage}>{emailErrorMessage}</Text>
        <View style={{marginTop: 20, backgroundColor: 'transparent'}}>
          { loading ?
            <ActivityIndicator style={{marginTop: 12}} size="small" />
          : 
            <Pressable
              disabled={!email.includes('@')}
              onPress={onEmailLogIn}
              style={[styles.button, {backgroundColor: Colors[theme].text, opacity: !email.includes('@') ? 0.5 : 1}]}
            >
              <Text style={[styles.buttonText, {color: Colors[theme].oppositeThemeText}]}>Entrar</Text>
            </Pressable>
          }
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