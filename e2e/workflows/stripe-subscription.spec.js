import { test, expect } from '@playwright/test';

/**
 * Stripe Subscription E2E
 *
 * Ces tests vérifient les flux UI liés à Stripe sans appel réseau réel.
 * - Stripe Checkout est mocké via interception de la navigation
 * - L'Edge Function manage-subscription est interceptée via page.route()
 * - La base Supabase est interceptée pour renvoyer des données d'abonnement fictives
 *
 * Identifiants :
 * SS01 · Modal StripeSuccessModal s'affiche après retour ?stripe=success
 * SS02 · Modal affiche les features débloquées du plan starter
 * SS03 · Modal se ferme en cliquant sur la croix
 * SS04 · CTA "Voir mon abonnement" ouvre la SubscriptionPage
 * SS05 · SubscriptionPage s'affiche via deep link #subscription/:clubId
 * SS06 · SubscriptionPage montre le plan actuel et les dates
 * SS07 · Bouton "Mon abonnement" visible dans ClubDashboard pour plan payant
 * SS08 · Annulation affiche la confirmation avant d'envoyer la requête
 * SS09 · Réactivation appelle l'EF avec action=reactivate
 * SS10 · Portail Stripe redirige vers l'URL retournée par l'EF
 */

const BASE = 'http://localhost:5173';

// Mock Supabase REST pour club_subscriptions
async function mockSupabaseSubscription(page, sub = {}) {
  const defaults = {
    plan:                 'pro',
    status:               'active',
    current_period_start: '2026-06-01T00:00:00Z',
    current_period_end:   '2026-07-01T00:00:00Z',
    trial_end:            null,
    cancel_at_period_end: false,
    stripe_sub_id:        'sub_test123',
    stripe_cus_id:        'cus_test123',
  };
  const data = { ...defaults, ...sub };

  await page.route('**/rest/v1/club_subscriptions*', async (route) => {
    await route.fulfill({
      status:  200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
}

// Mock Edge Function manage-subscription
async function mockManageSubscription(page, responses = {}) {
  await page.route('**/functions/v1/manage-subscription', async (route) => {
    const body = await route.request().postDataJSON();
    const action = body?.action;

    if (responses[action]) {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body: JSON.stringify(responses[action]),
      });
    } else {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    }
  });
}

test.describe('Stripe Success Modal', () => {
  test('SS01 · StripeSuccessModal apparaît après retour ?stripe=success&plan=starter', async ({ page }) => {
    await page.goto(`${BASE}/?stripe=success&plan=starter`);
    await page.waitForLoadState('networkidle');

    // La modal doit être visible
    const headline = page.getByText(/Bienvenue dans le plan Starter/i);
    await expect(headline).toBeVisible({ timeout: 8000 });
  });

  test('SS02 · Modal affiche la section "Nouvelles fonctionnalités"', async ({ page }) => {
    await page.goto(`${BASE}/?stripe=success&plan=pro`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Nouvelles fonctionnalités/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/Bienvenue dans le plan Club Pro/i)).toBeVisible();
  });

  test('SS03 · Fermer la modal via le bouton croix', async ({ page }) => {
    await page.goto(`${BASE}/?stripe=success&plan=elite`);
    await page.waitForLoadState('networkidle');

    const modal = page.getByText(/Bienvenue dans le plan Elite/i);
    await expect(modal).toBeVisible({ timeout: 8000 });

    await page.getByRole('button', { name: /fermer/i }).click();

    // La modal disparaît
    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });

  test('SS04 · Bouton "Commencer à utiliser" ferme la modal', async ({ page }) => {
    await page.goto(`${BASE}/?stripe=success&plan=starter`);
    await page.waitForLoadState('networkidle');

    const modal = page.getByText(/Bienvenue dans le plan Starter/i);
    await expect(modal).toBeVisible({ timeout: 8000 });

    await page.getByRole('button', { name: /Commencer à utiliser/i }).click();
    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });

  test('SS05 · Plan elite affiche le bon badge 👑', async ({ page }) => {
    await page.goto(`${BASE}/?stripe=success&plan=elite`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Bienvenue dans le plan Elite/i)).toBeVisible({ timeout: 8000 });
    // Le badge est dans le DOM
    const badge = page.locator('text=👑');
    await expect(badge).toBeVisible();
  });
});

test.describe('SubscriptionPage via deep link', () => {
  test('SS06 · Deep link #subscription/:clubId affiche la SubscriptionPage', async ({ page }) => {
    await mockSupabaseSubscription(page);
    await page.goto(`${BASE}/#subscription/club-test-123`);
    await page.waitForLoadState('networkidle');

    // Le titre de la page
    const title = page.getByText(/Mon abonnement/i);
    await expect(title).toBeVisible({ timeout: 8000 });
  });

  test('SS07 · SubscriptionPage affiche le plan actuel (Club Pro)', async ({ page }) => {
    await mockSupabaseSubscription(page, { plan: 'pro', status: 'active' });
    await page.goto(`${BASE}/#subscription/club-test-123`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Club Pro/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/Actif/i)).toBeVisible();
  });

  test('SS08 · SubscriptionPage affiche la date de renouvellement', async ({ page }) => {
    await mockSupabaseSubscription(page, {
      plan:               'starter',
      status:             'active',
      current_period_end: '2026-07-01T00:00:00Z',
    });
    await page.goto(`${BASE}/#subscription/club-test-123`);
    await page.waitForLoadState('networkidle');

    // La date formatée en français
    const dateText = page.getByText(/1 juillet 2026/i);
    await expect(dateText).toBeVisible({ timeout: 8000 });
  });

  test('SS09 · Alerte past_due visible quand statut est past_due', async ({ page }) => {
    await mockSupabaseSubscription(page, { plan: 'pro', status: 'past_due' });
    await page.goto(`${BASE}/#subscription/club-test-123`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Paiement en attente/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('SS10 · Plan free : message "plan gratuit" + bouton Voir les plans', async ({ page }) => {
    await mockSupabaseSubscription(page, { plan: 'free', status: null });
    await page.goto(`${BASE}/#subscription/club-test-123`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/plan gratuit/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /Voir les plans/i })).toBeVisible();
  });
});

