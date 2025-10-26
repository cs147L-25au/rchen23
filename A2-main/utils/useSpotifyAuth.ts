import { useEffect, useState } from "react";
import { ResponseType, useAuthRequest } from "expo-auth-session";

import getEnv from "./env";
import { SpotifyAuthResponse } from "./types";
import { exchangeCodeForToken } from "./apiOptions";

const {
  REDIRECT_URI,
  SCOPES,
  CLIENT_ID,
  SPOTIFY_API: { DISCOVERY },
} = getEnv();

export function useSpotifyAuth() {
  const [authResponse, setAuthResponse] = useState<SpotifyAuthResponse | null>(
    null
  );

  const [request, response, getSpotifyAuth] = useAuthRequest(
    {
      responseType: ResponseType.Code,
      clientId: CLIENT_ID,
      scopes: SCOPES,
      redirectUri: REDIRECT_URI,
    },
    DISCOVERY
  );

  useEffect(() => {
    if (
      response?.type === "success" &&
      request?.codeVerifier &&
      !authResponse
    ) {
      const { code } = response.params;
      if (code) {
        exchangeCodeForToken(
          code,
          request.codeVerifier,
          REDIRECT_URI,
          CLIENT_ID
        )
          .then((data) => {
            setAuthResponse(data);
          })
          .catch((e) => {
            console.error(e);
          });
      }
    }
  }, [response, request]);

  return { authResponse, getSpotifyAuth };
}
