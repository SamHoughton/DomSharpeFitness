/* ===================================================
   ANALYTICS: GA4 + Google Ads
   ===================================================

   SETUP (paste two IDs and you are live)
   --------------------------------------
   1. GA4_ID     analytics.google.com  ->  Admin  ->  Data streams  ->  your web
                 stream. Looks like 'G-AB12CD34EF'.
   2. ADS_ID     ads.google.com  ->  Tools  ->  Conversions. Looks like
                 'AW-123456789'.
   3. ADS_CONVERSIONS
                 In Ads, create one conversion action per goal below, then paste
                 its send_to label. Google shows it as 'AW-123456789/AbC-D_efGh'.

   Leave a value as null and that part simply does not load. Nothing breaks.

   CONSENT
   -------
   UK GDPR and PECR mean analytics and ads cookies need consent before they are
   set. This file uses Google Consent Mode v2 and starts fully denied, so no
   cookies are written until the visitor accepts. The banner lives in
   index.html and calls SharpeAnalytics.grant() / .deny().
=================================================== */

window.SharpeAnalytics = (function () {
    'use strict';

    // ---- CONFIG -----------------------------------------------------------
    const GA4_ID = null;   // e.g. 'G-AB12CD34EF'
    const ADS_ID = null;   // e.g. 'AW-123456789'

    // Conversion labels from Google Ads. Fill in the ones you create.
    const ADS_CONVERSIONS = {
        consultation: null,   // e.g. 'AW-123456789/AbC-D_efGh'
        whatsapp:     null,
        phone:        null
    };

    const STORAGE_KEY = 'ss-consent';

    // ---- gtag bootstrap ---------------------------------------------------
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;

    const enabled = Boolean(GA4_ID || ADS_ID);

    // Deny everything until the visitor says otherwise. Consent Mode still lets
    // Google model conversions from the denied pings, so Ads reporting is not
    // blind while people are deciding.
    gtag('consent', 'default', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        functionality_storage: 'granted',
        security_storage: 'granted',
        wait_for_update: 500
    });

    function loadTags() {
        if (!enabled || document.getElementById('gtag-src')) return;
        const id = GA4_ID || ADS_ID;
        const s = document.createElement('script');
        s.id = 'gtag-src';
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
        document.head.appendChild(s);

        gtag('js', new Date());
        if (GA4_ID) gtag('config', GA4_ID, { anonymize_ip: true });
        if (ADS_ID) gtag('config', ADS_ID);
    }

    function applyStored() {
        let stored = null;
        try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
        if (stored === 'granted') update(true);
        else if (stored === 'denied') update(false);
        return stored;
    }

    function update(granted) {
        const v = granted ? 'granted' : 'denied';
        gtag('consent', 'update', {
            ad_storage: v,
            ad_user_data: v,
            ad_personalization: v,
            analytics_storage: v
        });
        try { localStorage.setItem(STORAGE_KEY, v); } catch (e) {}
        if (granted) loadTags();
    }

    // ---- Event tracking ---------------------------------------------------
    // Fires the GA4 event always, and the matching Ads conversion when one is
    // configured. Safe to call whether or not any IDs are set.
    function track(name, params) {
        if (!enabled) {
            // Handy while the IDs are still empty: check the console to confirm
            // the right events fire in the right places.
            if (window.SS_DEBUG) console.log('[analytics]', name, params || {});
            return;
        }
        gtag('event', name, params || {});
    }

    function conversion(key, params) {
        const sendTo = ADS_CONVERSIONS[key];
        if (!sendTo || !ADS_ID) return;
        gtag('event', 'conversion', Object.assign({ send_to: sendTo }, params || {}));
    }

    // Lead events, the ones actually worth optimising ads against.
    function lead(key, params) {
        track('generate_lead', Object.assign({ method: key }, params || {}));
        conversion(key, params);
    }

    // ---- Auto-wiring ------------------------------------------------------
    function wire() {
        // Outbound contact taps
        document.querySelectorAll('a[href^="https://wa.me/"]').forEach(a => {
            a.addEventListener('click', () => lead('whatsapp', {
                link_location: a.closest('.action-bar') ? 'action_bar'
                             : a.closest('.footer') ? 'footer' : 'page'
            }));
        });
        document.querySelectorAll('a[href^="tel:"]').forEach(a => {
            a.addEventListener('click', () => lead('phone'));
        });
        document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
            a.addEventListener('click', () => track('email_click'));
        });
        document.querySelectorAll('a[href*="instagram.com"]').forEach(a => {
            a.addEventListener('click', () => track('instagram_click'));
        });

        // Which pricing tier people actually click
        document.querySelectorAll('.pricing-card a[href="#contact"]').forEach(a => {
            const card = a.closest('.pricing-card');
            const name = card && card.querySelector('h3') ? card.querySelector('h3').textContent.trim() : 'unknown';
            a.addEventListener('click', () => track('select_item', { item_name: name, item_category: 'pricing' }));
        });

        // Hero and section CTAs
        document.querySelectorAll('a[href="#contact"]').forEach(a => {
            if (a.closest('.pricing-card')) return;
            a.addEventListener('click', () => track('cta_click', {
                cta_location: a.closest('.hero') ? 'hero'
                            : a.closest('.action-bar') ? 'action_bar'
                            : a.closest('.footer') ? 'footer' : 'section'
            }));
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', wire);
    } else {
        wire();
    }

    return {
        enabled: enabled,
        storedConsent: applyStored,
        grant: function () { update(true); },
        deny:  function () { update(false); },
        track: track,
        lead:  lead,
        conversion: conversion
    };
})();
