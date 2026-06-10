if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').then(function (reg) {
      // Détecter une mise à jour disponible (nouveau SW en attente)
      reg.addEventListener('updatefound', function () {
        var newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', function () {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Un nouveau SW est prêt — notifier l'app
            window.dispatchEvent(new CustomEvent('sl-sw-update-ready'));
          }
        });
      });
    }).catch(function () {});

    // Recharge automatique si le contrôleur change (après skipWaiting)
    var refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}
