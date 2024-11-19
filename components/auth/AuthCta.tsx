import { Pressable, StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';
import { router } from 'expo-router';
import { useSupabase } from '../../context/SupabaseProvider';
import { View, Text } from '../Themed';

export default function AuthCta({ text, horizontalButtons }: { text?: string, horizontalButtons?: boolean }) {
  const { theme, i18n } = useSupabase();

  const onGoToSignUp = () => {
    router.push('/welcome?action=signup');
  };
  const onGoToLogIn = () => {
    router.push('/welcome?action=login');
  };

  return (
    <View style={styles.container}>
      { text && <Text style={styles.text}>{text}</Text> }
      <View style={[styles.buttonsContainer, horizontalButtons && styles.horizontalButtonsContainer]}>
        <Pressable 
          onPress={onGoToSignUp} 
          style={[styles.button, {backgroundColor: Colors[theme].text}]}
        >
          <Text style={[styles.buttonText, {color: Colors[theme].oppositeThemeText}]}>
            {i18n?.t('createAccount')}
          </Text>
        </Pressable>
        <Text style={styles.orText}>O</Text>
        <Pressable 
          onPress={onGoToLogIn} 
          style={[styles.button, {borderWidth: StyleSheet.hairlineWidth, borderColor: Colors[theme].text}]}
        >
          <Text style={[styles.buttonText, {color: Colors[theme].text}]}>
            {i18n?.t('logIn')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    fontSize: 16,
    textAlign: 'center'
  },
  buttonsContainer: {
    gap: 5
  },
  horizontalButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  button: {
    borderRadius: 9,
    paddingVertical: 5,
    paddingHorizontal: 19,
    maxWidth: 300
  },
  buttonText: {
    fontWeight: '500',
    fontSize: 16,
    textAlign: 'center'
  },
  orText: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: 'bold'
  }
});
