import { Button, StyleSheet } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthProvider';
import { Text, View } from '../../components/Themed';

export default function TabThreeScreen() {
  const { setUser, user } = useAuth();

  const onLogOut = () => {
    signOut(FIREBASE_AUTH).then(() => {
      setUser(null);
    }).catch((err: any) => {
      console.log('PAU LOG-> error: ', err);
    });
  }

  const test = () => { //TODO PAU for deving
    if (!user) {
      return;
    }

    const id = 'q860wiKxTuz1gHAQHRSq';
    const userDocRef = doc(FIRESTORE_DB, 'users', user.id);
    updateDoc(userDocRef, {
      eventIdsFollowing: [...user?.eventIdsFollowing, id]
    }).then(() => {
      setUser({
        ...user,
        eventIdsFollowing: [...user?.eventIdsFollowing, id as string]
      });
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>
      <View style={styles.wrapper}>
        <Button
          title={'Log Out'}
          onPress={onLogOut}
        />
        <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
        <Button
          disabled //TODO PAU to prevent accidental use, uncomment for deving
          title={'Test'}
          onPress={test}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 55,
    paddingHorizontal: 15,
    flex: 1
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold'
  },
  wrapper: {
    marginTop: 10,
    marginHorizontal: 10,
    alignItems: 'flex-start'
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%'
  }
});
