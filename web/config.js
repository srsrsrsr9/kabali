/* Supabase connection for this deployment.
 *
 * The publishable (anon) key is meant to be public — it ships in every
 * Supabase browser app and is visible to anyone who opens this page. What
 * protects the rows is the row-level security policy in schema.sql: a
 * signed-in user can read and write only rows where user_id = auth.uid().
 * Never put the service_role / secret key here; that one bypasses RLS.
 *
 * If these are blanked out the tracker still works, saving to whichever
 * device it is opened on and nothing else.
 */
window.TRACKER_CONFIG = {
  supabaseUrl: "https://fhymnqrtfdolmedurlcd.supabase.co",
  supabaseAnonKey: "sb_publishable_ivZC4xHSu6H08gampLoBpA_FyEsnVUL"
};
