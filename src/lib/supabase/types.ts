/**
 * DB-Typen für die Tabellen in `supabase/migrations/`.
 *
 * Manuell gepflegt — bei Schema-Änderungen hier mit nachziehen, oder später
 * via `supabase gen types typescript --project-id ...` automatisch generieren.
 */

export type AuthProvider = "apple" | "google" | "email" | "anonymous";
export type UserRole = "user" | "admin";
export type OrbitType = "city" | "country" | "region";
export type FriendStatus = "mutual" | "pending";
export type MeetupStatus = "open" | "accepted" | "completed" | "cancelled";
export type ParticipantResponse =
  | "pending"
  | "accepted"
  | "declined"
  | "reschedule";
export type NotificationType =
  | "invite"
  | "reschedule"
  | "new_in_orbit"
  | "new_signup"
  | "trip_overlap";

export type Database = {
  public: {
    Tables: {
      users: Row<{
        id: string;
        auth_provider: AuthProvider;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        username: string | null;
        avatar_url: string | null;
        phone: string | null;
        phone_hash: string | null;
        role: UserRole;
        created_at: string;
        updated_at: string;
      }>;
      user_settings: Row<{
        user_id: string;
        share_location: boolean;
        mutual_min_friends: number;
        notification_prefs: Record<string, boolean>;
        locale: string;
        created_at: string;
        updated_at: string;
      }>;
      user_locations: Row<{
        user_id: string;
        orbit_id: string;
        last_seen_at: string;
        updated_at: string;
      }>;
      orbits: Row<{
        id: string;
        slug: string;
        name: string;
        type: OrbitType;
        country_code: string | null;
        centroid_lat: number | null;
        centroid_lng: number | null;
        bbox_south: number | null;
        bbox_west: number | null;
        bbox_north: number | null;
        bbox_east: number | null;
        published: boolean;
        created_at: string;
        updated_at: string;
      }>;
      contacts: Row<{
        id: string;
        user_id: string;
        phone_hash: string;
        display_name: string;
        matched_user_id: string | null;
        matched_at: string | null;
        created_at: string;
        updated_at: string;
      }>;
      friend_links: Row<{
        user_a: string;
        user_b: string;
        status: FriendStatus;
        created_at: string;
        updated_at: string;
      }>;
      meetups: Row<{
        id: string;
        creator_id: string;
        title: string;
        date: string;
        time: string | null;
        location: string | null;
        category: string | null;
        description: string | null;
        status: MeetupStatus;
        orbit_id: string | null;
        created_at: string;
        updated_at: string;
      }>;
      meetup_participants: Row<{
        id: string;
        meetup_id: string;
        participant_id: string | null;
        guest_name: string | null;
        guest_phone_hash: string | null;
        magic_token: string | null;
        response: ParticipantResponse;
        response_message: string | null;
        responded_at: string | null;
        created_at: string;
        updated_at: string;
      }>;
      trips: Row<{
        id: string;
        user_id: string;
        orbit_id: string;
        start_date: string;
        end_date: string;
        reason: string | null;
        parent_trip_id: string | null;
        created_at: string;
        updated_at: string;
      }>;
      trip_participants: Row<{
        trip_id: string;
        user_id: string;
        added_at: string;
      }>;
      notifications: Row<{
        id: string;
        user_id: string;
        type: NotificationType;
        payload: Record<string, unknown>;
        read_at: string | null;
        created_at: string;
      }>;
      invites: Row<{
        id: string;
        inviter_id: string;
        link_token: string;
        target_phone_hash: string | null;
        accepted_by_user_id: string | null;
        accepted_at: string | null;
        created_at: string;
        expires_at: string | null;
      }>;
      cms_content: Row<{
        id: string;
        key: string;
        locale: string;
        body: Record<string, unknown>;
        published: boolean;
        published_at: string | null;
        updated_by: string | null;
        created_at: string;
        updated_at: string;
      }>;
      cms_assets: Row<{
        id: string;
        key: string;
        storage_path: string;
        meta: Record<string, unknown>;
        updated_by: string | null;
        created_at: string;
        updated_at: string;
      }>;
      events: Row<{
        id: number;
        user_id: string | null;
        name: string;
        props: Record<string, unknown>;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      auth_provider: AuthProvider;
      user_role: UserRole;
      orbit_type: OrbitType;
      friend_status: FriendStatus;
      meetup_status: MeetupStatus;
      participant_response: ParticipantResponse;
      notification_type: NotificationType;
    };
    CompositeTypes: Record<string, never>;
  };
};

type Row<T> = { Row: T; Insert: Partial<T>; Update: Partial<T> };
