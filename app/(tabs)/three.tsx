import { Button, Pressable, StyleSheet } from 'react-native';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthProvider';
import { Text, View } from '../../components/Themed';
import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { FeatherIcon } from '../components/icons';

export default function TabThreeScreen() {
  const { setUser, user } = useAuth();
  const [emailVerified, setEmailVerified] = useState<boolean>(FIREBASE_AUTH.currentUser?.emailVerified ?? false);
  const [resendCooldown, setResendCooldown] = useState<boolean>(false);
  const [lastSent, setLastSent] = useState<Date>();

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
    if (lastSent && (new Date().getTime() - lastSent.getTime()) < 60000) { //PAU info 60 seconds between resend calls
      return;
    }
    if (FIREBASE_AUTH.currentUser) {
      sendEmailVerification(FIREBASE_AUTH.currentUser)
      .then(() => {
        setResendCooldown(true);
        setTimeout(() => {
          setResendCooldown(false);
        }, 60000);
        setLastSent(new Date());
      })
      .catch((err) => {
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
      <Text style={styles.title}>Perfil</Text>
      <View style={styles.wrapper}>
        <View style={{backgroundColor: 'transparent', flexDirection: 'row'}}><Text>{user?.email}  ·  </Text><Text style={{color: emailVerified ? '#3fde7a' : '#ff3737'}}>{emailVerified ? 'Verificat' : 'No verificat'}</Text></View>
        { !emailVerified ?
          <Pressable onPress={onResendVerificationEmail}><Text style={{color: resendCooldown ? '#007AFF80' : '#007AFF'}}>Reenviar correu de verificació</Text></Pressable>
        : null }
        { user && user.cardNumber ?
          <View style={{backgroundColor: 'transparent', flexDirection: 'row'}}><Text>Tarjeta de crèdit guardada: {user.cardNumber.slice(9, user.cardNumber.length)}  ·  </Text><Pressable onPress={onDeleteUserCard}><Text style={{color: '#ff3737'}}>Eliminar</Text></Pressable></View>
        : null }
        <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
        <Pressable style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5}} onPress={onLogOut}><FeatherIcon name="log-out" size={18} color={'#007aff'} /><Text style={{color: '#007aff', fontSize: 16}}>Tancar sessió</Text></Pressable>
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
