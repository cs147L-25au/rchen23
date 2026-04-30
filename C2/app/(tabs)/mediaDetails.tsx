import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
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
import FriendActivityCard from "../../components/FriendActivityCard";
import { getCurrentUserId, TitleType } from "../../lib/ratingsDb";
import {
  isInWatchlistByTmdb,
  toggleWatchlistByTmdb,
} from "../../lib/watchlistDb";
import { isFollowing } from "../../lib/friendsDb";
import { useAppTheme } from "../../contexts/ThemeContext";
import { ThemeColors } from "../../constants/theme";

type CastMember = {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
  order?: number;
};

const TMDB_API_KEY = "b6a79cf2e43d2d321e6bba3ca5b02c63";

function pushPersonFromTitle(
  router: ReturnType<typeof useRouter>,
  personId: number,
  title: string,
) {
  router.push({
    pathname: "/person/[personId]",
    params: {
      personId: String(personId),
      fromTitle: title,
    },
  });
}

async function ensureProfile() {
  const {
    data: { user },
    error,
  } = await db.auth.getUser();

  if (error || !user) return null;

  await db.from("profiles").upsert(
    { id: user.id },
    { onConflict: "id" },
  );

  return user;
}

const MediaDetailScreen: React.FC = () => {
  const router = useRouter();
  const { colors: t, mode } = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const { id, title, mediaType, overview, posterPath, voteAverage, voteCount, fromTitle } =
    useLocalSearchParams<{
      id?: string;
      title?: string;
      mediaType?: string;
      overview?: string;
      posterPath?: string;
      voteAverage?: string;
      voteCount?: string;
      fromTitle?: string;
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

  const [details, setDetails] = useState<any | null>(null);
  const [contentRating, setContentRating] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetailsAndRating = async () => {
      if (!id || !(mediaType === "movie" || mediaType === "tv")) return;
      if (!TMDB_API_KEY) return;

      try {
        const detailsUrl = `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${TMDB_API_KEY}&language=en-US`;
        const detailsRes = await fetch(detailsUrl);
        const detailsJson = await detailsRes.json();
        setDetails(detailsJson);

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
            (rd: any) => rd.certification,
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
          `${seasons} season${seasons > 1 ? "s" : ""}${episodes ? "" : ""}`,
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

    const genres = (details as any).genres as
      | { id: number; name: string }[]
      | undefined;
    if (genres && genres.length > 0) {
      genresLine = genres.map((g) => g.name).join(", ");
    }
  }

  const [topCast, setTopCast] = useState<CastMember[]>([]);
  const [primaryCreditLabel, setPrimaryCreditLabel] = useState<string | null>(
    null,
  );
  const [primaryCreditPeople, setPrimaryCreditPeople] = useState<
    { id: number; name: string }[]
  >([]);
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

        const cast = (json.cast ?? []) as CastMember[];
        cast.sort((a, b) => {
          const ao = a.order ?? 9999;
          const bo = b.order ?? 9999;
          return ao - bo;
        });
        setTopCast(cast.slice(0, 6));

        const crew = json.crew ?? [];

        if (mediaType === "movie") {
          const directors = crew.filter((m: any) => m.job === "Director");
          if (directors.length > 0) {
            setPrimaryCreditLabel("Directed by");
            setPrimaryCreditPeople(
              directors.map((d: any) => ({ id: d.id, name: d.name })),
            );
          } else {
            setPrimaryCreditLabel(null);
            setPrimaryCreditPeople([]);
          }
        } else {
          const creators = crew.filter(
            (m: any) =>
              m.job === "Creator" ||
              m.job === "Developed by" ||
              m.job === "Executive Producer",
          );
          if (creators.length > 0) {
            setPrimaryCreditLabel("Created by");
            setPrimaryCreditPeople(
              creators.map((c: any) => ({ id: c.id, name: c.name })),
            );
          } else {
            setPrimaryCreditLabel(null);
            setPrimaryCreditPeople([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch credits", err);
        setTopCast([]);
        setPrimaryCreditLabel(null);
        setPrimaryCreditPeople([]);
      } finally {
        setCastLoading(false);
      }
    };

    fetchCredits();
  }, [id, mediaType]);

  const [friendComments, setFriendComments] = useState<
    (RatingPost & { display_name?: string; profile_pic?: string | null })[]
  >([]);
  const [friendsLoading, setFriendsLoading] = useState(true);

  useEffect(() => {
    const loadComments = async () => {
      try {
        setFriendsLoading(true);
        const data = await getAllRatings();
        const filtered = data.filter((r) => r.title === displayTitle);

        // Filter out current user's own comments
        const withoutSelf = filtered.filter((r) => r.user_id !== currentUserId);

        // Filter to only mutual followers (both follow each other)
        const mutualFollows: (RatingPost & {
          display_name?: string;
          profile_pic?: string | null;
        })[] = [];

        for (const comment of withoutSelf) {
          if (!currentUserId) {
            continue;
          }

          const isMutual =
            (await isFollowing(currentUserId, comment.user_id)) &&
            (await isFollowing(comment.user_id, currentUserId));

          if (isMutual) {
            mutualFollows.push(comment);
          }
        }

        // Fetch profile data for each mutual friend
        const enrichedComments = await Promise.all(
          mutualFollows.map(async (comment) => {
            try {
              const { data: profileData } = await db
                .from("profiles")
                .select("display_name, profile_pic")
                .eq("id", comment.user_id)
                .maybeSingle();

              return {
                ...comment,
                display_name: profileData?.display_name || "User",
                profile_pic: profileData?.profile_pic || null,
              };
            } catch {
              return {
                ...comment,
                display_name: "User",
                profile_pic: null,
              };
            }
          })
        );

        setFriendComments(enrichedComments);
      } catch (err) {
        console.error("Failed to load friend comments", err);
      } finally {
        setFriendsLoading(false);
      }
    };

    loadComments();
  }, [displayTitle, currentUserId]);

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

  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    const checkStatuses = async () => {
      if (!id || !(mediaType === "movie" || mediaType === "tv")) return;

      try {
        const userId = await getCurrentUserId();
        setCurrentUserId(userId);

        if (userId) {
          const result = await isInWatchlistByTmdb(
            userId,
            parseInt(id, 10),
            mediaType as "movie" | "tv",
          );
          setInWatchlist(result.inWatchlist);

          const { data: ratingData } = await db
            .from("v_user_ratings")
            .select("rating_id")
            .eq("user_id", userId)
            .eq("tmdb_id", parseInt(id, 10))
            .eq("tmdb_media_type", mediaType)
            .maybeSingle();

          setHasRated(!!ratingData);
        }
      } catch (err) {
        console.error("Failed to check statuses:", err);
      }
    };

    checkStatuses();
  }, [id, mediaType]);

  const genresArray: string[] = details
    ? (
        (details as any).genres as { id: number; name: string }[] | undefined
      )?.map((g) => g.name) || []
    : [];

  const releaseYear: number | null = details
    ? (() => {
        const dateStr =
          (details as any).release_date ?? (details as any).first_air_date;
        if (dateStr) {
          const year = new Date(dateStr).getFullYear();
          return isNaN(year) ? null : year;
        }
        return null;
      })()
    : null;

  const handleWatchlistToggle = async () => {
    if (!id || !(mediaType === "movie" || mediaType === "tv")) return;
    if (watchlistLoading) return;

    try {
      setWatchlistLoading(true);

      let titleType: TitleType = "movie";
      if (mediaType === "tv") {
        titleType = "tv";
      }

      const result = await toggleWatchlistByTmdb({
        tmdb_id: parseInt(id, 10),
        tmdb_media_type: mediaType as "movie" | "tv",
        title: displayTitle,
        genres: genresArray,
        title_type: titleType,
        poster_path: posterPath || null,
        release_year: releaseYear,
      });

      setInWatchlist(result.inWatchlist);

      if (result.inWatchlist) {
        Alert.alert("Added", `${displayTitle} added to your watchlist`);
      } else {
        Alert.alert("Removed", `${displayTitle} removed from your watchlist`);
      }
    } catch (err) {
      console.error("Failed to toggle watchlist:", err);
      Alert.alert("Error", "Failed to update watchlist");
    } finally {
      setWatchlistLoading(false);
    }
  };

  const tmdbData: TMDBTitleData | null =
    id && displayTitle
      ? {
          tmdb_id: parseInt(id, 10),
          tmdb_media_type: (mediaType as "movie" | "tv") || "movie",
          title: displayTitle,
          genres: genresArray,
          poster_path: posterPath || null,
          release_year: releaseYear,
        }
      : null;

  const handleRatingSuccess = () => {
    setHasRated(true);

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
      <Pressable onPress={() => router.push("/(tabs)/settings")}>
        <Header />
      </Pressable>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Pressable
          style={styles.backRow}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={20} color={t.textMuted} />
          <Text style={styles.backText}>
            {fromTitle ? `Back to ${fromTitle}` : "Back to Search"}
          </Text>
        </Pressable>

        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            {posterUri ? (
              <Image source={{ uri: posterUri }} style={styles.posterLarge} />
            ) : (
              <View style={styles.noPosterLarge}>
                <Text style={styles.noPosterText}>No Img</Text>
              </View>
            )}

            <View style={styles.heroMetaColumn}>
              <View style={styles.heroTitleBlock}>
                <Text style={styles.titleText}>{displayTitle}</Text>
                {displayType.length > 0 && (
                  <Text style={styles.type}>{displayType}</Text>
                )}
              </View>

              {primaryCreditLabel && primaryCreditPeople.length > 0 && (
                <View style={styles.creditLabelRow}>
                  <Text style={styles.creditLabelFixed} numberOfLines={1}>
                    {primaryCreditLabel}
                  </Text>
                  <View style={styles.creditNamesFlex}>
                    <Text style={styles.creditNamesText}>
                      {primaryCreditPeople.map((p, i) => (
                        <React.Fragment key={p.id}>
                          {i > 0 ? (
                            <Text style={styles.creditNameComma}>, </Text>
                          ) : null}
                          <Text
                            onPress={() =>
                              pushPersonFromTitle(router, p.id, displayTitle)
                            }
                            style={styles.creditLink}
                          >
                            {p.name}
                          </Text>
                        </React.Fragment>
                      ))}
                    </Text>
                  </View>
                </View>
              )}

              {showRating && (
                <View style={styles.ratingBlock}>
                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingNumber}>{ratingText}</Text>
                    <Text style={styles.ratingLabel}> / 10 • TMDB rating</Text>
                  </View>
                  {voteCountText ? (
                    <Text style={styles.voteCountText}>
                      Based on {voteCountText} votes
                    </Text>
                  ) : null}
                </View>
              )}

              <View style={styles.heroMetaBlock}>
                <Text style={styles.metaSmall}>
                  {genresLine.length > 0 ? genresLine : "Genres unavailable"}
                </Text>
                {metaLine.length > 0 ? (
                  <Text style={styles.metaSmall}>{metaLine}</Text>
                ) : null}
              </View>

              <View style={styles.actionRow}>
                <Pressable
                  style={[
                    styles.actionChip,
                    hasRated && styles.actionChipActive,
                  ]}
                  onPress={() => setRatingModalVisible(true)}
                >
                  <Feather
                    name={hasRated ? "check" : "plus"}
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.actionChipText}>
                    {hasRated ? "Rated" : "Rate"}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.actionChip,
                    inWatchlist && styles.actionChipActive,
                  ]}
                  onPress={handleWatchlistToggle}
                  disabled={watchlistLoading}
                >
                  {watchlistLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather
                        name={inWatchlist ? "check" : "bookmark"}
                        size={16}
                        color="#fff"
                      />
                      <Text style={styles.actionChipText}>
                        {inWatchlist ? "In Watchlist" : "Watchlist"}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.sectionBody}>
            {overview && overview.length > 0
              ? overview
              : "No official description found for this title yet."}
          </Text>
        </View>

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
            <ActivityIndicator color={t.primary} />
          ) : topCast.length > 0 ? (
            topCast.map((member) => (
              <Pressable
                key={member.id}
                style={styles.castRow}
                onPress={() =>
                  pushPersonFromTitle(router, member.id, displayTitle)
                }
              >
                {renderCastImage(member)}
                <View style={styles.castTextCol}>
                  <Text style={styles.castName}>{member.name}</Text>
                  {member.character ? (
                    <Text style={styles.castCharacter}>{member.character}</Text>
                  ) : null}
                </View>
              </Pressable>
            ))
          ) : (
            <Text style={styles.sectionBody}>
              Cast information is not available for this title yet.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What your friends think</Text>

          {friendsLoading ? (
            <ActivityIndicator color={t.primary} />
          ) : friendComments.length > 0 ? (
            friendComments.map((post) => (
              <FriendActivityCard
                key={post.rating_id}
                ratingPost={post}
                userName={post.display_name || "User"}
                profileImage={post.profile_pic || null}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/mediaDetails",
                    params: {
                      id: String(post.tmdb_id),
                      title: post.title,
                      mediaType: post.tmdb_media_type,
                      posterPath: post.poster_path || "",
                    },
                  })
                }
              />
            ))
          ) : (
            <View style={styles.emptyFriendsContainer}>
              <FontAwesome5
                name="user-friends"
                size={40}
                color={t.textMuted}
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

      <RatingModal
        visible={ratingModalVisible}
        tmdbData={tmdbData}
        onClose={() => setRatingModalVisible(false)}
        onSuccess={handleRatingSuccess}
      />

      <NavBar />
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
    </View>
  );
};

