import { StyleSheet, useColorScheme, Pressable } from "react-native";
import { router, useGlobalSearchParams } from "expo-router";
import Colors from "../../constants/Colors";
import { View, Text} from "../../components/Themed";
import TiktDark from '../../assets/svgs/tiktdark.svg';
import TiktLight from '../../assets/svgs/tiktlight.svg';
import BlobsBackground from "../../components/BlobsBackground";
import { useSupabase } from "../../context/SupabaseProvider";
import { FeatherIcon } from "../../components/CustomIcons";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { AvailableLocales } from "../../assets/translations/translation";

export default function Welcome() {
  const theme = useColorScheme() ?? 'light';
  const { i18n, setLanguage } = useSupabase();
  const params = useGlobalSearchParams();

  const [selectedLanguage, setSelectedLanguage] = useState<AvailableLocales>();

  useEffect(() => {
    setSelectedLanguage(i18n?.locale as AvailableLocales);
  }, [i18n]);

  const onGoToSignUp = () => {
    router.navigate('/signup');
    router.setParams(params as Record<string, string>);
  };
  const onGoToLogIn = () => {
    router.navigate('/login');
    router.setParams(params as Record<string, string>);
  };

  const onSelectedLanguage = (language: AvailableLocales) => {
    if (!i18n) return;
    setSelectedLanguage(language);
    setLanguage(language);
  }

  return (
    <BlobsBackground style={styles.container}>
      { theme === 'dark' ? <TiktDark width={175} height={175} /> : <TiktLight width={175} height={175} /> }
      <View style={styles.buttonsContainer}>
        <Pressable onPress={onGoToSignUp} style={[styles.button, {backgroundColor: Colors[theme].text}]}>
          <Text style={[styles.buttonText, {color: Colors[theme].oppositeThemeText}]}>{ i18n?.t('createAccount') }</Text>
        </Pressable>
        <Pressable onPress={onGoToLogIn} style={[styles.button, {borderWidth: 1, borderColor: Colors[theme].text}]}>
          <Text style={[styles.buttonText, {color: Colors[theme].text}]}>{ i18n?.t('logIn') }</Text>
        </Pressable>
      </View>
      <View style={styles.bottomActionContainer}>
        <Pressable style={styles.languageButton}><FeatherIcon name="globe" size={18} color={Colors[theme].text} /><Text style={styles.entryText}>{ i18n?.t('changeLanguage') }</Text></Pressable>
        <Picker
          style={styles.languagePicker}
          selectedValue={selectedLanguage}
          onValueChange={(itemValue) => onSelectedLanguage(itemValue)}
        >
          <Picker.Item label="Català" value="ca" />
          <Picker.Item label="Castellano" value="es" />
          <Picker.Item label="English" value="en" />
        </Picker>
      </View>
    </BlobsBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 50,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 100
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
    maxWidth: 300
  },
  buttonText: {
    fontWeight: '500',
    fontSize: 18,
    textAlign: 'center'
  },
  bottomActionContainer: {
    position: 'absolute',
    bottom: 50
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
  languagePicker: {
    position: 'absolute',
    width: '100%',
    opacity: 0
  }
});