// IMPORTING things we need!
// View, Text, Image, and StyleSheet are core building blocks for React Native apps.
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

// EXPORTING something we build!
// Remember, UI Components are functions under the hood and they return JSX (UI). This App component returns a "SafeAreaView" with more components nested underneath.
export default function App() {
  // Feel free to edit anything starting here! --------------------------------------------
  const welcomeMessage: string = "Welcome to CS 147L!";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{welcomeMessage}</Text>
      <Text style={styles.paragraph}>
        Change code in App.tsx and watch it change on your phone.
      </Text>
      <View style={styles.imageContainer}>
        <Image style={styles.logo} source={require('./assets/snack-icon.png')} />
        <Image style={styles.logo} source={require('./assets/snack-icon.png')} />
        <Image style={styles.logo} source={require('./assets/snack-icon.png')} />
      </View>
    </View>
  );
}


// STYLING for our app!
// Here, we define all the styling that we use in our app. 
// The format is always "const styles = StyleSheet.create({...})". 
// The "styles" object contains style objects. We can access a style X with "styles.X". 
// We will learn more about styles and the "StyleSheet" component next Tuesday :-)
const styles = StyleSheet.create({
  container: {
    flex: 1, // We'll learn about "flex" and other flexbox properties in class!
    flexDirection: 'column', // Try: 'row' or 'column'
    alignItems: 'center', // Try: 'flex-start' or 'center' or 'flex-end' 
    justifyContent: 'center', // Try: 'flex-start' or 'flex-end' or 'space-between' or 'space-around' or 'space evenly'
    backgroundColor: '#ecf0f1', // Try different color hex codes!
    padding: 8, // Try changing this value!
  },
  imageContainer: {
    flexDirection: 'row',
  },
  title: {
    fontSize: 24, // Try changing this value!
    fontWeight: 'bold', // Try: 'light' or 'normal' or 'bold'
    textAlign: 'center',
  },
  paragraph: {
    // Try changing these values!
    margin: 24,
    fontSize: 18,
    textAlign: 'center',
  },
  logo: {
    // Try changing these values!
    height: 64,
    width: 64,
    margin: 8,
  },
});