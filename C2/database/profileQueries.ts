// database/profileQueries.ts
// Profile-related database operations for onboarding and user management

import db from "./db";

export interface UserProfile {
  id: string;
  display_name: string;
  profile_pic: string | null;
  username: string | null;
  birthday: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  user_rank: number | null;
  weekly_streak: number | null;
  followers_count: number | null;
  following_count: number | null;
  bookmarked_count: number | null;
  created_at: string | null;
}

export interface CreateProfileInput {
  id: string; // Supabase auth user ID
  email: string;
  first_name: string;
  last_name: string;
  display_name?: string;
  username?: string;
}

export interface UpdateProfileInput {
  display_name?: string | null;
  profile_pic?: string | null;
  username?: string | null;
  birthday?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

/**
 * Create a new profile after user signup
 * Uses upsert to handle cases where profile already exists (e.g., user signed up before)
 */
export async function createProfile(
  input: CreateProfileInput,
): Promise<UserProfile | null> {
  try {
    const displayName =
      input.display_name || `${input.first_name} ${input.last_name}`.trim();

    // First check if profile already exists
    const existing = await getProfileById(input.id);
    if (existing) {
      console.log(
        "✅ createProfile: Profile already exists for user:",
        input.id,
      );
      return existing;
    }

    const { data, error } = await db
      .from("profiles")
      .insert({
        id: input.id,
        email: input.email,
        first_name: input.first_name,
        last_name: input.last_name,
        display_name: displayName,
        username: input.username || null,
        user_rank: 0,
        weekly_streak: 0,
        followers_count: 0,
        following_count: 0,
        bookmarked_count: 0,
      })
      .select()
      .single();

    if (error) {
      // If duplicate key error, try to get the existing profile
      if (error.code === "23505") {
        console.log(
          "⚠️ createProfile: Profile already exists, fetching existing...",
        );
        return await getProfileById(input.id);
      }
      console.error("❌ createProfile error:", error);
      throw error;
    }

    console.log("✅ createProfile: Created profile for user:", input.id);
    return data as UserProfile;
  } catch (error: any) {
    console.error("❌ createProfile failed:", error?.message || error);
    // One more attempt to get existing profile
    try {
      const existing = await getProfileById(input.id);
      if (existing) return existing;
    } catch {}
    return null;
  }
}

/**
 * Get a user's profile by ID
 */
export async function getProfileById(
  userId: string,
): Promise<UserProfile | null> {
  try {
    const { data, error } = await db
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - profile doesn't exist
        console.log("⚠️ getProfileById: No profile found for:", userId);
        return null;
      }
      throw error;
    }

    return data as UserProfile;
  } catch (error: any) {
    console.error("❌ getProfileById failed:", error?.message || error);
    return null;
  }
}

/**
 * Update a user's profile
 */
export async function updateProfile(
  userId: string,
  updates: UpdateProfileInput,
): Promise<UserProfile | null> {
  try {
    const { data, error } = await db
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("❌ updateProfile error:", error);
      throw error;
    }

    console.log("✅ updateProfile: Updated profile for user:", userId);
    return data as UserProfile;
  } catch (error: any) {
    console.error("❌ updateProfile failed:", error?.message || error);
    return null;
  }
}

/**
 * Check if a profile exists for a user
 */
export async function profileExists(userId: string): Promise<boolean> {
  try {
    const { data, error } = await db
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;
    return data !== null;
  } catch (error: any) {
    console.error("❌ profileExists check failed:", error?.message || error);
    return false;
  }
}

/**
 * Upload a profile picture and update the user's profile
 * Returns the public URL of the uploaded image
 */
export async function uploadProfilePicture(
  userId: string,
  imageUri: string,
  mimeType: string = "image/jpeg",
): Promise<string | null> {
  try {
    // Generate a unique filename
    const fileExt = mimeType.split("/")[1] || "jpg";
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Fetch the image as a blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const { data, error } = await db.storage
      .from("profile-pictures")
      .upload(fileName, blob, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error("❌ uploadProfilePicture storage error:", error);
      throw error;
    }

    // Get the public URL
    const { data: urlData } = db.storage
      .from("profile-pictures")
      .getPublicUrl(data.path);

    const publicUrl = urlData.publicUrl;

    // Update the profile with the new picture URL
    await updateProfile(userId, { profile_pic: publicUrl });

    console.log(
      "✅ uploadProfilePicture: Uploaded and updated profile:",
      publicUrl,
    );
    return publicUrl;
  } catch (error: any) {
    console.error("❌ uploadProfilePicture failed:", error?.message || error);
    return null;
  }
}
