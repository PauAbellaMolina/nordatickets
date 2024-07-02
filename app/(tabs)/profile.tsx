import { Pressable, StyleSheet } from 'react-native';
import { Text, View } from '../../components/Themed';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FeatherIcon } from '../../components/CustomIcons';
import Colors from '../../constants/Colors';
import { supabase } from "../../supabase";
import { useSupabase } from '../../context/SupabaseProvider';
import { router, useFocusEffect } from 'expo-router';
import { AvailableLocales } from '../../assets/translations/translation';
import { Picker } from '@react-native-picker/picker';

export default function TabThreeScreen() {
  const { user, signOut, i18n, setLanguage, theme } = useSupabase();
  const [card, setCard] = useState<string>();
  const [expiryDate, setExpiryDate] = useState<string>();
  const [selectedLanguage, setSelectedLanguage] = useState<AvailableLocales>();

  let triggerNextFocus = useRef<boolean>(true);

  useFocusEffect(
    useCallback(() => {
      let unmounted = false;
      if (triggerNextFocus.current) {
        if (!user) return;
        fetchUser(unmounted);
      }

      return () => {
        unmounted = true;
        triggerNextFocus.current = false;
        setTimeout(() => {
          triggerNextFocus.current = true;
        }, 10000); //This is to prevent fetching every time we focus, just fetching when focused and after every 10 seconds
      };
    }, [user])
  );

  useEffect(() => {
    if (!user) return;
    setSelectedLanguage(i18n?.locale as AvailableLocales);
  }, [user, i18n]);

  const fetchUser = (unmounted: boolean) => {
    if (!user) return;
    supabase.from('users').select().eq('id', user?.id).single()
    .then(({ data: user, error }) => {
      if (unmounted || error || !user) return;
      setCard(user.card_number);
      if (user.expiry_date) {
        setExpiryDate(user.expiry_date.toString().slice(2) + '/' + user.expiry_date.toString().slice(0, 2));
      }
    });
  };

  const onDeleteUserCard = () => {
    supabase.rpc('delete_secret', { secret_name: user?.id })
    .then(({ data: secret_uuid, error }) => {
      if (!error && secret_uuid) {
        supabase.from('users')
        .update({
          card_number: null,
          expiry_date: null
        })
        .eq('id', user?.id)
        .then(({ error }) => {
          if (error) return;
          setCard(undefined);
          setExpiryDate(undefined);
        });
      }
    });
  };

  const onSelectedLanguage = (language: AvailableLocales) => {
    if (!i18n) return;
    setSelectedLanguage(language);
    setLanguage(language);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{ i18n?.t('profile') }</Text>
          <Text style={styles.infoLabel}>{ i18n?.t('infoAboutYou') }</Text>
        </View>
      </View>
      <View style={styles.profileContainer}>
        <Text style={styles.infoTitle}>{ i18n?.t('emailAndPaymentMethods') }</Text>
        <View style={styles.userInfo}>
          <View style={styles.singleLineContainer}>
            <FeatherIcon name="at-sign" size={18} color={Colors[theme].text} />
            <Text>{user?.email}</Text>
          </View>
          { card ?
            <View style={styles.singleLineContainer}>
              <FeatherIcon name="credit-card" size={18} color={Colors[theme].text} />
              <View style={styles.cardLineContainer}>
                <Text>{card}  ·  </Text>
                <Pressable onPress={onDeleteUserCard}>
                  <Text style={{color: '#ff3737'}}>{ i18n?.t('delete') }</Text>
                </Pressable>
              </View>
            </View>
          : expiryDate ?
            <View style={styles.singleLineContainer}>
              <FeatherIcon name="credit-card" size={18} color={Colors[theme].text} />
              <View style={styles.cardLineContainer}>
                <Text>{ i18n?.t('cardWithExpiryDate') }: {expiryDate}  ·  </Text>
                <Pressable onPress={onDeleteUserCard}>
                  <Text style={{color: '#ff3737'}}>{ i18n?.t('delete') }</Text>
                </Pressable>
              </View>
            </View>
          : null }
        </View>
        <View style={[styles.separator, {backgroundColor: Colors[theme].separatorBackgroundColor}]} />
        <View style={styles.entriesContainer}>
          <Pressable style={styles.entryButton} onPress={() => router.navigate('/profile/receipts')}><FeatherIcon name="file-text" size={18} color={Colors[theme].text} /><Text style={styles.entryText}>{ i18n?.t('purchaseReceipts') }</Text></Pressable>
          <Pressable style={styles.entryButton} onPress={() => router.navigate('/profile/help')}><FeatherIcon name="help-circle" size={18} color={Colors[theme].text} /><Text style={styles.entryText}>{ i18n?.t('helpAndFaqs') }</Text></Pressable>
          <Pressable style={styles.entryButton} onPress={() => router.navigate('/profile/terms')}><FeatherIcon name="info" size={18} color={Colors[theme].text} /><Text style={styles.entryText}>{ i18n?.t('termsAndPrivacy') }</Text></Pressable>
          <View>
            <Pressable style={styles.entryButton}><FeatherIcon name="globe" size={18} color={Colors[theme].text} /><Text style={styles.entryText}>{ i18n?.t('changeLanguage') }</Text></Pressable>
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
          <Pressable style={styles.entryButton} onPress={() => signOut()}><FeatherIcon name="log-out" size={18} color={Colors[theme].text} /><Text style={styles.entryText}>{ i18n?.t('logOut') }</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingBottom: 95,
    paddingHorizontal: 15,
    flex: 1,
    overflow: 'scroll'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 10
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  infoLabel: {
    fontSize: 13,
    marginLeft: 2,
    color: '#8C90A3'
  },
  profileContainer: {
    marginTop: 20,
    marginHorizontal: 5,
    alignItems: 'flex-start'
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  userInfo: {
    width: '100%',
    gap: 10,
    marginTop: 15,
    marginHorizontal: 5
  },
  separator: {
    marginTop: 22,
    marginBottom: 25,
    height: 1,
    width: '80%'
  },
  singleLineContainer: {
    flexDirection: 'row',
    gap: 8
  },
  cardLineContainer: {
    flexDirection: 'row'
  },
  entriesContainer: {
    gap: 25
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
