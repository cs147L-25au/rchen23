import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import NavBar from "../../components/NavBar";
import { fetchPersonDetails, getPosterUrl, TMDBPersonCredit } from "../../TMDB";

type CreditRow = {
  id: number;
  title: string;
  role: string;
  poster_path?: string | null;
  media_type?: "movie" | "tv";
  release_date?: string;
};

const PersonScreen: React.FC = () => {
  const router = useRouter();
  const { personId } = useLocalSearchParams<{ personId?: string }>();
  const [loading, setLoading] = useState(true);
  const [personName, setPersonName] = useState("Person");
  const [profilePath, setProfilePath] = useState<string | null>(null);
  const [department, setDepartment] = useState<string | undefined>(undefined);
  const [credits, setCredits] = useState<TMDBPersonCredit[]>([]);

  useEffect(() => {
    const loadPerson = async () => {
      if (!personId) return;
      try {
        setLoading(true);
        const data = await fetchPersonDetails(Number(personId));
        setPersonName(data.name || "Person");
        setProfilePath(data.profile_path ?? null);
        setDepartment(data.known_for_department);
        const cast = data.combined_credits?.cast ?? [];
        const crew = data.combined_credits?.crew ?? [];
        setCredits([...cast, ...crew]);
      } catch (err) {
        console.error("Failed to load person details:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPerson();
  }, [personId]);

  const topCredits = useMemo(() => {
    const byId = new Map<string, CreditRow>();
    credits.forEach((credit) => {
      const title = credit.title ?? credit.name ?? "Untitled";
      const key = `${credit.media_type}-${credit.id}`;
      if (byId.has(key)) return;
      byId.set(key, {
        id: credit.id,
        title,
        role: credit.character || credit.job || "Credit",
        poster_path: credit.poster_path,
        media_type: credit.media_type,
        release_date: credit.release_date ?? credit.first_air_date,
      });
    });
    return Array.from(byId.values()).slice(0, 12);
  }, [credits]);

  const profileUri = getPosterUrl(undefined, profilePath);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </Pressable>
        <Text style={styles.headerTitle}>Person</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileRow}>
            {profileUri ? (
              <Image source={{ uri: profileUri }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileFallback} />
            )}
            <View style={styles.profileMeta}>
              <Text style={styles.personName}>{personName}</Text>
              {department ? (
                <Text style={styles.personRole}>{department}</Text>
              ) : null}
            </View>
          </View>

          <Text style={styles.sectionTitle}>Known for</Text>
          {topCredits.length === 0 ? (
            <Text style={styles.emptyText}>No credits available.</Text>
          ) : (
            topCredits.map((credit) => {
              const poster = getPosterUrl(credit.poster_path, null);
              const labelParts = [
                credit.media_type === "tv" ? "TV" : "Movie",
                credit.release_date ? credit.release_date.slice(0, 4) : "",
              ].filter(Boolean);
              return (
                <View
                  key={`${credit.media_type}-${credit.id}`}
                  style={styles.creditRow}
                >
                  {poster ? (
                    <Image
                      source={{ uri: poster }}
                      style={styles.creditPoster}
                    />
                  ) : (
                    <View style={styles.creditPosterFallback} />
                  )}
                  <View style={styles.creditMeta}>
                    <Text style={styles.creditTitle}>{credit.title}</Text>
                    <Text style={styles.creditRole}>{credit.role}</Text>
                    {labelParts.length > 0 ? (
                      <Text style={styles.creditLabel}>
                        {labelParts.join(" · ")}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <NavBar />
      <StatusBar style="auto" />
    </View>
  );
};

export default PersonScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "DM Sans",
    color: "#111",
  },
  loader: {
    marginTop: 24,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 16,
    gap: 12,
  },
  profileImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#e6e6e6",
  },
  profileFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#e6e6e6",
  },
  profileMeta: {
    flexShrink: 1,
  },
  personName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    fontFamily: "DM Sans",
  },
  personRole: {
    marginTop: 4,
    fontSize: 13,
    color: "#666",
    fontFamily: "DM Sans",
  },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontFamily: "DM Sans",
  },
  emptyText: {
    fontSize: 13,
    color: "#777",
    fontFamily: "DM Sans",
  },
  creditRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
  },
  creditPoster: {
    width: 52,
    height: 78,
    borderRadius: 6,
    backgroundColor: "#d9d9d9",
  },
  creditPosterFallback: {
    width: 52,
    height: 78,
    borderRadius: 6,
    backgroundColor: "#d9d9d9",
  },
  creditMeta: {
    flexShrink: 1,
    justifyContent: "center",
  },
  creditTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    fontFamily: "DM Sans",
  },
  creditRole: {
    marginTop: 4,
    fontSize: 12,
    color: "#666",
    fontFamily: "DM Sans",
  },
  creditLabel: {
    marginTop: 2,
    fontSize: 12,
    color: "#888",
    fontFamily: "DM Sans",
  },
});
