import { Button, StyleSheet } from 'react-native';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthProvider';
import { Text, View } from '../../components/Themed';
import { useEffect, useState } from 'react';

export default function TabThreeScreen() {
  const { setUser, user } = useAuth();
  const [emailVerified, setEmailVerified] = useState<boolean>(FIREBASE_AUTH.currentUser?.emailVerified ?? false);

  useEffect(() => {
    if (!FIREBASE_AUTH.currentUser?.emailVerified) {
      setInterval(() => {
        if (!FIREBASE_AUTH.currentUser?.emailVerified) {
          FIREBASE_AUTH.currentUser?.reload();
        } else {
          setEmailVerified(true);
        }
      }, 10000);
    }
  }, []);

  const onLogOut = () => {
    signOut(FIREBASE_AUTH).then(() => {
      setUser(null);
    }).catch((err: any) => {
      console.log('PAU LOG-> error: ', err);
    });
  };

  const onResendVerificationEmail = () => {
    if (FIREBASE_AUTH.currentUser) {
      sendEmailVerification(FIREBASE_AUTH.currentUser) //TODO PAU REALLY IMPORTANT: we should set a threshold here to prevent spamming
      .then(() => {
        console.log('PAU LOG-> Email sent');
      })
      .catch((err) => {
        console.log('PAU LOG-> err sending email: ', err);
        alert(err);
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>
      <View style={styles.wrapper}>
        <View style={{backgroundColor: 'transparent', flexDirection: 'row'}}><Text>{user?.email}  ·  </Text><Text style={{color: emailVerified ? '#3fde7a' : '#ff3737'}}>{emailVerified ? 'Verified' : 'Not verified'}</Text></View>
        <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
        { !emailVerified ?
          <Button
            title={'Resend verification email'}
            onPress={onResendVerificationEmail}
          />
        : null }
        <Button
          title={'Log Out'}
          onPress={onLogOut}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingTop: 60,
    paddingBottom: 5,
    paddingHorizontal: 15,
    flex: 1
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold'
  },
  wrapper: {
    backgroundColor: 'transparent',
    marginTop: 10,
    marginHorizontal: 10,
    alignItems: 'flex-start'
  },
  separator: {
    marginVertical: 15,
    height: 1,
    width: '80%'
  }
});
