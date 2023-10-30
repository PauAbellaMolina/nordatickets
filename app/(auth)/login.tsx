import { useRef, useState } from "react";
import { StyleSheet, TextInput, Button, useColorScheme, ActivityIndicator } from "react-native";
import { PhoneAuthProvider, UserCredential, createUserWithEmailAndPassword, sendEmailVerification, signInWithCredential, signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { FIREBASE_CONFIG, FIREBASE_AUTH } from '../../firebaseConfig';
import Colors from "../../constants/Colors";
import { View, Text} from "../../components/Themed";

export default function Login() {
  const theme = useColorScheme() ?? 'light';
  const [waitingForCode, setWaitingForCode] = useState<boolean>(false);
  const [waitingForConfirmation, setWaitingForConfirmation] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [verificationId, setVerificationId] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const recaptchaRef = useRef<FirebaseRecaptchaVerifierModal>(null);

  // const onSendCode = () => {
  //   if (recaptchaRef.current) {
  //     setWaitingForCode(true);
  //     const phoneProvider = new PhoneAuthProvider(FIREBASE_AUTH);
  //     phoneProvider
  //     .verifyPhoneNumber('+34'+phoneNumber, recaptchaRef.current)
  //     .then(setVerificationId)
  //     .catch((err): void => {
  //       console.log('PAU LOG-> err: ', phoneNumber, err);
  //       alert(err);
  //     });
  //   }
  // }

  // const onConfirmCode = () => {
  //   setWaitingForConfirmation(true);
  //   const credential = PhoneAuthProvider.credential(
  //     verificationId,
  //     verificationCode
  //   );
  //   signInWithCredential(FIREBASE_AUTH, credential)
  //   .then((result: UserCredential) => {
  //     console.log('PAU LOG-> result: ', result);
  //   })
  //   .catch((err) => {
  //     console.log('PAU LOG-> err: ', err);
  //     alert(err);
  //     setWaitingForConfirmation(false);
  //   });
  // };

  const onEmailSignUp = () => {
    if (recaptchaRef.current) {
      createUserWithEmailAndPassword(FIREBASE_AUTH, email, password)
      .then((result: UserCredential) => {
        console.log('PAU LOG-> result: ', result);
        const user = result.user;
        sendEmailVerification(user).
        then(() => {
          console.log('PAU LOG-> Email sent');
        })
        .catch((err) => {
          console.log('PAU LOG-> err sending email: ', err);
          alert(err);
        });
      })
      .catch((err) => {
        console.log('PAU LOG-> err creating user: ', err);
        alert(err);
      });
    }
  }

  const onEmailLogIn = () => {
    if (recaptchaRef.current) {
      signInWithEmailAndPassword(FIREBASE_AUTH, email, password)
      .then((result: UserCredential) => {
        console.log('PAU LOG-> result: ', result);
      })
      .catch((err) => {
        console.log('PAU LOG-> err login in: ', err);
        alert(err);
      });
    }
  }

  // return (
  //   <>
  //     <FirebaseRecaptchaVerifierModal
  //       ref={recaptchaRef}
  //       firebaseConfig={FIREBASE_CONFIG}
  //       attemptInvisibleVerification={true}
  //     />
  //     <View style={styles.container}>
  //       <Text style={styles.title}>Log In</Text>
  //       <View style={styles.inputContainer}>
  //         <TextInput
  //           style={[styles.input, {color: Colors[theme].text}]}
  //           editable={!waitingForCode}
  //           autoComplete="tel"
  //           keyboardType={'phone-pad'}
  //           placeholder="Your phone number"
  //           onChangeText={(text)=> setPhoneNumber(text.replace(/[^0-9]/g, ''))}
  //         />
  //         { waitingForCode ?
  //           <TextInput
  //             style={[styles.input, styles.confirmationCodeInput, {color: Colors[theme].text}]}
  //             placeholder="SMS Confirmation Code"
  //             onChangeText={setVerificationCode}
  //             keyboardType="number-pad"
  //           />
  //         :
  //           <></>
  //         }
  //         <View style={{backgroundColor: 'transparent', marginTop: 20}}>
  //           { waitingForConfirmation ?
  //             <ActivityIndicator style={{marginTop: 10}} size="small" />
  //           :
  //             <Button
  //               disabled={!waitingForCode && phoneNumber.length !== 9}
  //               title={waitingForCode ? 'Confirm code' : 'Send code'}
  //               onPress={waitingForCode ? onConfirmCode : onSendCode}
  //             />
  //           }
  //         </View>
  //       </View>
  //     </View>
  //   </>
  // );

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
            style={[styles.input, {color: Colors[theme].text}]}
            autoComplete="email"
            keyboardType={'email-address'}
            placeholder="Your email"
            onChangeText={setEmail}
          />
          <TextInput
            style={[styles.input, {color: Colors[theme].text}]}
            autoComplete="password"
            keyboardType={'visible-password'}
            placeholder="Your password"
            onChangeText={setPassword}
          />
          <Button
            title='Sign up'
            onPress={onEmailSignUp}
          />
          <Button
            title='Log in'
            onPress={onEmailLogIn}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
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
    paddingHorizontal: 10,
    fontSize: 30
  },
  confirmationCodeInput: {
    fontSize: 20
  }
});