// Simple Vercel serverless endpoint to expose runtime env to the client
export default function handler(req, res) {
  res.status(200).json({
    url: process.env.SUPABASE_URL || null,
    anonKey: process.env.SUPABASE_ANON_KEY || null,
  });
}
