# SportLink — Guide de déploiement prod

## Lancement rapide

```bash
bash scripts/deploy.sh
```

Le script fait : tests → build → migrations DB → deploy Edge Functions → checklist manuelle.

Options :
```bash
bash scripts/deploy.sh --skip-tests      # ignorer les tests (risqué)
bash scripts/deploy.sh --skip-db         # ignorer les migrations
bash scripts/deploy.sh --skip-functions  # ignorer les Edge Functions
```

---

## Étapes détaillées

### 1. Prérequis locaux

```bash
npm install -g supabase   # CLI Supabase
supabase login            # authentification
supabase link             # lier au projet Supabase
```

### 2. Variables Vercel

Dans **Vercel → Settings → Environment Variables** (Production) :

| Variable | Valeur |
|----------|--------|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `VITE_VAPID_PUBLIC_KEY` | Généré avec `npx web-push generate-vapid-keys` |
| `VITE_SENTRY_DSN` | sentry.io → Settings → Projects → DSN *(optionnel)* |

### 3. Clés VAPID (push notifications)

```bash
npx web-push generate-vapid-keys
```

→ `VITE_VAPID_PUBLIC_KEY` → Vercel env vars  
→ `VAPID_PRIVATE_KEY` → Supabase Secrets (étape 4)

### 4. Secrets Supabase Edge Functions

**Supabase Dashboard → Edge Functions → Secrets** :

| Secret | Valeur | Priorité |
|--------|--------|----------|
| `ANTHROPIC_API_KEY` | console.anthropic.com | P1 |
| `RESEND_API_KEY` | resend.com/api-keys | **P0** |
| `FROM_EMAIL` | `noreply@sportlink.fr` | **P0** |
| `APP_URL` | `https://sportlink.fr` | **P0** |
| `VAPID_PRIVATE_KEY` | généré ci-dessus | P1 |
| `VAPID_SUBJECT` | `mailto:contact@sportlink.fr` | P1 |
| `FAL_API_KEY` | fal.ai/dashboard/keys | P2 *(fallback Pollinations)* |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com | **P0** |
| `STRIPE_WEBHOOK_SECRET` | étape 5 | **P0** |
| `STRIPE_PRICE_PREMIUM_MONTHLY` | étape 5 | **P0** |
| `STRIPE_PRICE_PREMIUM_YEARLY` | étape 5 | **P0** |
| `STRIPE_PRICE_ELITE_MONTHLY` | étape 5 | **P0** |
| `STRIPE_PRICE_ELITE_YEARLY` | étape 5 | **P0** |

### 5. Stripe

1. Dashboard → Products → Créer 4 produits :

| Produit | Intervalle | Prix suggéré |
|---------|-----------|--------------|
| SportLink Premium | Mensuel | 9,99 € |
| SportLink Premium | Annuel | 99 € |
| SportLink Elite | Mensuel | 24,99 € |
| SportLink Elite | Annuel | 249 € |

2. Copier les 4 `price_xxx` IDs dans les Supabase Secrets.

3. Webhook → **Ajouter un endpoint** :
   ```
   URL : https://<SUPABASE_URL>/functions/v1/stripe-webhook
   Events :
     - checkout.session.completed
     - customer.subscription.updated
     - customer.subscription.deleted
     - invoice.payment_failed
   ```
4. Copier le `whsec_...` dans `STRIPE_WEBHOOK_SECRET`.

### 6. Migrations base de données

```bash
supabase db push
```

### 7. Déploiement Edge Functions

```bash
supabase functions deploy --all
```

Ou fonction par fonction :
```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy send-convocation-email
supabase functions deploy invite-club-manager
supabase functions deploy send-push
# ... etc.
```

### 8. Déploiement frontend (Vercel)

```bash
vercel --prod
```

Ou via Git : push sur `main` → déploiement automatique.

---

## Vérifications post-déploiement

- [ ] Page d'accueil charge correctement
- [ ] Connexion Google OAuth fonctionne
- [ ] Création d'un événement → visible sur la carte
- [ ] PosterStudio → export PNG
- [ ] Formulaire feedback soumis → visible dans AdminFeedbackPage
- [ ] Checkout Stripe → page de paiement Stripe s'ouvre
- [ ] Email convocation → reçu dans la boîte mail de test
- [ ] Deep link `#join/<clubId>` → ouvre la page club

---

## Rollback

En cas de problème :
```bash
# Revenir à la version précédente sur Vercel
vercel rollback

# Revenir à la migration DB précédente (si possible)
supabase db reset --linked  # ⚠️ DESTRUCTIF — uniquement en dev
```

---

## Monitoring

- **Erreurs frontend** : sentry.io (si `VITE_SENTRY_DSN` configuré)
- **Edge Functions logs** : Supabase Dashboard → Edge Functions → Logs
- **DB** : Supabase Dashboard → Database → Logs
- **Stripe** : dashboard.stripe.com → Developers → Events
