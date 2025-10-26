import axios, { AxiosResponse } from "axios";
import getEnv from "./env";
import { Track, SpotifyAuthResponse } from "./types";

const {
  SPOTIFY_API: { TOP_TRACKS_API, ALBUM_TRACK_API_GETTER, DISCOVERY },
} = getEnv();

const ERROR_ALERT = new Error(
  "Oh no! Something went wrong.\nCheck console for more details."
);

/* Spotify's Get album endpoint only gives us TrackObjectSimplified, so we need to
 * extend it to include the album name and image. */
interface SpotifyTrackObjectWithAlbum extends SpotifyApi.TrackObjectSimplified {
  album: {
    name: string;
    images: {
      url: string;
    }[];
  };
}

/* Pulls out the relevant data from the API response and puts it in a nicely structured object. */
const formatter = (
  data: Array<SpotifyApi.TrackObjectFull | SpotifyTrackObjectWithAlbum>
): Track[] =>
  data.map((val) => {
    const artists = val.artists?.map((artist) => ({ name: artist.name }));
    return {
      songTitle: val.name,
      songArtists: artists,
      albumName: val.album?.name,
      imageUrl: val.album?.images[0]?.url ?? undefined,
      duration: val.duration_ms,
      externalUrl: val.external_urls?.spotify ?? undefined,
      previewUrl: val.preview_url ?? undefined,
    };
  });

/* Fetches data from the given endpoint URL with the access token provided. */
const fetcher = <T>(
  url: string,
  token: string
): Promise<AxiosResponse<T> | null> => {
  return axios
    .get(url, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    })
    .catch((e) => {
      console.error(e);
      alert(ERROR_ALERT);
      return null;
    });
};

/* Fetches your top tracks from the Spotify API.
 * Make sure that TOP_TRACKS_API is set correctly in env.js */
export const getMyTopTracks = (token: string): Promise<Track[] | null> => {
  return fetcher<SpotifyApi.UsersTopTracksResponse>(TOP_TRACKS_API, token)
    .then((res) => {
      if (!res) {
        return null;
      } else {
        return formatter(res.data?.items);
      }
    })
    .catch((e) => {
      console.error(e);
      alert(ERROR_ALERT);
      return null;
    });
};

/* Fetches the given album from the Spotify API.
 * Make sure that ALBUM_TRACK_API_GETTER is set correctly in env.js */
export const getAlbumTracks = (
  albumId: string,
  token: string
): Promise<Track[] | null> => {
  return fetcher<SpotifyApi.SingleAlbumResponse>(
    ALBUM_TRACK_API_GETTER(albumId),
    token
  )
    .then((res) => {
      if (!res) {
        return null;
      } else {
        const transformedResponse = res.data?.tracks?.items?.map((item) => {
          return {
            ...item,
            album: { images: res.data?.images, name: res.data?.name },
          };
        });
        return formatter(transformedResponse);
      }
    })
    .catch((e) => {
      console.error(e);
      alert(ERROR_ALERT);
      return null;
    });
};

export const exchangeCodeForToken = (
  code: string,
  codeVerifier: string,
  REDIRECT_URI: string,
  CLIENT_ID: string
): Promise<SpotifyAuthResponse | null> => {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: codeVerifier,
  });

  return axios
    .post<SpotifyAuthResponse>(DISCOVERY.tokenEndpoint, params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
    .then((resp) => {
      if (!resp) {
        return null;
      } else {
        return resp.data;
      }
    })
    .catch((err) => {
      console.error("Error exchanging code for token:", err);
      alert(ERROR_ALERT);
      return null;
    });
};
