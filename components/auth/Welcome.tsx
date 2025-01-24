import { StyleSheet, Pressable, Platform } from "react-native";
import { router } from "expo-router";
import Colors from "../../constants/Colors";
import { View, Text} from "../../components/Themed";
import NordaDark from '../../assets/svgs/nordadark.svg';
import NordaLight from '../../assets/svgs/nordalight.svg';
import { useSupabase } from "../../context/SupabaseProvider";
import { FeatherIcon } from "../../components/CustomIcons";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { AvailableLocales } from "../../assets/translations/translation";
import Animated, { Easing, FadeIn, ReduceMotion } from "react-native-reanimated";
import PurpleBlob from '../../assets/svgs/blobs/purple.svg';

export default function Welcome({ showLocaleSelector = true, additionalInfoText }: { showLocaleSelector?: boolean, additionalInfoText?: string }) {
  const { i18n, setLanguage, theme } = useSupabase();

  const [selectedLanguage, setSelectedLanguage] = useState<AvailableLocales>();

  useEffect(() => {
    setSelectedLanguage(i18n?.locale as AvailableLocales);
  }, [i18n]);

  const onGoToSignUp = () => {
    router.setParams({ action:'signup' });
  };
  const onGoToLogIn = () => {
    router.setParams({ action:'login' });
  };

  const onSelectedLanguage = (language: AvailableLocales) => {
    if (!i18n) return;
    setSelectedLanguage(language);
    setLanguage(language);
  };

  const style = styles(theme);

  return (
    <View style={style.container}>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <View style={[style.blob, { opacity: theme === 'dark' ? .25 : .45 }]}><PurpleBlob width={280} height={280} /></View>
        <Animated.View style={{ alignItems: 'center', justifyContent: 'center' }} entering={FadeIn.duration(250).easing(Easing.inOut(Easing.quad)).reduceMotion(ReduceMotion.Never)}>
          { theme === 'dark' ? <NordaDark width={165} height={165} /> : <NordaLight width={165} height={165} /> }
        </Animated.View>
      </View>
      <Animated.View entering={FadeIn.duration(350).easing(Easing.inOut(Easing.quad)).reduceMotion(ReduceMotion.Never)} style={style.buttonsContainer}>
        <Pressable onPress={onGoToSignUp} style={style.button}>
          <Text style={style.buttonText}>{ i18n?.t('createAccount') }</Text>
        </Pressable>
        <Pressable onPress={onGoToLogIn} style={style.buttonGhost}>
          <Text style={style.buttonTextGhost}>{ i18n?.t('logIn') }</Text>
        </Pressable>
      </Animated.View>
      { additionalInfoText ?
        <Animated.View entering={FadeIn.duration(250).easing(Easing.inOut(Easing.quad)).reduceMotion(ReduceMotion.Never)} style={[style.additionalInfoContainer, {bottom: showLocaleSelector ? '14%' : '12%'}]}>
          <FeatherIcon name="info" size={18} color='#8C90A3' />
          <Text style={style.additionalInfoText}>{ additionalInfoText }</Text>
        </Animated.View>
      : null }
      { showLocaleSelector ?
        <Animated.View entering={FadeIn.duration(250).easing(Easing.inOut(Easing.quad)).reduceMotion(ReduceMotion.Never)} style={[style.bottomActionContainer, {bottom: additionalInfoText ? 30 : 50}]}>
          <Pressable style={style.languageButton}><FeatherIcon name="globe" size={18} color={Colors[theme].text} /><Text style={style.entryText}>{ i18n?.t('changeLanguage') }</Text></Pressable>
          <Picker
            style={style.languagePicker}
            selectedValue={selectedLanguage}
            onValueChange={(itemValue) => onSelectedLanguage(itemValue)}
          >
            <Picker.Item label="Català" value="ca" />
            <Picker.Item label="Castellano" value="es" />
            <Picker.Item label="English" value="en" />
          </Picker>
        </Animated.View>
      : null }
    </View>
  );
}

const styles = (theme: string) => StyleSheet.create({
  container: {
    height: '100%',
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10%'
  },
  blob: {
    position: 'absolute',
    zIndex: -1,
    ...Platform.select({
      web: {
        filter: 'blur(65px);'
      },
      ios: {},
      android: {}
    })
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 25,
    paddingHorizontal: 25
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
  buttonGhost: {
    borderRadius: 15,
    paddingVertical: 11,
    paddingHorizontal: 25,
    width: '100%',
    maxWidth: 300,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors[theme].text
  },
  buttonTextGhost: {
    fontWeight: '500',
    fontSize: 18,
    textAlign: 'center',
    color: Colors[theme].text
  },
  bottomActionContainer: {
    position: 'absolute'
  },
  languageButton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  entryText: {
    fontSize: 16
  },
  additionalInfoContainer: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 265
  },
  additionalInfoText: {
    fontSize: 16,
    color: '#8C90A3'
  },
  languagePicker: {
    position: 'absolute',
    width: '100%',
    opacity: 0
  }
});