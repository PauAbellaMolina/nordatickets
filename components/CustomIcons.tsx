import { FontAwesome, Feather, Entypo } from '@expo/vector-icons'; 

//PAU info available icons here -> https://icons.expo.fyi/
export default function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export function EntypoIcon(props: {
  name: React.ComponentProps<typeof Entypo>['name'];
  color: string;
  size: number;
  opacity?: number;
}) {
  return <Entypo {...props} style={{ opacity: props.opacity ?? 1 }} />;
}

export function FontAwesomeIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  size: number;
  opacity?: number;
}) {
  return <FontAwesome {...props} style={{ opacity: props.opacity ?? 1 }} />;
}

export function FeatherIcon(props: {
  name: React.ComponentProps<typeof Feather>['name'];
  color: string;
  size: number;
  opacity?: number;
}) {
  return <Feather {...props} style={{ opacity: props.opacity ?? 1 }} />;
}