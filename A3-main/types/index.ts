import type { Database } from "./database.types";

// Supabase Table SELECT Types
// Use these types when reading data from the posts, comments, and likes tables
export type PostSelect = Database["public"]["Views"]["posts"]["Row"];
export type CommentSelect = Database["public"]["Tables"]["comments"]["Row"];
export type LikeSelect = Database["public"]["Tables"]["likes"]["Row"];

// Supabase Table INSERT Types
// Use these types when inserting data into the posts, comments, and likes tables
// You should only need to pass the required values from these types, as the optional values will
// be set by the database automatically.
export type CommentInsert = Database["public"]["Tables"]["comments"]["Insert"];
export type PostInsert = Database["public"]["Tables"]["raw_posts"]["Insert"];
export type LikeInsert = Database["public"]["Tables"]["likes"]["Insert"];
