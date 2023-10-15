import { View, Text} from "../../components/Themed";
import { StyleSheet, ActivityIndicator } from "react-native";

export default function LoadingApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tickets MVP</Text>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 80,
    paddingTop: 30,
    paddingHorizontal: 15,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 50,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});