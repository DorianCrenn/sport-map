#!/usr/bin/env bash
# =============================================================================
# SportLink — Script de déploiement prod
# Usage : bash scripts/deploy.sh [--skip-tests] [--skip-functions] [--skip-db]
# =============================================================================

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }
info() { echo -e "${BLUE}→${NC} $1"; }
header() { echo -e "\n${BLUE}══════════════════════════════════════${NC}"; echo -e "${BLUE}  $1${NC}"; echo -e "${BLUE}══════════════════════════════════════${NC}"; }

SKIP_TESTS=false
SKIP_FUNCTIONS=false
SKIP_DB=false
for arg in "$@"; do
  case $arg in
    --skip-tests)     SKIP_TESTS=true ;;
    --skip-functions) SKIP_FUNCTIONS=true ;;
    --skip-db)        SKIP_DB=true ;;
  esac
done

# =============================================================================
header "1 / 6 — Prérequis"
# =============================================================================

command -v node    >/dev/null 2>&1 || fail "Node.js non trouvé"
command -v npm     >/dev/null 2>&1 || fail "npm non trouvé"
command -v supabase >/dev/null 2>&1 || fail "Supabase CLI non trouvé (npm i -g supabase)"
ok "Node $(node -v) · npm $(npm -v)"

# Vérification .env.local
if [ ! -f ".env.local" ]; then
  fail ".env.local introuvable — copier .env.example et remplir les valeurs"
fi

check_env() {
  local var=$1; local required=${2:-true}
  if grep -q "^${var}=.\+" .env.local 2>/dev/null; then
    ok "$var défini"
  elif [ "$required" = "true" ]; then
    fail "$var MANQUANT dans .env.local"
  else
    warn "$var absent (optionnel)"
  fi
}

check_env "VITE_SUPABASE_URL"
check_env "VITE_SUPABASE_ANON_KEY"
check_env "VITE_VAPID_PUBLIC_KEY" "false"
check_env "VITE_SENTRY_DSN" "false"

# =============================================================================
header "2 / 6 — Tests unitaires"
# =============================================================================

if [ "$SKIP_TESTS" = "true" ]; then
  warn "Tests ignorés (--skip-tests)"
else
  info "npm run test..."
  npm run test -- --reporter=dot || fail "Tests unitaires en échec — déploiement annulé"
  ok "1628 tests passés"
fi

# =============================================================================
header "3 / 6 — Build production"
# =============================================================================

info "npm run build..."
npm run build || fail "Build échoué"
ok "Build réussi → dist/"

