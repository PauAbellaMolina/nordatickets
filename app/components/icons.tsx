import { FontAwesome, Feather } from '@expo/vector-icons'; 

// TODO PAU info available icons here -> https://icons.expo.fyi/
export default function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export function FontAwesomeIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  size: number;
}) {
  return <FontAwesome {...props} />;
}

export function FeatherIcon(props: {
  name: React.ComponentProps<typeof Feather>['name'];
  color: string;
  size: number;
}) {
  return <Feather {...props} />;
}