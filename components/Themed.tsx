import { Text as DefaultText, useColorScheme, View as DefaultView } from 'react-native';
import Colors from '../constants/Colors';

export type TextProps = DefaultText['props'];
export type ViewProps = DefaultView['props'];

export function useThemeColor(colorName: keyof typeof Colors.light & keyof typeof Colors.dark) {
  const theme = useColorScheme() ?? 'light';
  return Colors[theme][colorName];
}

export function Text(props: TextProps) {
  const { style, ...otherProps } = props;
  const color = useThemeColor('text');
  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, ...otherProps } = props;

  return <DefaultView style={style} {...otherProps} />;
}
