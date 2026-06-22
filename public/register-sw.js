if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').then(function (reg) {
      // Détecter une mise à jour disponible (nouveau SW en attente)
      reg.addEventListener('updatefound', function () {
        var newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', function () {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('sl-sw-update-ready'));
          }
        });
      });

      // Periodic Background Sync — rafraîchissement des données toutes les 3h
      // (API expérimentale — supportée sur Chrome Android avec permission NotificationGranted)
      if ('periodicSync' in reg) {
        navigator.permissions.query({ name: 'periodic-background-sync' }).then(function (status) {
          if (status.state === 'granted') {
            reg.periodicSync.register('sl-data-refresh', {
              minInterval: 3 * 60 * 60 * 1000, // 3 heures
            }).catch(function () { /* API non disponible dans ce contexte */ });
          }
        }).catch(function () {});
      }

      // Background Sync — rejouer la file offline à la reconnexion
      if ('sync' in reg) {
        window.addEventListener('online', function () {
          reg.sync.register('sl-offline-queue').catch(function () {});
        });
      }

    }).catch(function () {});

    // Écouter les messages du SW
    navigator.serviceWorker.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'PROCESS_OFFLINE_QUEUE') {
        window.dispatchEvent(new CustomEvent('sl-process-offline-queue'));
      }
      if (e.data && e.data.type === 'PERIODIC_REFRESH') {
        window.dispatchEvent(new CustomEvent('sl-periodic-refresh'));
      }
    });

    // Recharge automatique si le contrôleur change (après skipWaiting)
    var refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}
