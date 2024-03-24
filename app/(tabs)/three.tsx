import { Pressable, StyleSheet, useColorScheme } from 'react-native';
import { Text, View } from '../../components/Themed';
import { useEffect, useState } from 'react';
import { FeatherIcon } from '../../components/CustomIcons';
import Colors from '../../constants/Colors';
import { supabase } from "../../supabase";
import { useSupabase } from '../../context/SupabaseProvider';
import { router } from 'expo-router';
import { AvailableLocales } from '../../assets/translations/translation';
import { Picker } from '@react-native-picker/picker';

export default function TabThreeScreen() {
  const theme = useColorScheme() ?? 'light';
  const { user, signOut, i18n, setLanguage } = useSupabase();
  const [card, setCard] = useState<string>();
  const [selectedLanguage, setSelectedLanguage] = useState<AvailableLocales>();

  useEffect(() => {
    if (!user) return;
    supabase.from('users').select().eq('id', user?.id)
    .then(({ data: users, error }) => {
      if (error) return;
      setCard(users[0].card_number);
    });
  }, [user]);

  const onDeleteUserCard = () => {
    supabase.from('users')
    .update({
      redsys_token: null,
      card_number: null,
      expiry_date: null
    })
    .eq('id', user?.id)
    .then(({ error }) => {
      if (error) return;
      setCard(undefined);
    });
  };

  const onSelectedLanguage = (language: AvailableLocales) => {
    if (!i18n) return;
    setSelectedLanguage(language);
    setLanguage(language);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{ i18n?.t('profile') }</Text>
      <View style={styles.wrapper}>
        <View style={styles.userInfo}>
          <View style={styles.singleLineContainer}><Text>{user?.email}</Text></View>
          { card ?
            <View style={styles.singleLineContainer}><Text>{ i18n?.t('savedCreditCard') }: {card.slice(9, card.length)}  ·  </Text><Pressable onPress={onDeleteUserCard}><Text style={{color: '#ff3737'}}>{ i18n?.t('delete') }</Text></Pressable></View>
          : null }
        </View>
        <View style={[styles.separator, {backgroundColor: Colors[theme].separatorBackgroundColor}]} />
        <View style={styles.entriesContainer}>
          <Pressable style={styles.entryButton} onPress={() => router.push('/profile/receipts')}><FeatherIcon name="file-text" size={18} color={Colors[theme].text} /><Text style={styles.entryText}>{ i18n?.t('buyReceipts') }</Text></Pressable>
          <View>
            <Pressable style={styles.entryButton}><FeatherIcon name="globe" size={18} color={Colors[theme].text} /><Text style={styles.entryText}>{ i18n?.t('changeLanguage') }</Text></Pressable>
            <Picker
              style={styles.languagePicker}
              selectedValue={selectedLanguage}
              onValueChange={(itemValue) => onSelectedLanguage(itemValue)
            }>
              <Picker.Item label="Català" value="ca" />
              <Picker.Item label="Castellano" value="es" />
              <Picker.Item label="English" value="en" />
            </Picker>
          </View>
          <Pressable style={styles.entryButton} onPress={() => signOut()}><FeatherIcon name="log-out" size={18} color={Colors[theme].text} /><Text style={styles.entryText}>{ i18n?.t('logOut') }</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 30,
    paddingBottom: 5,
    paddingHorizontal: 15,
    flex: 1
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold'
  },
  wrapper: {
    marginTop: 30,
    marginHorizontal: 10,
    alignItems: 'flex-start',
    gap: 30
  },
  userInfo: {
    width: '100%',
    gap: 15
  },
  separator: {
    marginVertical: 5,
    height: 1,
    width: '80%'
  },
  singleLineContainer: {
    flexDirection: 'row'
  },
  entriesContainer: {
    gap: 30
  },
  entryButton: {
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
