import { palette } from "./palette";

const Themes = {
  // Feel free to customize these!
  light: {
    bg: palette.lightGray,
    bgSecondary: palette.white,
    text: palette.black,
    textSecondary: palette.white,
    statusBar: "dark-content" as const, // "as const" types this as the string literal "dark-content", rather than the `string` type
    navigation: palette.black,
    border: palette.lightGray,
    shadows: {
      shadowColor: palette.black,
      shadowOpacity: 0.4,
      shadowRadius: 5,
      shadowOffset: { width: -1, height: 5 },
    },
  },
  // Feel free to customize these as well, but be warned that making good-looking
  // dark mode color schemes is trickier than it may seem.
  dark: {
    bg: palette.lightBlack,
    bgSecondary: palette.lighterBlack,
    text: palette.white,
    textSecondary: palette.black,
    statusBar: "light-content" as const,
    navigation: palette.white,
    shadows: {
      shadowColor: palette.black,
      shadowOpacity: 0.4,
      shadowRadius: 5,
      shadowOffset: { width: -1, height: 5 },
    },
  },
};

export default Themes;
