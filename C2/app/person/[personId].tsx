import { Ionicons } from "@expo/vector-icons";
import {
  useGlobalSearchParams,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
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

import Header from "../../components/Header";
import NavBar from "../../components/NavBar";
import {
  fetchPersonDetails,
  getGenreNames,
  getPosterUrl,
  loadGenres,
  TMDBPersonCredit,
} from "../../TMDB";

/** TMDB genre id for Documentary (movies). */
const DOCUMENTARY_GENRE_ID = 99;

type FilmographyEntry = {
  id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  overview?: string;
  vote_average?: number;
  vote_count?: number;
  roleLabels: string[];
};

function mergePersonCredits(
  cast: TMDBPersonCredit[],
  crew: TMDBPersonCredit[],
): FilmographyEntry[] {
  const map = new Map<string, FilmographyEntry>();

  const add = (c: TMDBPersonCredit, roleLabel: string) => {
    const mt = c.media_type === "tv" ? "tv" : "movie";
    const key = `${mt}-${c.id}`;
    const title = c.title ?? c.name ?? "Untitled";
    const label = roleLabel.trim();
    let entry = map.get(key);
    if (!entry) {
      entry = {
        id: c.id,
        media_type: mt,
        title,
        poster_path: c.poster_path,
        release_date: c.release_date,
        first_air_date: c.first_air_date,
        genre_ids: c.genre_ids,
        overview: c.overview,
        vote_average: c.vote_average,
        vote_count: c.vote_count,
        roleLabels: label ? [label] : [],
      };
      map.set(key, entry);
    } else {
      if (c.poster_path && !entry.poster_path) entry.poster_path = c.poster_path;
      if (c.overview && !entry.overview) entry.overview = c.overview;
      if (c.vote_average != null && entry.vote_average == null) {
        entry.vote_average = c.vote_average;
      }
      if (c.vote_count != null && entry.vote_count == null) {
        entry.vote_count = c.vote_count;
      }
      if (c.genre_ids?.length && !entry.genre_ids?.length) {
        entry.genre_ids = c.genre_ids;
      }
      const rd = c.release_date ?? c.first_air_date;
      const existingD = entry.release_date ?? entry.first_air_date;
      if (rd && !existingD) {
        entry.release_date = c.release_date;
        entry.first_air_date = c.first_air_date;
      }
      if (label && !entry.roleLabels.includes(label)) {
        entry.roleLabels.push(label);
      }
    }
  };

  for (const c of cast) {
    const ch = c.character?.trim();
    add(c, ch && ch.length > 0 ? ch : "Actor");
  }
  for (const c of crew) {
    const job = c.job?.trim();
    add(c, job && job.length > 0 ? job : "Crew");
  }

  return Array.from(map.values());
}

function creditDateMs(entry: FilmographyEntry): number {
  const d = entry.release_date ?? entry.first_air_date ?? "";
  if (!d) return 0;
  const t = new Date(d).getTime();
  return isNaN(t) ? 0 : t;
}

function sortFilmographyNewestFirst(list: FilmographyEntry[]): FilmographyEntry[] {
  return [...list].sort((a, b) => {
    const ta = creditDateMs(a);
    const tb = creditDateMs(b);
    if (tb !== ta) return tb - ta;
    return (b.vote_average ?? 0) - (a.vote_average ?? 0);
  });
}

function displayDepartment(known?: string): string {
  if (!known) return "";
  if (known === "Acting") return "Actor";
  if (known === "Directing") return "Director";
  return known;
}

function paramStr(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === "string" && s.length > 0 ? s : undefined;
}

/** Label when returning to a title from media details; search uses no params → "Back to Search". */
function personBackLabel(fromTitle?: string, fromKind?: string): string {
  const title = fromTitle?.trim();
  if (!title) return "Back to Search";
  const k = fromKind?.toLowerCase();
  if (k === "tv") return `Back to ${title} · TV show`;
  if (k === "documentary") return `Back to ${title} · Documentary`;
  if (k === "movie") return `Back to ${title} · Movie`;
  return `Back to ${title}`;
}

const PersonScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    personId?: string | string[];
    fromTitle?: string | string[];
    fromKind?: string | string[];
  }>();
  const globalParams = useGlobalSearchParams<{
    fromTitle?: string | string[];
    fromKind?: string | string[];
  }>();
  const personId = paramStr(params.personId);
  const fromTitle = paramStr(params.fromTitle ?? globalParams.fromTitle);
  const fromKind = paramStr(params.fromKind ?? globalParams.fromKind);
  const backLabel = useMemo(
    () => personBackLabel(fromTitle, fromKind),
    [fromTitle, fromKind],
  );
  const [loading, setLoading] = useState(true);
  const [personName, setPersonName] = useState("Person");
  const [profilePath, setProfilePath] = useState<string | null>(null);
  const [department, setDepartment] = useState<string | undefined>(undefined);
  const [biography, setBiography] = useState<string | undefined>(undefined);
  const [castCredits, setCastCredits] = useState<TMDBPersonCredit[]>([]);
  const [crewCredits, setCrewCredits] = useState<TMDBPersonCredit[]>([]);

  useEffect(() => {
    const loadPerson = async () => {
      if (!personId) return;
      try {
        setLoading(true);
        await loadGenres();
        const data = await fetchPersonDetails(Number(personId));
        setPersonName(data.name || "Person");
        setProfilePath(data.profile_path ?? null);
        setDepartment(data.known_for_department);
        setBiography(data.biography);
        setCastCredits(data.combined_credits?.cast ?? []);
        setCrewCredits(data.combined_credits?.crew ?? []);
      } catch (err) {
        console.error("Failed to load person details:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPerson();
  }, [personId]);

  const { films, documentaries, tvShows } = useMemo(() => {
    const merged = mergePersonCredits(castCredits, crewCredits);
    const movies = merged.filter((m) => m.media_type === "movie");
    const tv = merged.filter((m) => m.media_type === "tv");
    const docs = movies.filter((m) =>
      (m.genre_ids ?? []).includes(DOCUMENTARY_GENRE_ID),
    );
    const fictionFilms = movies.filter(
      (m) => !(m.genre_ids ?? []).includes(DOCUMENTARY_GENRE_ID),
    );
    return {
      films: sortFilmographyNewestFirst(fictionFilms),
      documentaries: sortFilmographyNewestFirst(docs),
      tvShows: sortFilmographyNewestFirst(tv),
    };
  }, [castCredits, crewCredits]);

  const profileUri = profilePath
    ? `https://image.tmdb.org/t/p/w342${profilePath}`
    : null;

  const openTitle = (entry: FilmographyEntry) => {
    router.push({
      pathname: "/(tabs)/mediaDetails",
      params: {
        id: String(entry.id),
        title: entry.title,
        mediaType: entry.media_type,
        overview: entry.overview ?? "",
        posterPath: entry.poster_path ?? "",
        voteAverage:
          entry.vote_average != null ? String(entry.vote_average) : "",
        voteCount: entry.vote_count != null ? String(entry.vote_count) : "",
      },
    });
  };

  const renderFilmographyRow = (entry: FilmographyEntry) => {
    const poster = getPosterUrl(entry.poster_path, null);
    const yearRaw = entry.release_date ?? entry.first_air_date ?? "";
    const year = yearRaw ? yearRaw.slice(0, 4) : "";
    const typeLabel =
      entry.media_type === "tv" ? "TV Show" : entry.media_type === "movie" ? "Movie" : "";
    const rolesText = entry.roleLabels.join(" · ");
    let genresText = "";
    if (entry.genre_ids?.length) {
      genresText = getGenreNames(entry.genre_ids, entry.media_type)
        .slice(0, 3)
        .join(", ");
    }
    const metaBits = [typeLabel, year].filter(Boolean);

    return (
      <Pressable
        key={`${entry.media_type}-${entry.id}`}
        style={styles.filmRow}
        onPress={() => openTitle(entry)}
      >
        {poster ? (
          <Image source={{ uri: poster }} style={styles.filmPoster} />
        ) : (
          <View style={styles.filmPosterFallback}>
            <Text style={styles.filmPosterFallbackText}>No Img</Text>
          </View>
        )}
        <View style={styles.filmMeta}>
          <Text style={styles.filmTitle}>{entry.title}</Text>
          {rolesText.length > 0 ? (
            <Text style={styles.filmRole}>{rolesText}</Text>
          ) : null}
          {metaBits.length > 0 ? (
            <Text style={styles.filmMetaSmall}>{metaBits.join(" · ")}</Text>
          ) : null}
          {genresText.length > 0 ? (
            <Text style={styles.filmGenres}>{genresText}</Text>
          ) : null}
        </View>
      </Pressable>
    );
  };

  const renderFilmographySection = (
    sectionTitle: string,
    entries: FilmographyEntry[],
  ) => {
    if (entries.length === 0) return null;
    return (
      <View style={styles.subSection}>
        <Text style={styles.subSectionTitle}>{sectionTitle}</Text>
        {entries.map((e) => renderFilmographyRow(e))}
      </View>
    );
  };

  const deptLabel = displayDepartment(department);

  return (
    <View style={styles.page}>
      <Pressable onPress={() => router.push("/(tabs)/settings")}>
        <Header />
      </Pressable>

      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
          <Pressable
            style={styles.backRow}
            onPress={() => router.back()}
            hitSlop={10}
          >
            <View style={styles.backIconWrap}>
              <Ionicons name="chevron-back" size={20} color="#666" />
            </View>
            <Text style={styles.backText} numberOfLines={3}>
              {backLabel}
            </Text>
          </Pressable>

          <View style={styles.heroCard}>
            <View style={styles.heroRow}>
              {profileUri ? (
                <Image
                  source={{ uri: profileUri }}
                  style={styles.posterLarge}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.noPosterLarge}>
                  <Text style={styles.noPosterText}>No Img</Text>
                </View>
              )}
              <View style={styles.heroMeta}>
                <Text style={styles.title}>{personName}</Text>
                {deptLabel.length > 0 ? (
                  <Text style={styles.type}>{deptLabel}</Text>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.sectionBody}>
              {biography && biography.trim().length > 0
                ? biography
                : "No biography available for this person yet."}
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.castHeaderRow}>
              <View style={styles.castHeaderLeft}>
                <View style={styles.castAccentBar} />
                <Text style={styles.sectionTitle}>Filmography</Text>
              </View>
            </View>
            {films.length === 0 &&
            documentaries.length === 0 &&
            tvShows.length === 0 ? (
              <Text style={styles.sectionBody}>
                No credited titles available yet.
              </Text>
            ) : (
              <>
                {renderFilmographySection("Films", films)}
                {renderFilmographySection("Documentaries", documentaries)}
                {renderFilmographySection("TV shows", tvShows)}
              </>
            )}
          </View>
        </ScrollView>
      )}

      <NavBar />
      <StatusBar style="auto" />
    </View>
  );
};

