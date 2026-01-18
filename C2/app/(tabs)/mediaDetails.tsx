import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";
import Header from "../../components/Header";
import NavBar from "../../components/NavBar";
import db from "../../database/db";
import { getAllRatings, RatingPost } from "../../database/queries";
import { getPosterUrl } from "../../TMDB";

import { RatingModal, TMDBTitleData } from "../../components/RatingModal";

// ---------- Types ----------
type CastMember = {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
  order?: number;
};

const ACCENT_RED = "#B3261E";
const TMDB_API_KEY = "b6a79cf2e43d2d321e6bba3ca5b02c63";

const DEFAULT_PROFILE_PIC =
  "https://eagksfoqgydjaqoijjtj.supabase.co/storage/v1/object/public/RC_profile/profile_pic.png";

// Make sure a profile row exists for the current user
async function ensureProfile() {
  const {
    data: { user },
    error,
  } = await db.auth.getUser();

  if (error || !user) return null;

  await db.from("profiles").upsert(
    {
      id: user.id, // must be the PK in profiles
      profile_pic: DEFAULT_PROFILE_PIC,
    },
    { onConflict: "id" }
  );

  return user;
}


const MediaDetailScreen: React.FC = () => {
  const router = useRouter();

  const { id, title, mediaType, overview, posterPath, voteAverage, voteCount } =
    useLocalSearchParams<{
      id?: string;
      title?: string;
      mediaType?: string;
      overview?: string;
      posterPath?: string;
      voteAverage?: string;
      voteCount?: string;
    }>();

  const displayTitle = title ?? "Unknown title";
  const displayType =
    mediaType === "movie"
      ? "Movie"
      : mediaType === "tv"
      ? "TV Show"
      : mediaType === "person"
      ? "Person"
      : "";

  const posterUri = posterPath
    ? getPosterUrl(posterPath as string, null)
    : undefined;

  const ratingValue = voteAverage ? Number(voteAverage) : NaN;
  const ratingText =
    !isNaN(ratingValue) && ratingValue > 0 ? ratingValue.toFixed(1) : undefined;

  const voteCountNum = voteCount ? Number(voteCount) : NaN;
  const voteCountText =
    !isNaN(voteCountNum) && voteCountNum > 0
      ? voteCountNum.toLocaleString()
      : undefined;

  const showRating =
    (mediaType === "movie" || mediaType === "tv") && ratingText !== undefined;

  // ---- Extra TMDB details (year, runtime / seasons & episodes, rating) ----
  const [details, setDetails] = useState<any | null>(null);
  const [contentRating, setContentRating] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetailsAndRating = async () => {
      if (!id || !(mediaType === "movie" || mediaType === "tv")) return;
      if (!TMDB_API_KEY) return;

      try {
        // Main details (release date, runtime, seasons, etc.)
        const detailsUrl = `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${TMDB_API_KEY}&language=en-US`;
        const detailsRes = await fetch(detailsUrl);
        const detailsJson = await detailsRes.json();
        setDetails(detailsJson);

        // Content rating / certification (US)
        let ratingUrl: string;
        if (mediaType === "movie") {
          ratingUrl = `https://api.themoviedb.org/3/movie/${id}/release_dates?api_key=${TMDB_API_KEY}`;
        } else {
          ratingUrl = `https://api.themoviedb.org/3/tv/${id}/content_ratings?api_key=${TMDB_API_KEY}`;
        }

        const ratingRes = await fetch(ratingUrl);
        const ratingJson = await ratingRes.json();

        if (mediaType === "movie") {
          const results = ratingJson.results ?? [];
          const us = results.find((r: any) => r.iso_3166_1 === "US");
          const cert = us?.release_dates?.find(
            (rd: any) => rd.certification
          )?.certification;
          if (cert && typeof cert === "string" && cert.trim().length > 0) {
            setContentRating(cert.trim());
          }
        } else {
          const results = ratingJson.results ?? [];
          const us = results.find((r: any) => r.iso_3166_1 === "US");
          if (us?.rating && typeof us.rating === "string") {
            setContentRating(us.rating.trim());
          }
        }
      } catch (err) {
        console.error("Failed to fetch details / rating", err);
      }
    };

    fetchDetailsAndRating();
  }, [id, mediaType]);

  // Build the meta line dynamically
  let metaLine = "";
  let genresLine = "";
  if (details) {
    const pieces: string[] = [];
    const dateStr =
      (details as any).release_date ?? (details as any).first_air_date;

    if (dateStr) {
      const year = new Date(dateStr).getFullYear();
      if (!isNaN(year)) pieces.push(String(year));
    }

    if (mediaType === "movie" && (details as any).runtime) {
      pieces.push(`${(details as any).runtime} min`);
    }

    if (mediaType === "tv") {
      const seasons = (details as any).number_of_seasons;
      const episodes = (details as any).number_of_episodes;
      if (seasons) {
        pieces.push(
          `${seasons} season${seasons > 1 ? "s" : ""}${episodes ? "" : ""}`
        );
      }
      if (episodes) {
        pieces.push(`${episodes} episode${episodes > 1 ? "s" : ""}`);
      }
    }

    if (contentRating) {
      pieces.push(contentRating);
    }

    metaLine = pieces.join(" • ");

    // Extract genres from TMDB details
    const genres = (details as any).genres as
      | { id: number; name: string }[]
      | undefined;
    if (genres && genres.length > 0) {
      genresLine = genres.map((g) => g.name).join(", ");
    }
  }

  // ---- Top cast + director/creator state ----
  const [topCast, setTopCast] = useState<CastMember[]>([]);
  const [primaryCredits, setPrimaryCredits] = useState<string | null>(null);
  const [castLoading, setCastLoading] = useState(false);

  useEffect(() => {
    const fetchCredits = async () => {
      if (!id || !(mediaType === "movie" || mediaType === "tv")) return;
      if (!TMDB_API_KEY) return;

      try {
        setCastLoading(true);
        const creditsUrl = `https://api.themoviedb.org/3/${mediaType}/${id}/credits?api_key=${TMDB_API_KEY}&language=en-US`;
        const res = await fetch(creditsUrl);
        const json = await res.json();

        // CAST
        const cast = (json.cast ?? []) as CastMember[];
        cast.sort((a, b) => {
          const ao = a.order ?? 9999;
          const bo = b.order ?? 9999;
          return ao - bo;
        });
        setTopCast(cast.slice(0, 6));

        // CREW -> director(s) or creator(s)
        const crew = json.crew ?? [];
        let line: string | null = null;

        if (mediaType === "movie") {
          const directors = crew.filter((m: any) => m.job === "Director");
          if (directors.length === 1) {
            line = `Directed by ${directors[0].name}`;
          } else if (directors.length > 1) {
            const names = directors.map((d: any) => d.name);
            line =
              names.length <= 2
                ? `Directed by ${names.join(" & ")}`
                : `Directed by ${names.slice(0, 2).join(", ")} & others`;
          }
        } else if (mediaType === "tv") {
          const creators = crew.filter(
            (m: any) =>
              m.job === "Creator" ||
              m.job === "Developed by" ||
              m.job === "Executive Producer"
          );
          if (creators.length === 1) {
            line = `Created by ${creators[0].name}`;
          } else if (creators.length > 1) {
            const names = creators.map((c: any) => c.name);
            line =
              names.length <= 2
                ? `Created by ${names.join(" & ")}`
                : `Created by ${names.slice(0, 2).join(", ")} & others`;
          }
        }

        setPrimaryCredits(line);
      } catch (err) {
        console.error("Failed to fetch credits", err);
      } finally {
        setCastLoading(false);
      }
    };

    fetchCredits();
  }, [id, mediaType]);

  // ---- Friends' comments state ----
  const [friendComments, setFriendComments] = useState<RatingPost[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);

  useEffect(() => {
    const loadComments = async () => {
      try {
        setFriendsLoading(true);
        const data = await getAllRatings();
        const filtered = data.filter((r) => r.title === displayTitle);
        setFriendComments(filtered);
      } catch (err) {
        console.error("Failed to load friend comments", err);
      } finally {
        setFriendsLoading(false);
      }
    };

    loadComments();
  }, [displayTitle]);

  const renderCastImage = (member: CastMember) => {
    if (!member.profile_path) {
      return (
        <View style={styles.castNoImg}>
          <Text style={styles.castNoImgText}>No Img</Text>
        </View>
      );
    }
    const uri = `https://image.tmdb.org/t/p/w185${member.profile_path}`;
    return <Image source={{ uri }} style={styles.castImg} />;
  };

  // ---- Rating Modal ----
  const [ratingModalVisible, setRatingModalVisible] = useState(false);

  // Extract genres array for rating modal
  const genresArray: string[] = details
    ? ((details as any).genres as { id: number; name: string }[] | undefined)?.map(
        (g) => g.name
      ) || []
    : [];

  // Build TMDB data for the rating modal
  const tmdbData: TMDBTitleData | null =
    id && displayTitle
      ? {
          tmdb_id: parseInt(id, 10),
          tmdb_media_type: (mediaType as "movie" | "tv") || "movie",
          title: displayTitle,
          genres: genresArray,
          poster_path: posterPath || null,
        }
      : null;

  const handleRatingSuccess = () => {
    Alert.alert("Success", "Your rating was saved!");
    // Optionally refresh comments
    const loadComments = async () => {
      try {
        const data = await getAllRatings();
        const filtered = data.filter((r) => r.title === displayTitle);
        setFriendComments(filtered);
      } catch (err) {
        console.error("Failed to refresh comments", err);
      }
    };
    loadComments();
  };

  return (
    <View style={styles.page}>
      {/* Make header (incl. profile pic) pressable -> Settings */}
      <Pressable onPress={() => router.push("/(tabs)/settings")}>
        <Header />
      </Pressable>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Back row */}
        <Pressable
          style={styles.backRow}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={20} color="#666" />
          <Text style={styles.backText}>Back to Search</Text>
        </Pressable>

        {/* Hero section */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            {posterUri ? (
              <Image source={{ uri: posterUri }} style={styles.posterLarge} />
            ) : (
              <View style={styles.noPosterLarge}>
                <Text style={styles.noPosterText}>No Img</Text>
              </View>
            )}

            <View style={styles.heroMeta}>
              <Text style={styles.title}>{displayTitle}</Text>
              {displayType.length > 0 && (
                <Text style={styles.type}>{displayType}</Text>
              )}

              {/* Director / Creator line from credits */}
              {primaryCredits && (
                <Text style={styles.creditLine}>{primaryCredits}</Text>
              )}

              {showRating && (
                <>
                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingNumber}>{ratingText}</Text>
                    <Text style={styles.ratingLabel}> / 10 • TMDB rating</Text>
                  </View>
                  {voteCountText && (
                    <Text style={styles.voteCountText}>
                      Based on {voteCountText} votes
                    </Text>
                  )}
                </>
              )}

              <Text style={styles.metaSmall}>
                {genresLine.length > 0 ? genresLine : "Genres unavailable"}
              </Text>
              {metaLine.length > 0 && (
                <Text style={styles.metaSmall}>{metaLine}</Text>
              )}

              {/* Plus + Bookmark buttons */}
              <View style={styles.actionRow}>
                <Pressable
                  style={styles.actionChip}
                  onPress={() => setRatingModalVisible(true)}
                >
                  <Feather name="plus" size={16} color="#fff" />
                  <Text style={styles.actionChipText}>Rate</Text>
                </Pressable>

                <Pressable style={styles.actionChip}>
                  <Feather name="bookmark" size={16} color="#fff" />
                  <Text style={styles.actionChipText}>Watchlist</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.sectionBody}>
            {overview && overview.length > 0
              ? overview
              : "No official description found for this title yet."}
          </Text>
        </View>

        {/* Top Cast – IMDB-style rows with actor photos */}
        <View style={styles.section}>
          <View style={styles.castHeaderRow}>
            <View style={styles.castHeaderLeft}>
              <View style={styles.castAccentBar} />
              <Text style={styles.sectionTitle}>Top Cast</Text>
            </View>
            {topCast.length > 0 && (
              <Text style={styles.castCountText}>{topCast.length}</Text>
            )}
          </View>

          {castLoading ? (
            <ActivityIndicator />
          ) : topCast.length > 0 ? (
            topCast.map((member) => (
              <View key={member.id} style={styles.castRow}>
                {renderCastImage(member)}
                <View style={styles.castTextCol}>
                  <Text style={styles.castName}>{member.name}</Text>
                  {member.character ? (
                    <Text style={styles.castCharacter}>{member.character}</Text>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.sectionBody}>
              Cast information is not available for this title yet.
            </Text>
          )}
        </View>

        {/* What your friends think */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What your friends think</Text>

          {friendsLoading ? (
            <ActivityIndicator />
          ) : friendComments.length > 0 ? (
            friendComments.map((post: RatingPost) => (
              <View key={post.rating_id} style={styles.friendCommentCard}>
                <View style={styles.friendHeaderRow}>
                  <FontAwesome5 name="user-circle" size={20} color="#4b4b4b" />
                  <Text style={styles.friendName}>Friend</Text>
                </View>
                <Text style={styles.friendCommentText}>
                  {post.review_body ??
                    (post.score
                      ? `Rated this ${post.score.toFixed(1)}/10`
                      : `${post.category === "good" ? "Liked" : post.category === "alright" ? "It was fine" : "Disliked"} this.`)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyFriendsContainer}>
              <FontAwesome5
                name="user-friends"
                size={40}
                color="#7a7a7a"
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.emptyFriendsTitle}>
                None of your friends have been here yet!
              </Text>
              <Text style={styles.emptyFriendsBody}>
                Follow more friends to see what they think about this movie.
              </Text>
              <Pressable style={styles.findFriendsButton}>
                <Text style={styles.findFriendsButtonText}>Find friends</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Rating popup */}
      <RatingModal
        visible={ratingModalVisible}
        tmdbData={tmdbData}
        onClose={() => setRatingModalVisible(false)}
        onSuccess={handleRatingSuccess}
      />

      <NavBar />
      <StatusBar style="auto" />
    </View>
  );
};

export default MediaDetailScreen;

// ---------- Styles ----------
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    paddingTop: 12,
  },

  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backText: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 4,
    fontFamily: "DM Sans",
  },

  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  heroRow: {
    flexDirection: "row",
  },
  posterLarge: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginRight: 16,
  },
  noPosterLarge: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  noPosterText: {
    color: "#777",
    fontFamily: "DM Sans",
  },
  heroMeta: {
    flex: 1,
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
    fontFamily: "DM Sans",
  },
  type: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
    fontFamily: "DM Sans",
  },
  creditLine: {
    fontSize: 13,
    color: "#555",
    marginBottom: 6,
    fontFamily: "DM Sans",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 2,
  },
  ratingNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: ACCENT_RED,
    fontFamily: "DM Sans",
  },
  ratingLabel: {
    fontSize: 13,
    color: "#555",
    marginLeft: 4,
    fontFamily: "DM Sans",
  },
  voteCountText: {
    fontSize: 12,
    color: "#555",
    marginBottom: 8,
    fontFamily: "DM Sans",
  },
  metaSmall: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
    fontFamily: "DM Sans",
  },

  actionRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 8,
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ACCENT_RED,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  actionChipText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "DM Sans",
    fontWeight: "500",
  },

  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 6,
    fontFamily: "DM Sans",
  },
  sectionBody: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    fontFamily: "DM Sans",
  },

  // Top Cast
  castHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    justifyContent: "space-between",
  },
  castHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  castAccentBar: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: "#f5c518",
  },
  castCountText: {
    fontSize: 12,
    color: "#666",
    fontFamily: "DM Sans",
  },
  castRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  castImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 10,
    backgroundColor: "#e0e0e0",
  },
  castNoImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 10,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  castNoImgText: {
    fontSize: 9,
    color: "#555",
    fontFamily: "DM Sans",
  },
  castTextCol: {
    flex: 1,
  },
  castName: {
    fontSize: 14,
    color: "#000",
    fontWeight: "600",
    fontFamily: "DM Sans",
  },
  castCharacter: {
    fontSize: 13,
    color: "#666",
    fontFamily: "DM Sans",
  },

  // Friends section
  friendCommentCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#fafafa",
  },
  friendHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 6,
  },
  friendName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    fontFamily: "DM Sans",
  },
  friendCommentText: {
    fontSize: 13,
    color: "#333",
    fontFamily: "DM Sans",
  },

  emptyFriendsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fafafa",
  },
  emptyFriendsTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
    textAlign: "center",
    fontFamily: "DM Sans",
  },
  emptyFriendsBody: {
    fontSize: 13,
    color: "#555",
    textAlign: "center",
    marginBottom: 10,
    fontFamily: "DM Sans",
  },
  findFriendsButton: {
    marginTop: 4,
    borderRadius: 18,
    backgroundColor: ACCENT_RED,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  findFriendsButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "DM Sans",
  },
});
