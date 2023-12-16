import { Button, Pressable, StyleSheet } from 'react-native';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthProvider';
import { Text, View } from '../../components/Themed';
import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';

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

  const onDeleteUserCard = () => {
    if (!user) {
      return;
    }
    const userDocRef = doc(FIRESTORE_DB, 'users', user.id);
    updateDoc(userDocRef, {
      redsysToken: null,
      cardNumber: null,
      expiryDate: null
    }).then(() => {
      setUser({
        ...user,
        redsysToken: undefined,
        cardNumber: undefined,
        expiryDate: undefined
      });
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>
      <View style={styles.wrapper}>
        <View style={{backgroundColor: 'transparent', flexDirection: 'row'}}><Text>{user?.email}  ·  </Text><Text style={{color: emailVerified ? '#3fde7a' : '#ff3737'}}>{emailVerified ? 'Verified' : 'Not verified'}</Text></View>
        { !emailVerified ?
          <Button
            title={'Resend verification email'}
            onPress={onResendVerificationEmail}
          />
        : null }
        { user && user.cardNumber ?
          <View style={{backgroundColor: 'transparent', flexDirection: 'row'}}><Text>Saved credit card: {user.cardNumber.slice(9, user.cardNumber.length)}  ·  </Text><Pressable onPress={onDeleteUserCard}><Text style={{color: '#ff3737'}}>Delete</Text></Pressable></View>
        : null }
        <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
        <Pressable onPress={onLogOut}><Text style={{color: '#007aff'}}>Log out</Text></Pressable>
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
    marginTop: 30,
    marginHorizontal: 10,
    alignItems: 'flex-start',
    gap: 15
  },
  separator: {
    marginVertical: 5,
    height: 1,
    width: '80%'
  }
});
