/* Fill these in to turn on syncing, then redeploy.
 *
 * Supabase → Project Settings → Data API (or API):
 *   supabaseUrl     is the Project URL,  https://xxxxxxxx.supabase.co
 *   supabaseAnonKey is the "anon" / "publishable" key
 *
 * The anon key is meant to be public — it ships in every Supabase browser
 * app. What protects your rows is the row-level security policy in
 * schema.sql, which lets a signed-in user touch only their own. Never put
 * the "service_role" key in this file: that one bypasses RLS entirely.
 *
 * Left as-is, the tracker still works and saves to this device only.
 */
window.TRACKER_CONFIG = {
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  supabaseAnonKey: "YOUR-ANON-KEY"
};
