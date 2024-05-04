import { ColorSchemeName } from "react-native";
import Colors from "../constants/Colors";

export const getThemeRandomColor = (theme: ColorSchemeName): string => {
  const colors = Colors.utilBackgroundColorsArray[theme]
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
};