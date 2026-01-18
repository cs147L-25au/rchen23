// components/RatingModal/WatchWithPicker.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { createFriend, fetchFriends, Friend } from "../../lib/ratingsDb";

interface WatchWithPickerProps {
  userId: string;
  selectedFriendIds: string[];
  onSelect: (friendIds: string[]) => void;
}

const WatchWithPicker: React.FC<WatchWithPickerProps> = ({
  userId,
  selectedFriendIds,
  onSelect,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [newFriendName, setNewFriendName] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);

  useEffect(() => {
    if (modalVisible && userId) {
      loadFriends();
    }
  }, [modalVisible, userId]);

  const loadFriends = async () => {
    setLoading(true);
    try {
      const data = await fetchFriends(userId);
      setFriends(data);
    } catch (err) {
      console.error("Failed to load friends:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!newFriendName.trim() || addingFriend) return;

    setAddingFriend(true);
    try {
      const newFriend = await createFriend(userId, newFriendName.trim());
      setFriends((prev) =>
        [...prev, newFriend].sort((a, b) => a.name.localeCompare(b.name))
      );
      onSelect([...selectedFriendIds, newFriend.id]);
      setNewFriendName("");
    } catch (err) {
      console.error("Failed to add friend:", err);
    } finally {
      setAddingFriend(false);
    }
  };

  const toggleFriend = (friendId: string) => {
    if (selectedFriendIds.includes(friendId)) {
      onSelect(selectedFriendIds.filter((id) => id !== friendId));
    } else {
      onSelect([...selectedFriendIds, friendId]);
    }
  };

  const selectedNames = friends
    .filter((f) => selectedFriendIds.includes(f.id))
    .map((f) => f.name);

  return (
    <>
      <Pressable style={styles.row} onPress={() => setModalVisible(true)}>
        <Ionicons name="people-outline" size={22} color="#555" />
        <View style={styles.rowContent}>
          <Text style={styles.rowLabel}>Who did you go with?</Text>
          {selectedNames.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
            >
              {selectedNames.map((name, idx) => (
                <View key={idx} style={styles.chip}>
                  <Text style={styles.chipText}>{name}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Who did you watch with?</Text>
            <Pressable onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} />
          ) : (
            <ScrollView style={styles.friendsList}>
              {friends.map((friend) => (
                <Pressable
                  key={friend.id}
                  style={styles.friendRow}
                  onPress={() => toggleFriend(friend.id)}
                >
                  <Text style={styles.friendName}>{friend.name}</Text>
                  {selectedFriendIds.includes(friend.id) && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#1a535c"
                    />
                  )}
                </Pressable>
              ))}

              {/* Add new friend */}
              <View style={styles.addFriendRow}>
                <TextInput
                  style={styles.addFriendInput}
                  placeholder="Add new friend..."
                  placeholderTextColor="#999"
                  value={newFriendName}
                  onChangeText={setNewFriendName}
                  onSubmitEditing={handleAddFriend}
                />
                <Pressable
                  style={[
                    styles.addButton,
                    !newFriendName.trim() && styles.addButtonDisabled,
                  ]}
                  onPress={handleAddFriend}
                  disabled={!newFriendName.trim() || addingFriend}
                >
                  {addingFriend ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="add" size={20} color="#fff" />
                  )}
                </Pressable>
              </View>
            </ScrollView>
          )}

          <Pressable
            style={styles.doneButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
};

export default WatchWithPicker;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 12,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    color: "#000",
  },
  chipsScroll: {
    marginTop: 8,
  },
  chip: {
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 100,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  friendsList: {
    flex: 1,
    padding: 16,
  },
  friendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  friendName: {
    fontSize: 16,
    color: "#000",
  },
  addFriendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 12,
  },
  addFriendInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: "#1a535c",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonDisabled: {
    backgroundColor: "#ccc",
  },
  doneButton: {
    backgroundColor: "#1a535c",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
