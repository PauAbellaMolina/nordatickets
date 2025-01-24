import { useEffect, useState } from "react";
import { StyleSheet, TextInput, ActivityIndicator, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import Colors from "../../constants/Colors";
import { View, Text} from "../../components/Themed";
import { useSupabase } from "../../context/SupabaseProvider";
import { FeatherIcon } from "../../components/CustomIcons";
import OneTimeCodeInput from '../../components/OneTimeCodeInput';
import { isValidEmail } from "../../utils/formValidationUtils";
import Animated, { Easing, FadeIn, ReduceMotion } from "react-native-reanimated";

export default function Login() {
  const { signInWithOTP, verifyOTP, i18n, theme } = useSupabase();

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
    
    //One time password (OTP)
    signInWithOTP({
      email: email,
      options: {
        shouldCreateUser: false
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

  const onChangeEmail = () => {
    setEmail('');
    setEmailSent(false);
    setEmailErrorMessage(undefined);
    setLoading(false);
  };

  const onCodeSubmit = () => {
    setEmailErrorMessage(undefined);
    setLoading(true);
    verifyOTP(email, oneTimeCode.toString())
    .catch(() => {
      setEmailErrorMessage(i18n?.t('tryAgain'));
      setLoading(false);
    });
  };

  const onGoToSignUp = () => {
    router.setParams({ action:'signup' });
  };

  const style = styles(theme);

  return (
    <View style={style.container}>
      <Animated.View entering={FadeIn.duration(250).easing(Easing.inOut(Easing.quad)).reduceMotion(ReduceMotion.Never)} style={style.wrapper}>
        <Text style={style.title}>{ i18n?.t('logIn') }</Text>
        <Text style={style.explanation}>{ i18n?.t('emailCodeExplanation') }</Text>
        <View style={style.inputContainer}>
          { !emailSent ?
            <TextInput
              key="emailInput"
              style={[style.input, {color: Colors[theme].text + (!email ? 'B3' : ''), borderColor: emailErrorMessage === undefined ? Colors[theme].inputBorderColor : '#ff3737'}]}
              textContentType="emailAddress"
              autoComplete="email"
              inputMode="email"
              placeholder={ i18n?.t('email') }
              onChangeText={(text) => setEmail(text.replace(/[<>&]/g, ''))}
            />
          : <>
            <View style={style.emailSubmitted}>
              <ScrollView horizontal>
                <Text style={style.email}>{email}</Text>
              </ScrollView>
              <Pressable onPress={onChangeEmail}>
                <FeatherIcon name="edit-2" size={18} color={Colors[theme].text} />
              </Pressable>
            </View>
            <OneTimeCodeInput
              value={oneTimeCode}
              onChange={(code) => setOneTimeCode(code.replace(/[<>&]/g, ''))}
              theme={theme}
              errorState={emailErrorMessage !== undefined}
            />
          </>}
          { emailErrorMessage ?
            <Text style={style.inputErrorMessage}>{emailErrorMessage}</Text>
          :
            null
          }
          <View>
            { loading ?
              <ActivityIndicator style={{marginVertical: 12.3}} size="small" />
            : 
              <>
                { !emailSent ?
                  <Pressable
                    disabled={!isValidEmail(email)}
                    onPress={onEmailLogIn}
                    style={[style.button, {opacity: !isValidEmail(email) ? 0.5 : 1}]}
                  >
                    <Text style={style.buttonText}>{ i18n?.t('send') }</Text>
                  </Pressable>
                :
                  <Pressable
                    disabled={oneTimeCode.length !== 6}
                    onPress={onCodeSubmit}
                    style={[style.button, {opacity: oneTimeCode.length !== 6 ? 0.5 : 1}]}
                  >
                    <Text style={style.buttonText}>{ i18n?.t('enter') }</Text>
                  </Pressable>
                }
              </>
            }
          </View>
        </View>
      </Animated.View>
      <Animated.View entering={FadeIn.duration(250).easing(Easing.inOut(Easing.quad)).reduceMotion(ReduceMotion.Never)} style={style.bottomActionContainer}>
        <Text style={style.bottomActionTitle}>{ i18n?.t('noAccountQuestion') }</Text>
        <Pressable onPress={onGoToSignUp}><Text style={style.bottomActionLink}>{ i18n?.t('signUp') }</Text></Pressable>
      </Animated.View>
    </View>
  );
}

const styles = (theme: string) => StyleSheet.create({
  container: {
    height: '100%',
    overflow: 'hidden',
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  wrapper: {
    paddingVertical: 25,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    maxWidth: 500,
    width: '100%',
    backgroundColor: Colors[theme].oppositeBackgroundHalfOpacity
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold'
  },
  explanation: {
    fontSize: 18,
    textAlign: 'center',
    maxWidth: 300,
    opacity: 0.8
  },
  email: {
    fontSize: 25
  },
  emailSubmitted: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    maxWidth: 250
  },
  inputContainer: {
    marginTop: 10,
    alignItems: 'center',
    width: '100%',
    gap: 15
  },
  input: {
    pointerEvents: 'box-only',
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: 20,
    fontSize: 20,
    textAlign: 'center',
    width: '100%',
    maxWidth: 300,
    backgroundColor: Colors[theme].inputBackgroundColor
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
    maxWidth: 300,
    backgroundColor: Colors[theme].text
  },
  buttonText: {
    fontWeight: '500',
    fontSize: 18,
    textAlign: 'center',
    color: Colors[theme].oppositeThemeText
  },
  bottomActionContainer: {
    position: 'absolute',
    bottom: 35
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