test.describe('SubscriptionPage — actions (mock EF)', () => {
  test('SS11 · Bouton "Annuler l\'abonnement" affiche la confirmation', async ({ page }) => {
    await mockSupabaseSubscription(page, {
      plan:          'pro',
      status:        'active',
      stripe_sub_id: 'sub_test',
      stripe_cus_id: 'cus_test',
    });
    await mockManageSubscription(page);
    await page.goto(`${BASE}/#subscription/club-test-123`);
    await page.waitForLoadState('networkidle');

    const cancelBtn = page.getByRole('button', { name: /Annuler l'abonnement/i });
    await expect(cancelBtn).toBeVisible({ timeout: 8000 });
    await cancelBtn.click();

    // Dialogue de confirmation
    await expect(page.getByText(/Confirmer l'annulation/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('button', { name: /Garder l'abonnement/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Annuler quand même/i })).toBeVisible();
  });

  test('SS12 · "Garder l\'abonnement" ferme le dialogue de confirmation', async ({ page }) => {
    await mockSupabaseSubscription(page, { plan: 'pro', status: 'active', stripe_sub_id: 'sub_t', stripe_cus_id: 'cus_t' });
    await mockManageSubscription(page);
    await page.goto(`${BASE}/#subscription/club-test-123`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Annuler l'abonnement/i }).click();
    await expect(page.getByText(/Confirmer l'annulation/i)).toBeVisible({ timeout: 3000 });

    await page.getByRole('button', { name: /Garder l'abonnement/i }).click();
    await expect(page.getByText(/Confirmer l'annulation/i)).not.toBeVisible({ timeout: 3000 });
  });

  test('SS13 · Confirmer annulation appelle l\'EF avec action=cancel', async ({ page }) => {
    const requests = [];
    await mockSupabaseSubscription(page, { plan: 'pro', status: 'active', stripe_sub_id: 'sub_t', stripe_cus_id: 'cus_t' });

    await page.route('**/functions/v1/manage-subscription', async (route) => {
      const body = await route.request().postDataJSON();
      requests.push(body);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto(`${BASE}/#subscription/club-test-123`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Annuler l'abonnement/i }).click();
    await page.getByRole('button', { name: /Annuler quand même/i }).click();

    await page.waitForTimeout(1000);
    const cancelCall = requests.find(r => r.action === 'cancel');
    expect(cancelCall).toBeTruthy();
    expect(cancelCall.clubId).toBe('club-test-123');
  });

  test('SS14 · Plan en annulation : bouton "Réactiver l\'abonnement" visible', async ({ page }) => {
    await mockSupabaseSubscription(page, {
      plan:                 'pro',
      status:               'active',
      stripe_sub_id:        'sub_t',
      stripe_cus_id:        'cus_t',
      cancel_at_period_end: true,
      current_period_end:   '2026-07-01T00:00:00Z',
    });
    await mockManageSubscription(page);
    await page.goto(`${BASE}/#subscription/club-test-123`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Annulation en cours/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /Réactiver l'abonnement/i })).toBeVisible();
  });

  test('SS15 · Réactiver appelle l\'EF avec action=reactivate', async ({ page }) => {
    const requests = [];
    await mockSupabaseSubscription(page, {
      plan:                 'pro',
      status:               'active',
      stripe_sub_id:        'sub_t',
      stripe_cus_id:        'cus_t',
      cancel_at_period_end: true,
      current_period_end:   '2026-07-01T00:00:00Z',
    });

    await page.route('**/functions/v1/manage-subscription', async (route) => {
      const body = await route.request().postDataJSON();
      requests.push(body);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto(`${BASE}/#subscription/club-test-123`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Réactiver l'abonnement/i }).click();
    await page.waitForTimeout(1000);

    const reactivateCall = requests.find(r => r.action === 'reactivate');
    expect(reactivateCall).toBeTruthy();
    expect(reactivateCall.clubId).toBe('club-test-123');
  });
});

test.describe('ClubDashboard — bouton Mon abonnement', () => {
  test('SS16 · Pas d\'overflow horizontal sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const ov = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 2);
    expect(ov).toBe(false);
  });

  test('SS17 · Page ne crashe pas avec hash #subscription/inexistant', async ({ page }) => {
    await page.goto(`${BASE}/#subscription/club-qui-nexiste-pas`);
    await page.waitForLoadState('networkidle');

    // Pas d'ErrorBoundary
    const err = page.getByText(/quelque chose s'est mal passé/i);
    await expect(err).not.toBeVisible({ timeout: 5000 });
  });
});
