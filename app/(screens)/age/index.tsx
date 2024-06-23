import { ActivityIndicator, Platform, Pressable, StyleSheet } from 'react-native';
import { View, Text } from "../../../components/Themed";
import { useSupabase } from '../../../context/SupabaseProvider';
import Colors from '../../../constants/Colors';
import { supabase } from '../../../supabase';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';

export default function AgeScreen() {
  const { user, i18n, theme } = useSupabase();
  const [loaded, setLoaded] = useState<boolean>(false);
  const [birthdate, setBirthdate] = useState<string>();
  const [localBirthdate, setLocalBirthdate] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    let unmounted = false;
    supabase.from('users').select().eq('id', user?.id).single()
    .then(({ data: user, error }) => {
      if (!unmounted && !error && user && user.birthdate) {
        setBirthdate(user.birthdate.split('-').reverse().join('-'));
      }
      setLoaded(true);
    });

    return () => {
      unmounted = true;
    };
  }, [user]);

  const handleSaveBirthdate = () => {
    if (Platform.OS === 'web') {
      supabase.from('users').update({ birthdate: localBirthdate }).eq('id', user?.id).select().single()
      .then(({ data: user, error }) => {
        setBirthdate(user.birthdate.split('-').reverse().join('-'));
      });
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          {/* TODO PAU new translation keys */}
          <Text style={styles.title}>Configuració necessaria</Text>
        </View>
      </View>
      <View style={styles.datepickerContainer}>
        { !loaded ? <>
          {/* TODO PAU center spinner */}
          <ActivityIndicator size="small" />
        </> : <>
          { birthdate ? <>
            <Text style={{color: Colors[theme].text}}>Si la data de naixement és incorrecta podeu contactar a help@elteutikt.com per actualitzar-la.</Text>
            <Text style={[styles.setBirthdate, {color: Colors[theme].text}]}>Data de naixement: {birthdate}</Text>
            <Pressable onPress={() => router.push('/')}  style={[styles.button, {backgroundColor: Colors[theme].text}]}>
              <Text style={[styles.buttonText, {color: Colors[theme].oppositeThemeText}]}>Continuar</Text>
            </Pressable>
          </> : <>
            { Platform.OS === 'web' ? <>
              <input type="date" id="birthday" name="birthday" value={localBirthdate} onChange={(e) => setLocalBirthdate(e.target.value)} />
              <Pressable onPress={handleSaveBirthdate}  style={[styles.button, {backgroundColor: Colors[theme].text}]}>
                <Text style={[styles.buttonText, {color: Colors[theme].oppositeThemeText}]}>Guardar</Text>
              </Pressable>
            </> : null }
          </> }
        </> }
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
  setBirthdate: {
    fontSize: 18
  },
  datepickerContainer: {
    marginTop: 20,
    marginHorizontal: 5,
    alignItems: 'flex-start',
    gap: 20
  },
  button: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 20
  },
  buttonText: {
    fontWeight: '500',
    fontSize: 16,
    textAlign: 'center'
  },
});