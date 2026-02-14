import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const DEFAULT_PROFILE_PIC = require("../assets/anon_pfp.png");

export type LikeUser = {
  id: string;
  displayName: string;
  profilePic: string | null;
};

type LikesModalProps = {
  visible: boolean;
  likes: LikeUser[];
  onClose: () => void;
};

const LikesModal: React.FC<LikesModalProps> = ({ visible, likes, onClose }) => {
  const isEmpty = likes.length === 0;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Likes</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#555" />
            </Pressable>
          </View>
          {isEmpty ? (
            <Text style={styles.emptyText}>No likes yet</Text>
          ) : (
            <FlatList
              data={likes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <Image
                    source={
                      item.profilePic && item.profilePic.trim()
                        ? { uri: item.profilePic }
                        : DEFAULT_PROFILE_PIC
                    }
                    style={styles.avatar}
                  />
                  <Text style={styles.nameText}>{item.displayName}</Text>
                </View>
              )}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    maxHeight: "60%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    paddingVertical: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e5e5e5",
    marginRight: 12,
  },
  nameText: {
    fontSize: 15,
    color: "#000",
    fontWeight: "500",
  },
});

export default LikesModal;
