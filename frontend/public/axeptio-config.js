/**
 * Axeptio Consent Management Platform Configuration
 * This file handles cookie consent management and ensures GDPR compliance
 */

(function() {
  'use strict';

  // Axeptio Settings Configuration
  window.axeptioSettings = {
    clientId: "68f348675a572554038060b6",
    cookiesVersion: "26043d2f-9318-44fb-9356-00c1ac006b99",
    mode: "banner", // Show banner on first visit
    bannerPosition: "bottom", // Bottom of page
    language: "fr", // French language
    showConsentModal: true, // Enable detailed consent modal
    // Axeptio automatically hides banner and icon when consent is stored in cookies
    // These settings ensure proper persistence
  };

  // Initialize Axeptio SDK
  (function(d, s) {
    var t = d.getElementsByTagName(s)[0];
    var e = d.createElement(s);
    e.async = true;
    e.src = "//static.axept.io/sdk.js";
    t.parentNode.insertBefore(e, t);
  })(document, "script");

  // Helper function to get cookie value
  function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  }

  // Function to explicitly hide Axeptio banner and icon
  function hideAxeptioUI() {
    // Try multiple methods to hide Axeptio UI elements
    try {
      // Method 1: Hide banner using Axeptio API (if available)
      if (window.axeptio && typeof window.axeptio.hideBanner === 'function') {
        window.axeptio.hideBanner();
      }
      
      // Method 2: Hide via DOM manipulation
      setTimeout(function() {
        // Hide banner by various selectors
        var selectors = [
          '[data-axeptio-widget]',
          '[class*="axeptio"]',
          '[id*="axeptio"]',
          '.axeptio-button',
          '#axeptio-container',
          '[class*="Axeptio"]',
          '[id*="Axeptio"]'
        ];
        
        selectors.forEach(function(selector) {
          try {
            var elements = document.querySelectorAll(selector);
            elements.forEach(function(el) {
              var style = window.getComputedStyle(el);
              // Only hide visible elements
              if (style.display !== 'none' && (el.offsetHeight > 0 || el.offsetWidth > 0)) {
                el.style.display = 'none';
                el.style.visibility = 'hidden';
                el.style.opacity = '0';
              }
            });
          } catch (e) {
            // Ignore errors
          }
        });
      }, 100);
      
      console.log('[Axeptio] Attempted to hide banner and icon');
    } catch (e) {
      console.warn('[Axeptio] Error hiding UI:', e);
    }
  }

  // Handle Axeptio events for consent management
  // Axeptio automatically stores consent in cookies and hides banner/icon when consent exists
  
  // Event: Axeptio SDK is ready
  window.addEventListener('axeptio:ready', function() {
    console.log('[Axeptio] SDK is ready');
    
    // Check if user already has consent stored (returning visitor)
    setTimeout(function() {
      if (window.axeptio && typeof window.axeptio.getConsent === 'function') {
        try {
          var consent = window.axeptio.getConsent();
          
          // Check if consent exists and is valid
          var hasConsent = false;
          
          // Method 1: Check via Axeptio API
          if (consent && typeof consent === 'object' && Object.keys(consent).length > 0) {
            hasConsent = true;
            console.log('[Axeptio] Consent found via API:', consent);
          }
          
          // Method 2: Check cookies directly
          var axeptioCookiesValue = getCookie('axeptio_cookies');
          if (axeptioCookiesValue) {
            try {
              var decoded = decodeURIComponent(axeptioCookiesValue);
              var cookieData = JSON.parse(decoded);
              // Check if consent is completed
              if (cookieData.$$completed === true) {
                hasConsent = true;
                console.log('[Axeptio] Consent found in cookies - completed:', cookieData);
              }
            } catch (e) {
              // Not valid JSON, ignore
            }
          }
          
          // If consent exists, hide the banner and icon
          if (hasConsent) {
            console.log('[Axeptio] Consent exists - hiding banner and icon');
            hideAxeptioUI();
          } else {
            console.log('[Axeptio] No valid consent found - banner will be displayed');
          }
        } catch (e) {
          console.warn('[Axeptio] Error checking consent:', e);
        }
      }
    }, 500);
  });
  
  // Event: User accepts cookies (clicks "Accept all" or "Essential only")
  window.addEventListener('axeptio:onAccept', function(cookies) {
    console.log('[Axeptio] Consent accepted:', cookies);
    
    // Explicitly hide banner and icon after consent is accepted
    setTimeout(function() {
      hideAxeptioUI();
    }, 200);
  });

  // Event: Consent is updated (user changes preferences via cookie preferences link)
  window.addEventListener('axeptio:onConsentUpdate', function(event) {
    console.log('[Axeptio] Consent updated');
    
    // Check if consent still exists, if yes hide UI
    setTimeout(function() {
      var axeptioCookiesValue = getCookie('axeptio_cookies');
      if (axeptioCookiesValue) {
        try {
          var decoded = decodeURIComponent(axeptioCookiesValue);
          var cookieData = JSON.parse(decoded);
          if (cookieData.$$completed === true) {
            hideAxeptioUI();
          }
        } catch (e) {
          // Ignore
        }
      }
    }, 200);
  });

  // Fallback: Use Axeptio's native event system (if available)
  var axeptioCheckInterval = setInterval(function() {
    if (window.axeptio && typeof window.axeptio.on === 'function') {
      clearInterval(axeptioCheckInterval);
      
      // Use Axeptio's native event handlers
      window.axeptio.on('accept', function(cookies) {
        console.log('[Axeptio] Native accept event:', cookies);
        // Explicitly hide UI after consent
        setTimeout(function() {
          hideAxeptioUI();
        }, 200);
      });

      window.axeptio.on('consent:ready', function() {
        console.log('[Axeptio] Consent system ready');
        // Check existing consent and hide UI if consent exists
        setTimeout(function() {
          if (window.axeptio && typeof window.axeptio.getConsent === 'function') {
            var consent = window.axeptio.getConsent();
            var axeptioCookiesValue = getCookie('axeptio_cookies');
            var hasConsent = false;
            
            if (consent && Object.keys(consent).length > 0) {
              hasConsent = true;
            }
            
            if (axeptioCookiesValue) {
              try {
                var decoded = decodeURIComponent(axeptioCookiesValue);
                var cookieData = JSON.parse(decoded);
                if (cookieData.$$completed === true) {
                  hasConsent = true;
                }
              } catch (e) {
                // Ignore
              }
            }
            
            if (hasConsent) {
              hideAxeptioUI();
            }
          }
        }, 300);
      });
    }
  }, 100);

  // Clear interval after 10 seconds if Axeptio doesn't load
  setTimeout(function() {
    clearInterval(axeptioCheckInterval);
  }, 10000);

})();

