// const tintColorLight = '#2f95dc';
// const tintColorDark = '#fff';

// export default {
//   light: {
//     text: '#000',
//     background: '#fff',
//     tint: tintColorLight,
//     tabIconDefault: '#ccc',
//     tabIconSelected: tintColorLight,
//   },
//   dark: {
//     text: '#fff',
//     background: '#000',
//     tint: tintColorDark,
//     tabIconDefault: '#ccc',
//     tabIconSelected: tintColorDark,
//   },
// };

export default {
  light: {
    // text: '#000000',
    text: '#202228',
    // background: '#f2f2f2',
    background: '#ffffff',
    backgroundHalfOpacity: '#ffffff40',
    // background: '#EFEFEF', //TODO PAU info react default background color
    backgroundContrast: '#f2f2f2',
    tabBarBackground: '#613AC5', //#161311
    tint: '#ff7f50',
    tabIconInactive: '#CDC2EE',
    tabIconActive: '#ffffff',
    tabIconActiveBackground: '#7958CE', // #57D8AB
    cardContainerBackground: '#D4C5FD',
    cardContainerBackgroundContrast: '#7761C4'
  },
  dark: {
    // text: '#ffffff',
    text: '#FCFCFC',
    background: '#000000',
    backgroundHalfOpacity: '#00000040',
    backgroundContrast: '#1a1a1a',
    tabBarBackground: '#613AC5', //#161311
    tint: '#ff7f50',
    tabIconInactive: '#CDC2EE',
    tabIconActive: '#ffffff',
    tabIconActiveBackground: '#7958CE', // #57D8AB
    cardContainerBackground: '#251847',
    cardContainerBackgroundContrast: '#CDC2EE'
  },
  // eventCardBackgroundColorsArray: ['#C8F2CA', '#ABE1F4', '#EEF0A2', '#79D6F4', '#A9E8F3', '#F3F7BF', '#CEFDAC', '#CCF0F3', '#F4F9C0', '#D5F8F2', '#E2F5F0', '#FFF7CC']
  eventBackgroundColorsArray: {
    dark: ['#C8F2CAC4', '#AEE6F9C4', '#D4C5FDC4', '#FBE3BDC4', '#E7E99EC4'],
    light: ['#C8F2CA', '#AEE6F9', '#D4C5FD', '#FBE3BD', '#E7E99E']
  }
};
