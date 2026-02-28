(function ensureHubspotChatClosedOnLoad() {
  if (typeof window === 'undefined') return;
  if (window.__safeBillHubspotCloseInit) return;
  window.__safeBillHubspotCloseInit = true;

  const markClosed = () => {
    if (window.__safeBillHubspotClosedOnce) return true;
    try {
      if (window.HubSpotConversations?.widget) {
        window.HubSpotConversations.widget.close();
        document.documentElement.classList.remove('hs-chat-open');
        window.__safeBillHubspotClosedOnce = true;
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  };

  const scheduleClose = () => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      if (markClosed() || attempts > 60) {
        clearInterval(interval);
      }
    }, 200);
  };

  scheduleClose();

  window.hsConversationsOnReady = window.hsConversationsOnReady || [];
  window.hsConversationsOnReady.push(() => {
    markClosed();
  });
})();





