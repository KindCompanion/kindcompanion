(function(){
  var KEY = 'kc_analytics_consent_v2';
  var domain = 'kindcompanion.chat'; // Plausible data-domain
  var gaId = null; // e.g. 'G-XXXXXXX'
  (function hydrateFromTag(){
    var tag = document.currentScript || document.querySelector('script[src*="consent.js"]');
    if(!tag) return;
    if(tag.dataset && tag.dataset.domain) domain = tag.dataset.domain;
    if(tag.dataset && tag.dataset.gaId) gaId = tag.dataset.gaId;
  })();
  function hasConsent(){ try { return localStorage.getItem(KEY)==='yes'; } catch(e){ return false; } }
  function giveConsent(){ try { localStorage.setItem(KEY,'yes'); } catch(e){} }
  function revokeConsent(){ try { localStorage.removeItem(KEY); } catch(e){} }
  function loadPlausible(){
    if (document.getElementById('plausible-js')) return;
    var s = document.createElement('script');
    s.id = 'plausible-js';
    s.defer = true;
    s.setAttribute('data-domain', domain);
    s.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(s);
  }
  function loadGA(){
    if (!gaId || document.getElementById('ga4-js')) return;
    var s = document.createElement('script');
    s.id = 'ga4-js';
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', gaId, { anonymize_ip: true });
  }
  function enableAll(){ loadPlausible(); loadGA(); }
  function banner(){
    if (document.getElementById('kc-consent')) return;
    var b = document.createElement('div');
    b.id = 'kc-consent';
    b.style.cssText = 'position:fixed;inset:auto 12px 12px 12px;z-index:9999;background:#0B1211;color:#fff;padding:14px 16px;border-radius:12px;box-shadow:0 10px 28px rgba(0,0,0,.25);font:14px/1.4 system-ui,Segoe UI,Inter,Roboto,Arial,sans-serif;';
    b.innerHTML = '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div style="flex:1 1 auto;min-width:220px">We use privacy-friendly analytics. Choose Allow to enable. <a href="/cookies.html" style="color:#9CE6D1">Learn more</a>.</div><div style="display:flex;gap:8px"><button id="kc-accept" style="background:#00C389;color:#013527;border:0;border-radius:10px;padding:10px 12px;font-weight:800;cursor:pointer">Allow</button><button id="kc-decline" style="background:#182221;color:#CFEFE6;border:0;border-radius:10px;padding:10px 12px;cursor:pointer">Decline</button></div></div>';
    document.body.appendChild(b);
    document.getElementById('kc-accept').onclick = function(){ giveConsent(); enableAll(); b.remove(); };
    document.getElementById('kc-decline').onclick = function(){ revokeConsent(); b.remove(); };
  }
  if (hasConsent()) { enableAll(); }
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', banner);
  else banner();
  window.kcRevokeConsent = function(){ revokeConsent(); alert('Analytics consent cleared. Reload to see the banner again.'); };
})();