export default PersonScreen;

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
  loader: {
    marginTop: 24,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  backIconWrap: {
    marginTop: 2,
    marginRight: 4,
  },
  backText: {
    flex: 1,
    fontSize: 14,
    color: "#666666",
    fontFamily: "DM Sans",
    lineHeight: 20,
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
    backgroundColor: "#f0f0f0",
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
  subSection: {
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginTop: 8,
    marginBottom: 6,
    fontFamily: "DM Sans",
  },
  filmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
  },
  filmPoster: {
    width: 52,
    height: 78,
    borderRadius: 6,
    backgroundColor: "#d9d9d9",
  },
  filmPosterFallback: {
    width: 52,
    height: 78,
    borderRadius: 6,
    backgroundColor: "#d9d9d9",
    alignItems: "center",
    justifyContent: "center",
  },
  filmPosterFallbackText: {
    fontSize: 9,
    color: "#555",
    fontFamily: "DM Sans",
  },
  filmMeta: {
    flex: 1,
    justifyContent: "center",
  },
  filmTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    fontFamily: "DM Sans",
  },
  filmRole: {
    marginTop: 4,
    fontSize: 12,
    color: "#666",
    fontFamily: "DM Sans",
  },
  filmMetaSmall: {
    marginTop: 2,
    fontSize: 12,
    color: "#888",
    fontFamily: "DM Sans",
  },
  filmGenres: {
    marginTop: 2,
    fontSize: 12,
    color: "#888",
    fontFamily: "DM Sans",
  },
});
