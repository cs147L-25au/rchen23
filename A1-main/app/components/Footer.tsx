import {
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";
import { Icons, Themes } from "../../assets/Themes";

const Footer = () => {
  return (
    <View style={styles.navigationContainer}>
      <Image source={Icons.discover.light} />
      <Text>Discover</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  navigationContainer: {
    flexDirection: "row",
    backgroundColor: Themes.light.navigation,
  },
  // add more styles for other components!
});

export default Footer;
