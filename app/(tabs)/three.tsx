import { Button, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';

import EditScreenInfo from '../../components/EditScreenInfo';
import { Text, View } from '../../components/Themed';

import { useAuth } from '../../context/AuthProvider';
import { signOut } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../firebaseConfig';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from 'react-native/Libraries/NewAppScreen';

export default function TabThreeScreen() {
  const theme = useColorScheme() ?? 'light';
  const { setUser, user } = useAuth();

  const onLogOut = () => {
    signOut(FIREBASE_AUTH).then(() => {
      setUser(null);
    }).catch((err: any) => {
      console.log('PAU LOG-> error: ', err);
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

        {/* <View>
          <FontAwesome name="times" size={22} color={Colors[theme].text} /><Text></Text>
        </View>
        <View>
          <FontAwesome name="times" size={22} color={Colors[theme].text} /><Text></Text>
        </View>
        <View>
          <FontAwesome name="times" size={22} color={Colors[theme].text} /><Text></Text>
        </View>
        <View>
          <FontAwesome name="times" size={22} color={Colors[theme].text} /><Text></Text>
        </View>
        <View>
          <FontAwesome name="times" size={22} color={Colors[theme].text} /><Text></Text>
        </View> */}
      </View>
    </View>
    /* <View style={styles.container}>
      <Text style={styles.title}>Account</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <Button
        title={'Log Out'}
        onPress={onLogOut}
      />
    </View> */
  );
}

const styles = StyleSheet.create({
  // container: {
  //   flex: 1,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  // },
  // title: {
  //   fontSize: 20,
  //   fontWeight: 'bold',
  // },
  container: {
    paddingTop: 55,
    paddingHorizontal: 15,
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  wrapper: {
    marginTop: 10,
    marginHorizontal: 10,
    alignItems: 'flex-start',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
