// Ensures HubSpot chat widget stays above the in-app messaging FAB across reloads
// Works by applying inline styles after the widget is injected and whenever it re-renders

/* eslint-disable no-undef */
(function fixHubspotWidgetPosition() {
  const BOTTOM_PX = '90px';
  const RIGHT_PX = '22px';
  const Z_INDEX = '999999';

  const applyPosition = () => {
    const container = document.querySelector('#hubspot-messages-iframe-container, [id^="hubspot-messages-iframe-container"]');
    if (!container) return false;
    container.style.setProperty('bottom', BOTTOM_PX, 'important');
    container.style.setProperty('right', RIGHT_PX, 'important');
    container.style.setProperty('z-index', Z_INDEX, 'important');
    return true;
  };

  // Attempt during initial load (widget is injected asynchronously)
  let tries = 0;
  const poll = setInterval(() => {
    tries += 1;
    if (applyPosition() || tries > 60) {
      clearInterval(poll);
    }
  }, 200);

  // Listen to HubSpot readiness and lifecycle events if available
  try {
    window.hsConversationsOnReady = window.hsConversationsOnReady || [];
    window.hsConversationsOnReady.push(() => {
      applyPosition();
      try {
        if (window.HubSpotConversations && window.HubSpotConversations.on) {
          window.HubSpotConversations.on('open', applyPosition);
          window.HubSpotConversations.on('close', applyPosition);
          window.HubSpotConversations.on('conversationStarted', applyPosition);
          window.HubSpotConversations.on('widgetLoad', applyPosition);
        }
      } catch {}
    });
  } catch {}

  // Fallback: observe DOM changes in case the widget rewrites its container
  const observer = new MutationObserver(() => applyPosition());
  observer.observe(document.documentElement || document.body, { childList: true, subtree: true });

  // Re-apply on resize (some viewports cause HubSpot to recompute position)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyPosition, 150);
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(poll);
    observer.disconnect();
  });
})();


