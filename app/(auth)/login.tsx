import { useEffect, useState } from "react";
import { StyleSheet, TextInput, useColorScheme, ActivityIndicator, Pressable } from "react-native";
import { router } from "expo-router";
import Colors from "../../constants/Colors";
import { View, Text} from "../../components/Themed";
import { useSupabase } from "../../context/SupabaseProvider";
import BlobsBackground from "../../components/BlobsBackground";
import { FeatherIcon } from "../../components/CustomIcons";

export default function Login() {
  const theme = useColorScheme() ?? 'light';

  const { signInWithOTP, verifyOTP } = useSupabase();

  const [email, setEmail] = useState<string>('');
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState<string | undefined>(undefined);
  const [oneTimeCode, setOneTimeCode] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (emailErrorMessage !== undefined) {
      setEmailErrorMessage(undefined);
    }
  }, [email]);

  const onEmailLogIn = () => {
    setEmailErrorMessage(undefined);
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
    .then(() => {
      setEmailSent(true);
    })
    .catch(() => {
      setEmailSent(false);
      setEmailErrorMessage('Torna-ho a intentar');
    })
    .finally(() => {
      //TODO PAU show email sent message
      setLoading(false);
    });
  };

  const onChangeEmail = () => {
    setEmailSent(false);
    setEmailErrorMessage(undefined);
    setLoading(false);
  };

  const onCodeSubmit = () => {
    setEmailErrorMessage(undefined);
    setLoading(true);
    verifyOTP(email, oneTimeCode.toString())
    .catch(() => {
      setEmailErrorMessage('Torna-ho a intentar');
    })
    .finally(() => {
      setLoading(false);
    });
  };

  const onGoToSignUp = () => {
    router.push('/signup');
  };

  return (
    <BlobsBackground style={styles.container}>
      <View style={[styles.wrapper, {backgroundColor: Colors[theme].oppositeBackgroundHalfOpacity}]}>
        <Text style={styles.title}>Iniciar sessió</Text>
        <Text style={styles.explanation}>T'enviarem un codi de 6 dígits al correu electrònic</Text>
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
            <View style={styles.emailSubmitted}>
              <Text style={styles.email}>{email}</Text>
              <Pressable onPress={onChangeEmail}>
                <FeatherIcon name="edit-2" size={18} color={Colors[theme].text} />
              </Pressable>
            </View>
            <TextInput
              key="oneTimeCodeInput"
              style={[styles.input, {color: Colors[theme].text, borderColor: emailErrorMessage === undefined ? Colors[theme].text : '#ff3737'}]}
              inputMode="numeric"
              placeholder="Codi d'un sol ús"
              onChangeText={setOneTimeCode}
            />
          </>}
          { emailErrorMessage ?
            <Text style={styles.inputErrorMessage}>{emailErrorMessage}</Text>
          :
            null
          }
          <View style={{backgroundColor: 'transparent'}}>
            { loading ?
              <ActivityIndicator style={{marginTop: 12}} size="small" />
            : 
              <>
                { !emailSent ?
                  <Pressable
                    disabled={!email.includes('@')}
                    onPress={onEmailLogIn}
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
                    <Text style={[styles.buttonText, {color: Colors[theme].oppositeThemeText}]}>Entrar</Text>
                  </Pressable>
                }
              </>
            }
          </View>
        </View>
      </View>
      <View style={styles.bottomActionContainer}>
        <Text style={styles.bottomActionTitle}>No tens un compte?</Text>
        <Pressable onPress={onGoToSignUp}><Text style={styles.bottomActionLink}>Registra't</Text></Pressable>
      </View>
    </BlobsBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    paddingVertical: 30,
    paddingBottom: 35,
    paddingHorizontal: 20,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold'
  },
  explanation: {
    fontSize: 18,
    textAlign: 'center',
    width: '70%',
  },
  email: {
    fontSize: 25,
    maxWidth: 250,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    wordWrap: 'normal'
  },
  emailSubmitted: {
    backgroundColor: 'transparent',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  inputContainer: {
    backgroundColor: 'transparent',
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 25,
    gap: 15
  },
  input: {
    pointerEvents: 'box-only',
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
    bottom: 50,
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