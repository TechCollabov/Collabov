#!/usr/bin/env bash
# Generates .mcp.json from environment variables so secrets never live in git.
# Required env vars: SUPABASE_PAT, RENDER_API_KEY
# Optional: SUPABASE_PROJECT_REF (defaults to wxaqktctykpmeeavocil)

PROJECT_REF="${SUPABASE_PROJECT_REF:-wxaqktctykpmeeavocil}"

if [ -z "$SUPABASE_PAT" ] || [ -z "$RENDER_API_KEY" ]; then
  echo "[generate-mcp] WARNING: SUPABASE_PAT or RENDER_API_KEY not set — .mcp.json not updated"
  exit 0
fi

cat > "$(dirname "$0")/../.mcp.json" <<EOF
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=${PROJECT_REF}",
      "headers": {
        "Authorization": "Bearer ${SUPABASE_PAT}"
      }
    },
    "render": {
      "type": "http",
      "url": "https://mcp.render.com/mcp",
      "headers": {
        "Authorization": "Bearer ${RENDER_API_KEY}"
      }
    }
  }
}
EOF

echo "[generate-mcp] .mcp.json written successfully"
