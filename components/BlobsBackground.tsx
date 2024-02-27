import { View, StyleSheet } from "react-native";
import BlueBlob from '../assets/svgs/blobs/blue.svg';
import RedBlob from '../assets/svgs/blobs/red.svg';
import OrangeBlob from '../assets/svgs/blobs/orange.svg';
import YellowBlob from '../assets/svgs/blobs/yellow.svg';

export default function BlobsBackground({ children, style }) {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.blob, styles.orangeBlob]}><OrangeBlob width={185} height={185} /></View>
      <View style={[styles.blob, styles.blueBlob]}><BlueBlob width={230} height={230} /></View>
      <View style={[styles.blob, styles.yellowBlob]}><YellowBlob width={70} height={70} /></View>
      <View style={[styles.blob, styles.redBlob]}><RedBlob width={400} height={400} /></View>
      
      { children }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    height: '100%',
    backgroundColor: 'transparent',
  },
  blob: {
    position: 'absolute',
    backgroundColor: 'transparent',
    zIndex: -1
  },
  orangeBlob: {
    top: -50,
    left: -50
  },
  blueBlob: {
    top: '20%',
    right: -140
  },
  yellowBlob: {
    bottom: '15%',
    right: 30
  },
  redBlob: {
    bottom: -220,
    left: -190
  }
});