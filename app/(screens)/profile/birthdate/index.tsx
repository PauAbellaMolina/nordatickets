import { Text, View } from '../../../../components/Themed';
import GoBackArrow from '../../../../components/GoBackArrow';
import { ActivityIndicator, Platform, Pressable, StyleSheet } from 'react-native';
import { useSupabase } from '../../../../context/SupabaseProvider';
import Colors from '../../../../constants/Colors';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../supabase';
import { router } from 'expo-router';

export default function BirthdateScreen() {
  const { i18n, theme, user } = useSupabase();
  
  const [birthdate, setBirthdate] = useState<string>(null);
  const [userBirthdate, setUserBirthdate] = useState<string>(undefined);

  useEffect(() => {
    if (!user) return;
    setUserBirthdate(user.user_metadata?.birthdate ?? null);
  }, [user]);

  const onSaveBirthdate = () => {
    if (!birthdate || !user || user.user_metadata?.birthdate) return;
    supabase.auth.updateUser({
      data: {
        birthdate: birthdate
      }
    })
    .then(({ data: user, error }) => {
      if (error || !user) return;
      router.back();
    });
  };

  return (
    <View style={[styles.container, {paddingTop: userBirthdate ? 75 : 10}]}>
      { userBirthdate === undefined ?
        <ActivityIndicator size="large" style={{marginTop: 50}} />
      : <>
        { userBirthdate ? 
          <GoBackArrow light={theme === 'dark'} />
        : null }
        <Text style={styles.title}>{ i18n?.t('needYourBirthdateTitle') }</Text>
        <View style={styles.wrapper}>
          { !userBirthdate ? <>
            { Platform.OS === 'web' ?
              <View style={styles.datepickerWrapper}>
                <Text style={styles.datepickerTitle}>{ i18n?.t('birthdate') }:</Text>
                <input style={theme === 'light' ? styles.datepickerLight : styles.datepickerDark} type="date" id="birthdate" name="birthdate" value={birthdate || ''} onChange={(e) => setBirthdate(e.target.value)} />
              </View>
            : null }
            <Pressable
              disabled={!birthdate}
              onPress={onSaveBirthdate}
              style={[styles.button, {backgroundColor: Colors[theme].text, opacity: !birthdate ? 0.5 : 1}]}
            >
              <Text style={[styles.buttonText, {color: Colors[theme].oppositeThemeText}]}>{ i18n?.t('save') }</Text>
            </Pressable>
          </> : <>
            <Text style={styles.text}>{ i18n?.t('alreadyHaveSetBirthdateTitle') }:</Text>
            <Text style={styles.text}>{new Date(userBirthdate).toLocaleDateString()}</Text>
            <Text style={styles.text}>{ i18n?.t('ifIncorrectGetInContactWithHelp') }</Text>
          </> }
        </View>
      </> }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 25,
    paddingHorizontal: 15,
    flex: 1,
    overflow: 'scroll'
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold'
  },
  text: {
    fontSize: 16
  },
  wrapper: {
    marginTop: 30,
    marginHorizontal: 2,
    display: 'flex',
    gap: 10
  },
  datepickerWrapper: {
    width: '100%',
    maxWidth: 300,
    gap: 2
  },
  datepickerTitle: {
    fontSize: 16,
    opacity: 0.7,
    marginHorizontal: 8
  },
  datepickerLight: {
    minWidth: '90%',
    fontSize: 16,
    padding: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderStyle: 'solid',
    backgroundColor: '#E8E8E8BF',
    borderColor: '#20222833',
    color: '#202228'
  },
  datepickerDark: {
    minWidth: '90%',
    fontSize: 16,
    padding: 11.25,
    borderRadius: 15,
    borderWidth: 1,
    borderStyle: 'solid',
    backgroundColor: '#181818BF',
    borderColor: '#FCFCFC33',
    color: '#FCFCFC'
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
  }
});