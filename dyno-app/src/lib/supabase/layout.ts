import { supabase } from "@/lib/supabase/client";
import type { TabbedLayout } from "@/types/widget";
import { migrateLayout } from "@/lib/widgets/migration";

/**
 * Fetch the saved layout for a user from Supabase.
 * Returns a migrated TabbedLayout, or null if nothing stored.
 */
export async function fetchLayout(userId: string): Promise<TabbedLayout | null> {
  try {
    const { data, error } = await supabase
      .from("widget_layouts")
      .select("layout")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;

    const raw = data.layout;
    if (!raw) return null;

    return migrateLayout(raw);
  } catch {
    return null;
  }
}

/**
 * Save the layout for a user to Supabase (upsert).
 */
export async function saveLayoutToSupabase(
  userId: string,
  layout: TabbedLayout
): Promise<void> {
  try {
    await supabase
      .from("widget_layouts")
      .upsert(
        {
          user_id: userId,
          layout,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
  } catch {
    // non-critical
  }
}
