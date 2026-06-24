// Supabase connection for the Meet Add-on frontend.
// The anon key is PUBLISHABLE (safe to ship to the browser); RLS protects data.
// Swap these two values for the production project when you deploy to prod.
// Staging project ref: fmmnrrjkoqsfwhbmswic
export const SUPABASE_URL = 'https://fmmnrrjkoqsfwhbmswic.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_g-vl1ZkbB8xpQKy59zVYCg_qorO34MI';

// Roles that get the PF/host view. Anyone else (incl. login with no profile)
// gets the teacher view.
export const HOST_ROLES = ['pf', 'me_associate', 'mgmt'];
