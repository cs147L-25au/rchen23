import { StyleSheet, Text, View, Image } from "react-native";
import React, { useState } from "react";

const feedIcon = require("../../assets/Icons/feed_icon.png");
const listIcon = require("../../assets/Icons/list_icon.png");
const playIcon = require("../../assets/Icons/play_button.png");
const trophyIcon = require("../../assets/Icons/leader_icon.png");
const settingsIcon = require("../../assets/Icons/setting_icon.png");

const NavBar = () => {
  return (
    <View style={styles.navigationContainer}>
      <View style={styles.iconBox}>
        <View style={styles.navigationItem}>
          <Image style={styles.navigationIcons} source={feedIcon} />
          <Text style={styles.iconTexts}>Feed</Text>
        </View>
        <View style={styles.navigationItem}>
          <Image style={styles.navigationIcons} source={listIcon} />
          <Text style={styles.iconTexts}>List</Text>
        </View>
        <View style={styles.navigationItem}>
          <Image style={styles.navigationIcons} source={playIcon} />
          <Text style={styles.iconTexts}>Play</Text>
        </View>
        <View style={styles.navigationItem}>
          <Image style={styles.navigationIcons} source={trophyIcon} />
          <Text style={styles.iconTexts}>Leaderboard</Text>
        </View>
        <View style={styles.navigationItem}>
          <Image style={styles.navigationIcons} source={settingsIcon} />
          <Text style={styles.iconTexts}>Settings</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navigationContainer: {
    display: "flex",
    flexDirection: "row",
    backgroundColor: "#ffffffff",
    borderColor: "#cbcbcbff",
    borderTopWidth: 1,
    flex: 0,
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  iconBox: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    gap: "1%",
    paddingLeft: "1%",
    width: "100%",
  },
  navigationItem: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "2%",
    marginBottom: "7%",
    flex: 1,
  },
  navigationIcons: {
    height: 37,
    width: 37,
    marginTop: 5,
    marginBottom: 5,
    resizeMode: "contain",
    borderRadius: 17.5,
    backgroundColor: "#ffffff20",
    justifyContent: "center",
    alignItems: "center",
  },
  iconTexts: {
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#00000080",
  },
});

export default NavBar;
