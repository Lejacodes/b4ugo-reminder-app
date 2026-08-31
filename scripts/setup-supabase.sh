#!/usr/bin/env bash
# One-time Supabase setup for BLUGO.
# Creates/links a project, writes .env, pushes the schema, deploys little-guy, sets Gemini secret.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env"
CLI="npx --yes supabase@latest"

cd "$ROOT"

echo "→ Checking Supabase login…"
if ! $CLI projects list >/dev/null 2>&1; then
  echo "   Opening browser to log in…"
  $CLI login
fi

echo "→ Your Supabase projects:"
$CLI projects list

if [[ -f "$ROOT/.supabase/project-ref" ]]; then
  PROJECT_REF="$(cat "$ROOT/.supabase/project-ref")"
  echo "→ Already linked to project: $PROJECT_REF"
else
  read -r -p "Paste your project ref (from the list above), or press Enter to create a new one: " PROJECT_REF
  if [[ -z "$PROJECT_REF" ]]; then
    echo "→ Your organizations:"
    $CLI orgs list
    read -r -p "Organization ID: " ORG_ID
    read -r -p "New project name [b4ugo]: " PROJECT_NAME
    PROJECT_NAME="${PROJECT_NAME:-b4ugo}"
    DB_PASSWORD="$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)"
    echo "→ Creating project (region: eu-central-1)…"
    CREATE_JSON="$($CLI projects create "$PROJECT_NAME" --org-id "$ORG_ID" --db-password "$DB_PASSWORD" --region eu-central-1 -o json)"
    PROJECT_REF="$(echo "$CREATE_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log(j.id||j.ref||'');})")"
    echo "   Created project ref: $PROJECT_REF"
    echo "   Database password (save this): $DB_PASSWORD"
  fi
  $CLI link --project-ref "$PROJECT_REF"
fi

PROJECT_REF="$(cat "$ROOT/.supabase/project-ref")"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

echo "→ Fetching API keys…"
KEYS_JSON="$($CLI projects api-keys --project-ref "$PROJECT_REF" --reveal -o json)"
ANON_KEY="$(echo "$KEYS_JSON" | node -e "
let d='';
process.stdin.on('data',c=>d+=c);
process.stdin.on('end',()=>{
  const keys=JSON.parse(d);
  const anon=(Array.isArray(keys)?keys:keys.data||[]).find(k=>/anon|publishable/i.test(k.name||k.type||''));
  console.log(anon?.api_key||anon?.key||'');
});
")"

if [[ -z "$ANON_KEY" ]]; then
  echo "Could not read anon key. Copy it from Supabase → Project Settings → API."
  exit 1
fi

# Keep an existing Gemini key if present.
GEMINI_KEY=""
if [[ -f "$ENV_FILE" ]] && grep -q '^GEMINI_API_KEY=' "$ENV_FILE"; then
  GEMINI_KEY="$(grep '^GEMINI_API_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d '\"')"
fi
if [[ -z "$GEMINI_KEY" ]]; then
  read -r -p "Paste your Gemini API key (from aistudio.google.com/apikey): " GEMINI_KEY
fi

cat > "$ENV_FILE" <<EOF
# BLUGO — client-safe values only (gitignored)
EXPO_PUBLIC_AUTH_PROVIDER=supabase
EXPO_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
EXPO_PUBLIC_AI_API_URL=supabase

# Server-only: used by scripts/setup-supabase.sh when deploying the edge function.
# Never prefix with EXPO_PUBLIC_.
GEMINI_API_KEY=${GEMINI_KEY}
EOF

echo "→ Wrote $ENV_FILE"

echo "→ Pushing database schema…"
$CLI db push

echo "→ Syncing auth config (disables email confirmation for dev)…"
$CLI config push --project-ref "$PROJECT_REF"

echo "→ Setting Gemini secret and deploying little-guy…"
$CLI secrets set "GEMINI_API_KEY=${GEMINI_KEY}" --project-ref "$PROJECT_REF"
$CLI functions deploy little-guy --project-ref "$PROJECT_REF"

echo ""
echo "Done."
echo "  URL:  $SUPABASE_URL"
echo "  Next: restart Metro (Ctrl+C, then npm run ios)"
echo ""
echo "In Supabase dashboard → Authentication → Providers, email confirmation should be off after config push."