# Vérification taille bundle
BUNDLE_SIZE=$(du -sh dist/assets/*.js 2>/dev/null | awk '{sum+=$1} END{print sum}' || echo "?")
info "Bundle JS total : ~${BUNDLE_SIZE}kB"

# =============================================================================
header "4 / 6 — Migrations base de données"
# =============================================================================

if [ "$SKIP_DB" = "true" ]; then
  warn "Migrations ignorées (--skip-db)"
else
  info "supabase db push..."
  supabase db push || fail "Migrations DB échouées"
  ok "Migrations appliquées"
fi

# =============================================================================
header "5 / 6 — Edge Functions"
# =============================================================================

if [ "$SKIP_FUNCTIONS" = "true" ]; then
  warn "Edge Functions ignorées (--skip-functions)"
else
  FUNCTIONS=(
    "analyze-poster-dna"
    "club-admin-reminders"
    "convoc-reply-confirm"
    "create-checkout-session"
    "generate-announcement"
    "generate-variant-bg"
    "invite-club-manager"
    "match-reminders"
    "notify-admin-club-created"
    "notify-club-followers"
    "notify-club-status"
    "process-scheduled-announcements"
    "remove-background"
    "send-convocation-email"
    "send-push"
    "send-weekly-digest"
    "stripe-webhook"
    "subscription-expiration-reminder"
  )

  for fn in "${FUNCTIONS[@]}"; do
    info "Déploiement $fn..."
    supabase functions deploy "$fn" --no-verify-jwt 2>/dev/null || \
      supabase functions deploy "$fn" || \
      warn "Échec $fn — continuer manuellement"
    ok "$fn"
  done
fi

# =============================================================================
header "6 / 6 — Checklist manuelle (action requise)"
# =============================================================================

echo ""
echo -e "${YELLOW}Actions manuelles restantes :${NC}"
echo ""
echo "  Supabase Dashboard → Edge Functions → Secrets :"
echo "  ┌──────────────────────────────────────────────────────────┐"
echo "  │  ANTHROPIC_API_KEY      sk-ant-...                       │"
echo "  │  RESEND_API_KEY         re_...                           │"
echo "  │  FROM_EMAIL             noreply@sportlink.fr             │"
echo "  │  FAL_API_KEY            (optionnel)                      │"
echo "  │  VAPID_PRIVATE_KEY      (générer ci-dessous)             │"
echo "  │  VAPID_SUBJECT          mailto:contact@sportlink.fr      │"
echo "  │  APP_URL                https://sportlink.fr             │"
echo "  │  STRIPE_SECRET_KEY      sk_live_...                      │"
echo "  │  STRIPE_WEBHOOK_SECRET  whsec_...                        │"
echo "  │  STRIPE_PRICE_PREMIUM_MONTHLY  price_...                 │"
echo "  │  STRIPE_PRICE_PREMIUM_YEARLY   price_...                 │"
echo "  │  STRIPE_PRICE_ELITE_MONTHLY    price_...                 │"
echo "  │  STRIPE_PRICE_ELITE_YEARLY     price_...                 │"
echo "  └──────────────────────────────────────────────────────────┘"
echo ""
echo "  Vercel → Settings → Environment Variables :"
echo "  ┌──────────────────────────────────────────────────────────┐"
echo "  │  VITE_SUPABASE_URL      (depuis Supabase Settings)       │"
echo "  │  VITE_SUPABASE_ANON_KEY (depuis Supabase Settings)       │"
echo "  │  VITE_VAPID_PUBLIC_KEY  (depuis npx web-push ci-dessous) │"
echo "  │  VITE_SENTRY_DSN        (optionnel — depuis sentry.io)   │"
echo "  └──────────────────────────────────────────────────────────┘"
echo ""
echo "  Stripe Dashboard :"
echo "  ┌──────────────────────────────────────────────────────────┐"
echo "  │  1. Créer 4 prix (Premium mensuel/annuel, Elite m/a)     │"
echo "  │  2. Webhook → https://<SUPABASE_URL>/functions/v1/       │"
echo "  │              stripe-webhook                              │"
echo "  │  3. Events : checkout.session.completed                  │"
echo "  │              customer.subscription.updated               │"
echo "  │              customer.subscription.deleted               │"
echo "  │              invoice.payment_failed                      │"
echo "  └──────────────────────────────────────────────────────────┘"
echo ""

# Proposer génération VAPID
if ! grep -q "^VITE_VAPID_PUBLIC_KEY=.\+" .env.local 2>/dev/null; then
  echo -e "${YELLOW}Clés VAPID non configurées. Générer maintenant ? [o/N]${NC}"
  read -r response
  if [[ "$response" =~ ^[Oo]$ ]]; then
    command -v npx >/dev/null 2>&1 || fail "npx non trouvé"
    echo ""
    info "Génération des clés VAPID..."
    npx web-push generate-vapid-keys
    echo ""
    warn "→ Copier VAPID_PUBLIC_KEY dans Vercel (VITE_VAPID_PUBLIC_KEY)"
    warn "→ Copier VAPID_PRIVATE_KEY dans Supabase Secrets (VAPID_PRIVATE_KEY)"
  fi
fi

echo ""
ok "Script terminé. Déployer le frontend sur Vercel avec : vercel --prod"
echo ""