export default MediaDetailScreen;

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    page: {
      flex: 1,
      backgroundColor: t.background,
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
      color: t.textMuted,
      marginLeft: 4,
      fontFamily: "DM Sans",
    },
    heroCard: {
      backgroundColor: t.card,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 14,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: t.border,
    },
    heroRow: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    posterLarge: {
      width: 120,
      height: 180,
      borderRadius: 8,
      marginRight: 14,
    },
    noPosterLarge: {
      width: 120,
      height: 180,
      borderRadius: 8,
      marginRight: 14,
      backgroundColor: t.posterPlaceholder,
      justifyContent: "center",
      alignItems: "center",
    },
    noPosterText: {
      color: t.textMuted,
      fontFamily: "DM Sans",
    },
    heroMetaColumn: {
      flex: 1,
      gap: 12,
      minWidth: 0,
    },
    heroTitleBlock: {
      gap: 4,
    },
    titleText: {
      fontSize: 22,
      fontWeight: "700",
      color: t.textPrimary,
      fontFamily: "DM Sans",
      lineHeight: 28,
    },
    type: {
      fontSize: 14,
      color: t.textMuted,
      fontFamily: "DM Sans",
      lineHeight: 20,
    },
    creditLabelRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
    },
    creditLabelFixed: {
      flexShrink: 0,
      fontSize: 13,
      lineHeight: 20,
      color: t.textSecondary,
      fontFamily: "DM Sans",
    },
    creditNamesFlex: {
      flex: 1,
      minWidth: 0,
    },
    creditNamesText: {
      fontSize: 13,
      lineHeight: 20,
      color: t.textSecondary,
      fontFamily: "DM Sans",
    },
    creditNameComma: {
      fontSize: 13,
      lineHeight: 20,
      color: t.textSecondary,
      fontFamily: "DM Sans",
    },
    creditLink: {
      fontSize: 13,
      lineHeight: 20,
      color: t.primary,
      fontWeight: "600",
      fontFamily: "DM Sans",
    },
    ratingBlock: {
      gap: 4,
    },
    ratingRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 6,
    },
    ratingNumber: {
      fontSize: 24,
      fontWeight: "700",
      color: t.primary,
      fontFamily: "DM Sans",
      lineHeight: 28,
    },
    ratingLabel: {
      fontSize: 13,
      color: t.textSecondary,
      fontFamily: "DM Sans",
      lineHeight: 20,
    },
    voteCountText: {
      fontSize: 12,
      color: t.textSecondary,
      fontFamily: "DM Sans",
      lineHeight: 16,
    },
    heroMetaBlock: {
      gap: 4,
    },
    metaSmall: {
      fontSize: 12,
      color: t.textMuted,
      fontFamily: "DM Sans",
      lineHeight: 18,
    },
    actionRow: {
      flexDirection: "row",
      gap: 8,
    },
    actionChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.primary,
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 6,
      gap: 4,
      minWidth: 100,
      justifyContent: "center",
    },
    actionChipActive: {
      backgroundColor: t.watched,
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
      color: t.textPrimary,
      marginBottom: 6,
      fontFamily: "DM Sans",
    },
    sectionBody: {
      fontSize: 14,
      color: t.textSecondary,
      lineHeight: 20,
      fontFamily: "DM Sans",
    },
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
      color: t.textMuted,
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
      backgroundColor: t.posterPlaceholder,
    },
    castNoImg: {
      width: 52,
      height: 52,
      borderRadius: 26,
      marginRight: 10,
      backgroundColor: t.posterPlaceholder,
      alignItems: "center",
      justifyContent: "center",
    },
    castNoImgText: {
      fontSize: 9,
      color: t.textMuted,
      fontFamily: "DM Sans",
    },
    castTextCol: {
      flex: 1,
    },
    castName: {
      fontSize: 14,
      color: t.textPrimary,
      fontWeight: "600",
      fontFamily: "DM Sans",
    },
    castCharacter: {
      fontSize: 13,
      color: t.textMuted,
      fontFamily: "DM Sans",
    },
    emptyFriendsContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.surface,
    },
    emptyFriendsTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: t.textPrimary,
      marginBottom: 4,
      textAlign: "center",
      fontFamily: "DM Sans",
    },
    emptyFriendsBody: {
      fontSize: 13,
      color: t.textSecondary,
      textAlign: "center",
      marginBottom: 10,
      fontFamily: "DM Sans",
    },
    findFriendsButton: {
      marginTop: 4,
      borderRadius: 18,
      backgroundColor: t.primary,
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
