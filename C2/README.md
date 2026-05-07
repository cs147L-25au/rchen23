# MyFlix 🎬

A social media platform for movie and TV show enthusiasts. Rate, review, and discover what your friends think about films and shows.

## Features

### Core Functionality
- **Rate & Review**: Give movies and TV shows personalized ratings, write detailed reviews, and categorize them (Good, Alright, Bad)
- **Social Feed**: View activities from friends - their ratings, bookmarks, and reviews in real-time
- **Watchlist Management**: Bookmark movies and TV shows to watch later; toggle bookmarks from feed with optimistic UI updates
- **Friend Network**: Follow friends, view their profiles, and see their activity and ratings
- **Comments & Discussions**: Comment on ratings and discuss what friends think about media
- **Likes & Engagement**: Like posts, see who liked them, and engage with friend content

### Discovery & Search
- **Smart Search**: Search across movies, TV shows, and actors with TMDB integration
- **Browse by Genre**: Discover content organized by genre and type
- **Leaderboard**: See who's rated the most content and compete with friends
- **Recent Movies Carousel**: Quickly access recently released and trending content

### User Experience
- **Dark Mode Support**: Full dark theme with automatic preference detection
- **Friend Activity Cards**: Real friend names, profile photos, ratings, and review snippets
- **Mutual Followers Only**: "What your friends think" section shows only mutual followers (bidirectional follows)
- **Optimistic UI Updates**: Instant feedback on actions with automatic rollback on errors
- **Preserved Navigation State**: Tab switching preserves feed state and scroll position
- **Accurate Back Navigation**: Context-aware back buttons showing which screen you're returning to

### Ranking System
- **Score Unlocking**: Scores are hidden until users rate 10+ items in a category
- **Category Tracking**: Different ranking tiers for movies, documentaries, and TV shows
- **Global Rankings**: Compete on a leaderboard with other users

## Tech Stack

### Frontend
- **React Native** 19.1.0 - Cross-platform mobile framework
- **Expo** 54.0 - Managed React Native platform
- **Expo Router** 6.0 - File-based routing and navigation
- **TypeScript** 5.9 - Type-safe development
- **React Navigation** 7.4 - Tab and stack navigation

### Backend & Database
- **Supabase** - PostgreSQL database and authentication
- **Authentication**: Email-based auth with Supabase Auth
- **Real-time Updates**: Supabase subscriptions for live feed updates

### APIs & Services
- **TMDB API** - Movie and TV show metadata, cast, crew, and posters
- **React Query/Hooks**: Async state management for API calls

### UI Components
- **React Native UI**: Native components (Pressable, FlatList, ScrollView, etc.)
- **Expo Vector Icons** - Ionicons and FontAwesome icons
- **Custom Theming**: Context-based dark/light mode with design tokens
- **Responsive Design**: Adapts to different screen sizes and orientations

## Project Structure

