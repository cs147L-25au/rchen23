import React, { createContext, useContext, useState } from 'react';

export interface MediaDetailParams {
  id: string;
  title: string;
  mediaType: string;
  overview?: string;
  posterPath?: string;
  voteAverage?: string;
  voteCount?: string;
}

interface MediaCacheContextType {
  cachedMedia: Map<string, MediaDetailParams>;
  setMediaCache: (id: string, data: MediaDetailParams) => void;
  getMediaCache: (id: string) => MediaDetailParams | undefined;
}

const MediaCacheContext = createContext<MediaCacheContextType | undefined>(undefined);

export const MediaCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cachedMedia] = useState(() => new Map<string, MediaDetailParams>());

  const setMediaCache = (id: string, data: MediaDetailParams) => {
    cachedMedia.set(id, data);
  };

  const getMediaCache = (id: string) => {
    return cachedMedia.get(id);
  };

  return (
    <MediaCacheContext.Provider value={{ cachedMedia, setMediaCache, getMediaCache }}>
      {children}
    </MediaCacheContext.Provider>
  );
};

export const useMediaCache = () => {
  const context = useContext(MediaCacheContext);
  if (!context) {
    throw new Error('useMediaCache must be used within MediaCacheProvider');
  }
  return context;
};
