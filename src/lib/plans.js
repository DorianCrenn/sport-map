// ─────────────────────────────────────────────────────────────────────────────
// plans.js — Facade backward compat
//
// Ce fichier re-exporte depuis subscriptionFeatures.ts et planHelpers.ts.
// Les imports existants (import { PLAN_TIERS, canUse } from '../lib/plans.js')
// continuent de fonctionner sans modification.
//
// Pour du nouveau code : importer directement depuis subscriptionFeatures.ts
// et planHelpers.ts.
// ─────────────────────────────────────────────────────────────────────────────

export {
  PLAN_META    as PLAN_TIERS,
  PLAN_ORDER,
  FEATURE_GATES as PLAN_FEATURES,
} from './subscriptionFeatures.ts';

export {
  canUse,
  nextPlanId as nextPlan,
  isUpgradeable,
  getPlanMeta,
} from './planHelpers.ts';
