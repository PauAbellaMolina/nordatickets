import { useEffect } from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';
import { router, useGlobalSearchParams } from 'expo-router';
// import { WebView } from 'react-native-webview'; // Install package when adding support to ios and android
import { View } from '../../../../components/Themed';
import GoBackArrow from '../../../../components/GoBackArrow';
import { FeatherIcon } from '../../../../components/CustomIcons';
import Colors from '../../../../constants/Colors';
import { useSupabase } from '../../../../context/SupabaseProvider';
import { useEventScreens } from '../../../../context/EventScreensProvider';
import Welcome from '../../../../components/auth/Welcome';
import Signup from '../../../../components/auth/Signup';
import Login from '../../../../components/auth/Login';

export default function AuthModalScreen() {
  const { action } = useGlobalSearchParams();
  const { theme, user } = useSupabase();
  const { eventBackgroundColor, buyCartProcess } = useEventScreens();

  useEffect(() => {
    if (user) {
      buyCartProcess();
    }
  }, [user]);

  const renderAuthComponent = () => {
    switch(action) {
      case 'signup':
        return <Signup />;
      case 'login':
        return <Login />;
      default:
        return <Welcome showLocaleSelector={false} />;
    }
  };
  
  return (
    <View style={[styles.container, Platform.OS !== 'web' ? {marginTop: 50} : {paddingHorizontal: 10, paddingVertical: 11}]}>
      { Platform.OS === 'web' ? <>
        <View style={styles.fakeBackground}>
          <View style={[styles.eventInfoContainer, {backgroundColor: eventBackgroundColor}]}>
            <GoBackArrow />
          </View>
        </View>
        <Pressable onPress={() => router.back()} style={styles.closeBttnWeb}>
          <FeatherIcon name="x" size={30} color={Colors[theme].text} />
        </Pressable>
        <View style={[styles.welcomeContainer, {backgroundColor: Colors[theme].background, borderColor: Colors[theme].oppositeBackgroundHalfOpacity}]}>
          {renderAuthComponent()}
        </View>
      </>:<> {/* Implement when adding support to ios and android */} </>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  closeBttnWeb: {
    marginBottom: 5,
    display: 'flex',
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    gap: 5
  },
  welcomeContainer: {
    overflow: 'hidden',
    width: '100%',
    height: 'auto',
    flex: 1,
    borderRadius: 25,
    borderWidth: StyleSheet.hairlineWidth
  },
  fakeBackground: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    zIndex: -1,
    top: 0,
    ...Platform.select({
      web: {
        filter: 'blur(3px)'
      }
    })
  },
  eventInfoContainer: {
    height: 180,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderRadius: 35,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 2.5px rgba(0, 0, 0, 0.1)'
      }
    })
  }
});
