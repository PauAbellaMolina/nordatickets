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

  const style = styles(theme);

  return (
    <View style={style.container}>
      { text && <Text style={style.text}>{text}</Text> }
      <View style={[style.buttonsContainer, horizontalButtons && style.horizontalButtonsContainer]}>
        <Pressable 
          onPress={onGoToSignUp} 
          style={style.button}
        >
          <Text style={style.buttonText}>
            {i18n?.t('createAccount')}
          </Text>
        </Pressable>
        <Text style={style.orText}>O</Text>
        <Pressable 
          onPress={onGoToLogIn} 
          style={style.buttonGhost}
        >
          <Text style={style.buttonTextGhost}>
            {i18n?.t('logIn')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = (theme: string) => StyleSheet.create({
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
    maxWidth: 300,
    backgroundColor: Colors[theme].text
  },
  buttonGhost: {
    borderRadius: 9,
    paddingVertical: 5,
    paddingHorizontal: 19,
    maxWidth: 300,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors[theme].text
  },
  buttonText: {
    fontWeight: '500',
    fontSize: 16,
    textAlign: 'center',
    color: Colors[theme].oppositeThemeText
  },
  buttonTextGhost: {
    fontWeight: '500',
    fontSize: 16,
    textAlign: 'center',
    color: Colors[theme].text
  },
  orText: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: 'bold'
  }
});
