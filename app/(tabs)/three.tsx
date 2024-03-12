import { Pressable, StyleSheet, useColorScheme } from 'react-native';
import { Text, View } from '../../components/Themed';
import { useEffect, useState } from 'react';
import { FeatherIcon } from '../../components/CustomIcons';
import Colors from '../../constants/Colors';
import { supabase } from "../../supabase";
import { useSupabase } from '../../context/SupabaseProvider';
import { router } from 'expo-router';

export default function TabThreeScreen() {
  const theme = useColorScheme() ?? 'light';
  const { user, signOut } = useSupabase();
  const [card, setCard] = useState<string>();

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
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      <View style={styles.wrapper}>
        <View style={styles.userInfo}>
          <View style={styles.singleLineContainer}><Text>{user?.email}</Text></View>
          { card ?
            <View style={styles.singleLineContainer}><Text>Tarjeta de crèdit guardada: {card.slice(9, card.length)}  ·  </Text><Pressable onPress={onDeleteUserCard}><Text style={{color: '#ff3737'}}>Eliminar</Text></Pressable></View>
          : null }
        </View>
        <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
        <View style={styles.entriesContainer}>
          <Pressable style={styles.entryButton} onPress={() => router.push('/profile/receipts')}><FeatherIcon name="file-text" size={18} color={Colors[theme].text} /><Text style={styles.entryText}>Rebuts de compra</Text></Pressable>
          <Pressable style={styles.entryButton} onPress={() => signOut()}><FeatherIcon name="log-out" size={18} color={Colors[theme].text} /><Text style={styles.entryText}>Tancar sessió</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingTop: 60,
    paddingBottom: 5,
    paddingHorizontal: 15,
    flex: 1
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold'
  },
  wrapper: {
    backgroundColor: 'transparent',
    marginTop: 30,
    marginHorizontal: 10,
    alignItems: 'flex-start',
    gap: 30
  },
  userInfo: {
    backgroundColor: 'transparent',
    width: '100%',
    gap: 15
  },
  separator: {
    marginVertical: 5,
    height: 1,
    width: '80%'
  },
  singleLineContainer: {
    backgroundColor: 'transparent',
    flexDirection: 'row'
  },
  entriesContainer: {
    backgroundColor: 'transparent',
    width: '100%',
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
  }
});
