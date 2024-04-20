import { useEffect, useState } from "react";
import { StyleSheet, TextInput, useColorScheme, ActivityIndicator, Pressable } from "react-native";
import { router } from "expo-router";
import Colors from "../../constants/Colors";
import { View, Text} from "../../components/Themed";
import { useSupabase } from "../../context/SupabaseProvider";
import BlobsBackground from "../../components/BlobsBackground";
import { FeatherIcon } from "../../components/CustomIcons";
import { AvailableLocales } from "../../assets/translations/translation";
import { authEmailsTranslations } from "../../assets/translations/email";

export default function Signup() {
  const theme = useColorScheme() ?? 'light';

  const { signInWithOTP, verifyOTP, i18n } = useSupabase();

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
    setEmailErrorMessage(undefined);
    setLoading(true);

    //One time password (OTP)
    const langMetaData = authEmailsTranslations[i18n.locale as AvailableLocales];
    signInWithOTP({
      email: email,
      options: {
        shouldCreateUser: true,
        data: langMetaData
      }
    })
    .then(() => {
      setEmailSent(true);
    })
    .catch(() => {
      setEmailSent(false);
      setEmailErrorMessage(i18n?.t('tryAgain'));
    })
    .finally(() => {
      //TODO PAU show email sent message
      setLoading(false);
    });
  };

  const onCodeSubmit = () => {
    setEmailErrorMessage(undefined);
    setLoading(true);
    verifyOTP(email, oneTimeCode.toString())
    .catch(() => {
      setEmailErrorMessage(i18n?.t('tryAgain'));
    })
    .finally(() => {
      setLoading(false);
    });
  };

  const onChangeEmail = () => {
    setEmailSent(false);
    setEmailErrorMessage(undefined);
    setLoading(false);
  };

  const onGoToLogIn = () => {
    router.push('/login');
  };

  return (
    <BlobsBackground style={styles.container}>
      <View style={[styles.wrapper, {backgroundColor: Colors[theme].oppositeBackgroundHalfOpacity}]}>
        <Text style={styles.title}>{ i18n?.t('accountCreation') }</Text>
        <Text style={styles.explanation}>{ i18n?.t('emailCodeExplanation') }</Text>
        <View style={styles.inputContainer}>
          { !emailSent ?
            <TextInput
              key="emailInput"
              style={[styles.input, {color: Colors[theme].text, borderColor: emailErrorMessage === undefined ? Colors[theme].text : '#ff3737'}]}
              textContentType="emailAddress"
              autoComplete="email"
              inputMode="email"
              placeholder={ i18n?.t('email') }
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
              placeholder={ i18n?.t('oneTimeCode') }
              onChangeText={setOneTimeCode}
            />
          </>}
          { emailErrorMessage ?
            <Text style={styles.inputErrorMessage}>{emailErrorMessage}</Text>
          :
            null
          }
          <View>
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
                    <Text style={[styles.buttonText, {color: Colors[theme].oppositeThemeText}]}>{ i18n?.t('send') }</Text>
                  </Pressable>
                :
                  <Pressable
                    disabled={oneTimeCode.length !== 6}
                    onPress={onCodeSubmit}
                    style={[styles.button, {backgroundColor: Colors[theme].text, opacity: oneTimeCode.length !== 6 ? 0.5 : 1}]}
                  >
                    <Text style={[styles.buttonText, {color: Colors[theme].oppositeThemeText}]}>{ i18n?.t('signMeUp') }</Text>
                  </Pressable>
                }
              </>
            }
          </View>
        </View>
      </View>
      <View style={styles.bottomActionContainer}>
        <Text style={styles.bottomActionTitle}>{ i18n?.t('alreadyAccountQuestion') }</Text>
        <Pressable onPress={onGoToLogIn}><Text style={styles.bottomActionLink}>{ i18n?.t('logIn') }</Text></Pressable>
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
    borderRadius: 50,
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
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  inputContainer: {
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
    bottom: 50
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