```
MyFlix/
├── app/                    # Expo Router screens (file-based routing)
│   ├── (tabs)/            # Bottom tab navigation
│   │   ├── feed.tsx       # Friend activity feed
│   │   ├── search.tsx     # Search movies/shows/people
│   │   ├── list.tsx       # My ratings and watchlist
│   │   ├── leaderboard.tsx # User rankings
│   │   ├── settings.tsx   # Profile & settings
│   │   ├── editProfile.tsx # Edit profile info
│   │   ├── mediaDetails.tsx # Movie/show detail page
│   │   └── allMovies.tsx  # Browse all movies
│   ├── person/[personId].tsx # Actor/crew member profile
│   ├── postComments/[eventId].tsx # Comments on a rating
│   ├── user/[userId].tsx  # Other user profiles
│   ├── auth.tsx           # Login/signup
│   ├── onboarding*.tsx    # Onboarding flow
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
│   ├── FeedBar.tsx       # Main feed with optimistic updates
│   ├── FeedItem.tsx      # Individual feed item
│   ├── FriendActivityCard.tsx # Friend's rating with profile
│   ├── RatingModal/      # Rating submission modal
│   ├── Header.tsx        # Top app header
│   ├── NavBar.tsx        # Bottom navigation bar
│   ├── Carousel.tsx      # Recent movies carousel
│   ├── SearchResults.tsx # Search results list
│   └── LikesModal.tsx    # Show who liked a post
├── contexts/             # React Context for state
│   ├── ThemeContext.tsx  # Dark/light mode
│   ├── MediaCache.tsx    # Media detail caching
├── database/             # Supabase queries
│   ├── db.ts            # Supabase client
│   ├── queries.ts       # RPC functions and types
├── lib/                  # Utility functions
│   ├── ratingsDb.ts     # Rating CRUD and scoring
│   ├── friendsDb.ts     # Follow/unfollow logic
│   ├── watchlistDb.ts   # Bookmark management
│   ├── likesDb.ts       # Like functionality
│   ├── commentsDb.ts    # Comments and replies
├── constants/            # Design tokens
│   └── theme.ts         # Color palettes and typography
├── TMDB.ts              # TMDB API integration
├── supabase/            # Supabase migrations
└── assets/              # Images, icons, splash screen
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- Supabase account and project
- TMDB API key (free from [themoviedb.org](https://www.themoviedb.org/settings/api))
- iOS Simulator, Android Emulator, or Expo Go app

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Baffoii/MyFlix.git
   cd MyFlix
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   TMDB_API_KEY=your_tmdb_api_key
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open in your device/emulator**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app (iOS Camera or Android Expo Go)

## Key Features Explained

### Optimistic UI Updates
Actions like liking, bookmarking, and commenting update instantly on the UI, with automatic rollback if the server request fails:
```typescript
// Example: Bookmark optimistically updates then either confirms or reverts
setBookmarked((prev) => {
  const newSet = new Set(prev);
  newSet.add(item.event_id);
  return newSet;
});
// Server call happens in background...
```

### Score Masking System
Scores are hidden until users have rated 10+ items in a category to prevent gaming:
```
Movie scores show after rating 10 movies
Documentary scores show after rating 10 documentaries
TV show scores show after rating 10 TV shows
```

### Feed Caching
Tab navigation preserves feed state and scroll position by:
- Removing automatic reload on tab focus
- Caching media detail parameters
- Only loading fresh data on explicit user action

### Mutual Follower Filtering
The "What your friends think" section only shows ratings from users you follow AND who follow you back (mutual followers).

## API Integration

### TMDB Integration
- Search movies, TV shows, and actors
- Get cast and crew information
- Fetch detailed metadata (runtime, release date, genres, ratings)
- Load poster images and profile photos

### Supabase Database
- User authentication and profiles
- Rating and review storage
- Friend/follow relationships
- Comments and replies
- Like/engagement tracking
- Watchlist management

## Development Workflow

### Adding a New Feature
1. Create components in `/components`
2. Add database queries in `/lib` if needed
3. Create screens in `/app` using file-based routing
4. Update theme constants if adding new colors/styles
5. Test across iOS/Android

### Styling
- All components use `StyleSheet.create()` for performance
- Colors and spacing use theme tokens from `ThemeContext`
- Dark mode is applied globally; no per-component changes needed

### State Management
- React hooks (`useState`, `useCallback`, `useEffect`)
- React Context for theme and media caching
- Local component state for UI interactions
- Supabase for remote state and persistence

## Performance Optimizations

- **Optimistic Updates**: Instant UI feedback without waiting for server
- **Lazy Loading**: Images and content load on-demand
- **Memoization**: `useMemo` for expensive computations
- **Navigation Caching**: Preserves screen state across tab switches
- **Efficient Lists**: FlatList with proper key extraction and item separators

## Theming System

Colors are defined in `constants/theme.ts` and support both light and dark modes:
```typescript
const lightTheme: ThemeColors = {
  background: "#F5F5F5",
  primary: "#FF3B30",  // MyFlix red
  textPrimary: "#000000",
  // ... more colors
};
```

Apply theme everywhere using `useAppTheme()`:
```typescript
const { colors: t, mode } = useAppTheme();
// Use t.primary, t.background, etc.
```

## Database Schema

Key tables in Supabase:
- `profiles` - User information and profile pictures
- `user_ratings` - Movie/show ratings and reviews
- `friends` - Follow relationships
- `likes` - Likes on ratings and comments
- `comments` - Comments on ratings with threaded replies
- `watchlist` - Bookmarked movies/shows

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Standards
- TypeScript for all code
- Functional components with hooks
- Consistent naming conventions
- Comments for complex logic
- Responsive design for all screen sizes

## Known Limitations & Future Improvements

### Current Limitations
- Scores are text-based (1-10) rather than star ratings
- No offline mode yet
- Comments don't support rich text formatting
- Limited to TMDB content

### Planned Features
- Push notifications for friend activity
- Advanced filtering and sorting on watchlist
- Social sharing to external platforms
- In-app messaging between friends
- Recommendations based on ratings
- Collections and curated lists

## Troubleshooting

### App won't start
```bash
# Clear cache and rebuild
npm install
expo prebuild --clean
npm start
```

### Supabase connection errors
- Verify environment variables in `.env.local`
- Check Supabase project is active
- Ensure API keys are correct

### TMDB API errors
- Verify TMDB API key is valid
- Check API rate limits (40 requests/10 seconds)
- Ensure API key has required permissions

## License

This project is private. All rights reserved.

## Contact

**Richard Chen (Baffoii)**
- GitHub: [@Baffoii](https://github.com/Baffoii)
- Email: richardchen2023@gmail.com

---

**Built with React Native, Expo, and Supabase** 🚀
