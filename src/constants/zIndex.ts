// Centralized z-index hierarchy — edit ONLY here, never hardcode elsewhere.
export const Z = {
  base:              0,
  fabButton:        10,    // BottomNav FAB (inside nav stacking context)
  floatingButtons:  40,    // MapPage floating action buttons
  helpFab:          40,    // Bouton aide flottant
  feedbackFab:      45,    // Bouton feedback flottant
  simulatorBanner: 200,    // Simulateur rôle/plan banner (App.tsx)
  navBackdrop:     450,    // BottomNav FAB backdrop overlay
  navMenu:         500,    // BottomNav FAB quick-action menu
  bottomSheet:    1100,    // MobileEventSheet
  pwaInstallPrompt: 1200,  // Prompt installation PWA (App.tsx)
  announcementsPanel: 1900,// AnnouncementsCenter slide-in panel
  planOverlay:    1490,    // SubscriptionPage + plan overlay (App.tsx)
  formModal:      2000,    // EventFormModal, ClubFormModal
  venueDropdown:  2100,    // VenueAutocomplete dropdown
  posterStudio:   2500,    // PosterStudio main
  posterStudioPanel: 2501, // Overlay interne PosterStudio (partage, aperçu)
  auth:           3000,    // AuthPage
  followModal:    3100,    // FollowModal
  helpPage:       3200,    // HelpPage
  feedbackModal:  3300,    // FeedbackModal
  dropdown:       3500,    // CityAutocomplete, selects
  toast:          4000,    // ToastContext
  profilDrawer:   5000,    // ProfilPage drawer
  gallery:        5100,    // GalleryBlock lightbox
  convocPanel:    5200,    // ConvocReplyPanel
  clubManagers:   5300,    // ClubManagersPanel
  onboarding:     5400,    // OnboardingFirstSteps
  badgeModal:     5500,    // BadgeUnlockModal (fond)
  badgeOverlay:   5502,    // BadgeUnlockModal (overlay particules)
  activityModal:  5600,    // ActualitesPage modales internes
  demoApp:        9990,    // DemoApp container
  demoSpotlight:  9993,    // DemoSpotlight overlay (App.tsx)
  demoLanding:    9999,    // DemoLandingPage
  skipNav:        9999,    // .sl-skip-nav (accessibilité)
};
