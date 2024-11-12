import { useEffect } from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
// import { WebView } from 'react-native-webview'; // Install package when adding support to ios and android
import { View, Text } from '../../../../components/Themed';
import GoBackArrow from '../../../../components/GoBackArrow';
import { FeatherIcon } from '../../../../components/CustomIcons';
import Colors from '../../../../constants/Colors';
import { useSupabase } from '../../../../context/SupabaseProvider';
import { useEventScreens } from '../../../../context/EventScreensProvider';

export default function AuthModalScreen() {
  const { i18n, theme } = useSupabase();
  const { eventBackgroundColor, formUrl, Ds_MerchantParameters, Ds_Signature, Ds_SignatureVersion, cardNumber, expiryDate } = useEventScreens();

  useEffect(() => {
  }, []);
  
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
        <View style={styles.welcomeContainer}>
          <Text style={{color: 'red'}}>welcome screen here! create components so it can be reused here and in the actual (auth) screens</Text>
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
  containerStyle: {
    width: '100%',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25
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
    width: '100%',
    height: 'auto',
    flex: 1,
    borderRadius: 25,
    borderWidth: 0,
    backgroundColor: 'white'
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
