import { useEffect, useState } from "react";
import { StyleSheet, TextInput, ActivityIndicator, Pressable, ScrollView, Platform } from "react-native";
import { router } from "expo-router";
import Checkbox from 'expo-checkbox';
import Colors from "../../constants/Colors";
import { View, Text} from "../../components/Themed";
import { useSupabase } from "../../context/SupabaseProvider";
import { FeatherIcon } from "../../components/CustomIcons";
import { isValidEmail } from "../../utils/formValidationUtils";
import { authEmailsTranslations } from "../../assets/translations/email";
import { AvailableLocales } from "../../assets/translations/translation";
import OneTimeCodeInput from "../../components/OneTimeCodeInput";
import Animated, { Easing, FadeIn, ReduceMotion } from "react-native-reanimated";

export default function Signup() {
  const { signInWithOTP, verifyOTP, i18n, theme } = useSupabase();

  const [birthdate, setBirthdate] = useState<string>(null);
  const [termsChecked, setTermsChecked] = useState(false);
  const [fullname, setFullname] = useState<string>('');
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
    const emailData = authEmailsTranslations[i18n?.locale as AvailableLocales];
    signInWithOTP({
      email: email,
      options: {
        shouldCreateUser: true,
        data: {lang: i18n?.locale as AvailableLocales, emailData: emailData, birthdate: birthdate, fullname: fullname}
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
      setLoading(false);
    });
  };

  const onChangeEmail = () => {
    setEmail('');
    setEmailSent(false);
    setEmailErrorMessage(undefined);
    setLoading(false);
  };

  const onGoToLogIn = () => {
    router.setParams({ action:'login' });
  };

  const onGoToTerms = () => {
    router.navigate('/terms');
  }

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(250).easing(Easing.inOut(Easing.quad)).reduceMotion(ReduceMotion.Never)} style={[styles.wrapper, {backgroundColor: Colors[theme].oppositeBackgroundHalfOpacity}]}>
        <Text style={styles.title}>{ i18n?.t('accountCreation') }</Text>
        <Text style={styles.explanation}>{ i18n?.t('emailCodeExplanation') }</Text>
        <View style={styles.inputContainer}>
          { !emailSent ? <>
            <TextInput
              key="fullnameInput"
              style={[styles.input, {color: Colors[theme].text + (!fullname ? 'B3' : ''), backgroundColor: Colors[theme].inputBackgroundColor, borderColor: emailErrorMessage === undefined ? Colors[theme].inputBorderColor : '#ff3737'}]}
              textContentType="name"
              autoComplete="name"
              placeholder={ i18n?.t('fullname') }
              onChangeText={(text) => setFullname(text.replace(/[<>&]/g, ''))}
            />
            <TextInput
              key="emailInput"
              style={[styles.input, {color: Colors[theme].text + (!email ? 'B3' : ''), backgroundColor: Colors[theme].inputBackgroundColor, borderColor: emailErrorMessage === undefined ? Colors[theme].inputBorderColor : '#ff3737'}]}
              textContentType="emailAddress"
              autoComplete="email"
              inputMode="email"
              placeholder={ i18n?.t('email') }
              onChangeText={(text) => setEmail(text.replace(/[<>&]/g, ''))}
            />
            { Platform.OS === 'web' ?
              <View style={styles.datepickerWrapper}>
                <Text style={styles.datepickerTitle}>{ i18n?.t('birthdate') }:</Text>
                <input style={theme === 'light' ? styles.datepickerLight : styles.datepickerDark} type="date" id="birthdate" name="birthdate" value={birthdate || ''} onChange={(e) => setBirthdate(e.target.value)} />
              </View>
            : null }
            <View style={styles.acceptTerms}>
              <View style={styles.acceptTermsCheckbox}>
                <Checkbox
                  style={styles.acceptTermsCheckboxInput}
                  value={termsChecked}
                  onValueChange={setTermsChecked}
                />
                {/* can define checked color like this above: color={termsChecked ? '#613AC5' : undefined} */}
                <Text style={styles.acceptTermsCheckboxText}>{ i18n?.t('haveReadAndAcceptTermsAndPrivacy') }</Text>
              </View>
              <Pressable onPress={onGoToTerms}><Text style={styles.termsActionLink}>{ i18n?.t('termsAndPrivacy') }</Text></Pressable>
            </View>
          </> : <>
            <View style={styles.emailSubmitted}>
              <ScrollView horizontal>
                <Text style={styles.email}>{email}</Text>
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
            <Text style={styles.inputErrorMessage}>{emailErrorMessage}</Text>
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
                    disabled={!fullname || !isValidEmail(email) || !termsChecked || !birthdate}
                    onPress={onEmailSignUp}
                    style={[styles.button, {backgroundColor: Colors[theme].text, opacity: !fullname || !isValidEmail(email) || !termsChecked || !birthdate ? 0.5 : 1}]}
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
      </Animated.View>
      <Animated.View entering={FadeIn.duration(250).easing(Easing.inOut(Easing.quad)).reduceMotion(ReduceMotion.Never)} style={styles.bottomActionContainer}>
        <Text style={styles.bottomActionTitle}>{ i18n?.t('alreadyAccountQuestion') }</Text>
        <Pressable onPress={onGoToLogIn}><Text style={styles.bottomActionLink}>{ i18n?.t('logIn') }</Text></Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    overflow: 'hidden',
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  wrapper: {
    paddingVertical: 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    maxWidth: 500,
    width: '100%'
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold'
  },
  explanation: {
    fontSize: 18,
    textAlign: 'center',
    maxWidth: 300,
    opacity: 0.7
  },
  datepickerWrapper: {
    width: '100%',
    maxWidth: 300,
    gap: 2
  },
  datepickerTitle: {
    fontSize: 16,
    opacity: 0.7,
    marginHorizontal: 8
  },
  datepickerLight: {
    minWidth: '90%',
    fontSize: 16,
    padding: 10,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'solid',
    backgroundColor: '#E8E8E8BF',
    borderColor: '#20222833',
    color: '#202228'
  },
  datepickerDark: {
    minWidth: '90%',
    fontSize: 16,
    padding: 11.25,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'solid',
    backgroundColor: '#181818BF',
    borderColor: '#FCFCFC33',
    color: '#FCFCFC'
  },
  acceptTerms: {
    maxWidth: 290,
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    marginTop: 5,
    marginBottom: 7
  },
  acceptTermsCheckbox: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7
  },
  acceptTermsCheckboxInput: {
    width: 19,
    height: 19
  },
  acceptTermsCheckboxText: {
    fontSize: 13.5
  },
  termsActionLink: {
    fontSize: 14,
    textDecorationLine: 'underline',
    textAlign: 'center'
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
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  bottomActionTitle: {
    fontSize: 16
  },
  bottomActionLink: {
    fontSize: 16,
    textDecorationLine: 'underline',
    textAlign: 'center'
  }
});