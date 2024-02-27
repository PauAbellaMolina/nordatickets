import { Pressable, StyleSheet, useColorScheme } from 'react-native';
import { Text, View } from '../../components/Themed';
import { useEffect, useState } from 'react';
import { FeatherIcon } from '../../components/CustomIcons';
import Colors from '../../constants/Colors';
import { supabase } from "../../supabase";
import { useSupabase } from '../../context/SupabaseProvider';

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

  const onLogOut = () => {
    signOut();
  };

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
        <View style={styles.singleLineContainer}><Text>{user?.email}</Text></View>
        { card ?
          <View style={styles.singleLineContainer}><Text>Tarjeta de crèdit guardada: {card.slice(9, card.length)}  ·  </Text><Pressable onPress={onDeleteUserCard}><Text style={{color: '#ff3737'}}>Eliminar</Text></Pressable></View>
        : null }
        <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
        <Pressable style={styles.logOutButton} onPress={onLogOut}><FeatherIcon name="log-out" size={18} color={Colors[theme].text} /><Text style={styles.logOutText}>Tancar sessió</Text></Pressable>
        {/* TODO PAU add terms & conditions link to page and get in contact/support email */}
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
  logOutButton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  logOutText: {
    textDecorationLine: 'underline',
    fontSize: 16
  }
});
