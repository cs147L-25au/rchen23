import { 
  View, 
  StyleSheet, 
  Image 
} from "react-native";
import Profiles from "../../assets/Profiles";

const Body = () => {
  return (
    <View style={styles.container}>
      <Image
        source={Profiles.landay.image}
        style={styles.image}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // fill this in!
  },
  image: {
    height: 300, // feel free to adjust this!
    aspectRatio: 1,
  },
  // add more styles for other components!
});

export default Body;
