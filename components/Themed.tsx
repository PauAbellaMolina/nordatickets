import { Text as DefaultText, View as DefaultView } from 'react-native';
import Colors from '../constants/Colors';
import { useSupabase } from '../context/SupabaseProvider';

export type TextProps = DefaultText['props'];
export type ViewProps = DefaultView['props'];

export function Text(props: TextProps) {
  const { theme } = useSupabase();
  const { style, ...otherProps } = props;

  return <DefaultText style={[{ color: Colors[theme].text }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, ...otherProps } = props;

  return <DefaultView style={style} {...otherProps} />;
}
