// Centralized z-index hierarchy — edit ONLY here, never hardcode elsewhere.
export const Z = {
  base:            0,
  fabButton:      10,   // BottomNav FAB (inside nav stacking context)
  floatingButtons: 40,  // MapPage floating action buttons
  navBackdrop:    450,  // BottomNav FAB backdrop overlay
  navMenu:        500,  // BottomNav FAB quick-action menu
  bottomSheet:   1100,  // MobileEventSheet
  formModal:     2000,  // EventFormModal, ClubFormModal
  posterStudio:  2500,  // PosterStudio
  auth:          3000,  // AuthPage
  followModal:   3100,  // FollowModal
  dropdown:      3500,  // CityAutocomplete, selects
  toast:         4000,  // Future toast notifications
};
