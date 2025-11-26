/*
 * Assumptions:
 *
 * - we do not support multiple pt() trackers on one page.
 *   FIXME (check if GA supports it & figure out how).
 * - Referer and current page URLs are short enough to fit into pixel params.
 *
 * Fixmes:
 *
 * - Beacon support
 */

window.gr = (function (win, doc) {
  "use strict";
  /*
   * Embedding the request ID into the pixel URL allows us to check
   * for missed requests, but makes caching the script impossible, so this
   * should be eventually made optional.
   */
  const REQUEST_ID = "6fb05e12-06b6-45fc-b5b3-8f0ec7aaf4c2";
  const COOKIE_NAME = "_gr_id";
  var customerId;

  function isEmpty(str) {
    return !str || str.length === 0;
  }

  function sanitizedCookieExpiresIn(ce) {
    try {
      var cookieExpiresIn = parseInt(ce);

      if (!cookieExpiresIn || cookieExpiresIn < 1 || cookieExpiresIn > 120) {
        cookieExpiresIn = 60;
      }
      return cookieExpiresIn;
    } catch (e) {
      return 60;
    }
  }

  function normalize(val) {
    return val ?? "";
  }

  function cSlugToParams(urlData) {
    if (urlData.via) {
      return {
        cType: "via",
        cSlug: urlData.via,
      };
    } else if (urlData.wpcr) {
      return {
        cType: "wpcr",
        cSlug: urlData.wpcr,
      };
    } else if (urlData.fpr) {
      return {
        cType: "fpr",
        cSlug: urlData.fpr,
      };
    } else if (urlData.fpRef) {
      return {
        cType: "fp_ref",
        cSlug: urlData.fpRef,
      };
    } else if (urlData.psPartnerKey) {
      return {
        cType: "ps_partner_key",
        cSlug: urlData.psPartnerKey,
      };
    } else {
      return {};
    }
  }

  /*
   * Object for manipulating cookies
   */
  var cookies = {
    get: function (key) {
      if (!key) {
        return null;
      }

      var encodedKey = encodeURIComponent(key);
      var cs = doc.cookie.split(/\s*;\s*/);
      for (var i = 0; i < cs.length; i++) {
        var c = cs[i].split("=");
        if (c[0] == encodedKey) {
          return decodeURIComponent(c[1]);
        }
      }
      return null;
    },
    set: function (key, value, options) {
      var opts = [];
      if (options) {
        for (var k in options) {
          opts.push([k, options[k]].join("="));
        }
      }
      var cookie =
        [encodeURIComponent(key), encodeURIComponent(value)].join("=") +
        "; " +
        opts.join("; ");
      doc.cookie = cookie;
      return cookie;
    },
  };

  /*
   * Object for manipulating data
   */
  var dataFn = {
    getUrlParam: function () {
      var res = null;
      const params = new URLSearchParams(window.location.search);
      for (var i = 0; i < arguments.length; i += 1) {
        res = params.get(arguments[i]);
        if (res) return removeTrailingSlash(res);
      }
      return ""; // So that it matches cookie parser return
    },
    setReditusCookie: function (urlData, cookieData) {
      const now = new Date().getTime();
      const cookie_ttl = sanitizedCookieExpiresIn(gr.ce) * 24 * 3600 * 1000;
      const expiry = new Date(now + cookie_ttl).toUTCString();
      const cSlugParams = cSlugToParams(urlData);

      var domain;

      const compositeTLDs = [
        "co.uk",
        "com.au",
        "org.uk",
        "gov.uk",
        "net.au",
        "com.br",
        "co.za",
        "com.cy",
      ]; // Add more as needed

      // Check if the hostname is a composite TLD; example: www.google.co.uk
      if (compositeTLDs.some((tld) => win.location.hostname.endsWith(tld))) {
        domain = "." + win.location.hostname.split(".").slice(-3).join(".");
      } else if (
        window.location.href.indexOf("localhost") >= 0 ||
        win.location.hostname.split(".").length > 3
      ) {
        domain = win.location.hostname;
      } else {
        // This is required for multi-subdomains
        domain = "." + win.location.hostname.split(".").slice(-2).join(".");
      }

      if (!cookies.get(COOKIE_NAME)) {
        // Set cookie from urlData
        cookies.set(
          COOKIE_NAME,
          [
            urlData.rl,
            urlData.clientId,
            "", // Empty legacy isTest field
            urlData.pk,
            urlData.uid,
            "", // Empty legacy wid field
            urlData.affiliateSlug,
            cSlugParams.cSlug,
            cSlugParams.cType,
            urlData.sid,
            urlData.programType,
          ].join(":"),
          { domain: domain, expires: expiry, path: "/" }
        );

        if (!isEmpty(urlData.isDebug)) {
          console.group("REDITUS LOG");
          console.log("Setting Cookie: " + COOKIE_NAME);
          console.groupEnd("REDITUS LOG");
        }
      } else {
        // Set cookie from urlData if there are slug changes
        if (
          (urlData.pk && normalize(urlData.pk) !== normalize(cookieData.pk)) ||
          (urlData.rl && normalize(urlData.rl) !== normalize(cookieData.rl)) ||
          normalize(urlData.affiliateSlug) !==
            normalize(cookieData.affiliateSlug) ||
          normalize(urlData.sid) !== normalize(cookieData.sid) ||
          normalize(cSlugParams.cSlug) !== normalize(cookieData.cSlug) ||
          normalize(cSlugParams.cType) !== normalize(cookieData.cType) ||
          normalize(urlData.programType) !== normalize(cookieData.programType)
        ) {
          cookies.set(
            COOKIE_NAME,
            [
              urlData.rl,
              urlData.clientId, // Set a new random client ID
              "", // Empty legacy isTest field
              urlData.pk,
              urlData.uid,
              "", // Empty legacy wid field
              urlData.affiliateSlug,
              cSlugParams.cSlug,
              cSlugParams.cType,
              urlData.sid,
              urlData.programType,
            ].join(":"),
            { domain: domain, expires: expiry, path: "/" }
          );

          if (!isEmpty(urlData.isDebug)) {
            console.group("REDITUS LOG");
            console.log("Setting Cookie: " + COOKIE_NAME);
            console.groupEnd("REDITUS LOG");
          }
        } else {
          // Update only expiry if revisiting the same affiliate link
          cookies.set(
            COOKIE_NAME,
            [
              urlData.rl,
              cookieData.clientId, // Reuse the same client ID from the cookie
              "", // Empty legacy isTest field
              urlData.pk,
              urlData.uid,
              "", // Empty legacy wid field
              urlData.affiliateSlug,
              cSlugParams.cSlug,
              cSlugParams.cType,
              urlData.sid,
              urlData.programType,
            ].join(":"),
            { domain: domain, expires: expiry, path: "/" }
          );
        }
      }
    },
    getUrlData: function () {
      return {
        clientId: uuid(),
        affiliateSlug: this.getUrlParam("red") || this.getUrlParam("refby"),
        pk: this.getUrlParam("gr_pk", "_pk"),
        uid: this.getUrlParam("gr_uid"), // Deprecated field
        rl: this.getUrlParam("rl"),
        isDebug: this.getUrlParam("gr_debug"),
        via: this.getUrlParam("via"),
        wpcr: this.getUrlParam("wpcr"),
        fpr: this.getUrlParam("fpr"),
        fpRef: this.getUrlParam("fp_ref"),
        psPartnerKey: this.getUrlParam("ps_partner_key"),
        sid: this.getUrlParam("sid"),
        programType: this.getUrlParam("refby") ? "referral" : "affiliate",
      };
    },
    getCookieData: function () {
      var cookie = cookies.get(COOKIE_NAME);
      if (!cookie) return null;
      var cookieVals = cookie.split(":");
      return {
        rl: cookieVals[0],
        clientId: cookieVals[1],
        // cookieVales[2] is ignored legacy isTest field
        pk: cookieVals[3],
        uid: cookieVals[4], // Deprecated field
        // cookieVales[5] is ignored legacy wid field
        affiliateSlug: cookieVals[6],
        cSlug: cookieVals[7],
        cType: cookieVals[8],
        sid: cookieVals[9],
        programType: cookieVals[10],
      };
    },
  };

  /*
   * Generates a visitor id - a V4 UUID.
   * FIXME: check and use win.crypto if available for better randomness guarantees.
   */
  function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  /*
   * Removes trailing slashes
   */
  function removeTrailingSlash(str) {
    return str.replace(/\/+$/, "");
  }

  /*
   * Proxy function that takes arguments in the form of 'function
   * name', 'arg1', ..., 'argn', and dispatches them to the functions defined
   * in fn object.
   */
  function proxy() {
    var args = Array.prototype.slice.call(arguments);
    if (!args || !args[0]) return;

    const urlData = dataFn.getUrlData();
    const cookieData = dataFn.getCookieData();
    const allowedWithoutTracking = ["initCustomer", "loadReferralWidget"];

    // If no tracking data exists, only allow `initCustomer` and `loadReferralWidget`
    if (
      !cookieData &&
      !urlData.pk &&
      !urlData.rl &&
      !urlData.affiliateSlug &&
      !urlData.via &&
      !urlData.wpcr &&
      !urlData.fpr &&
      !urlData.fpRef &&
      !urlData.psPartnerKey &&
      !urlData.sid
    ) {
      if (!allowedWithoutTracking.includes(args[0])) {
        if (!isEmpty(urlData.isDebug)) {
          console.log(
            "No tracking data -> ignoring call to gr('" + args[0] + "')."
          );
        }
        return;
      }
    }

    if (fn[args[0]]) {
      fn[args[0]].apply(fn, args.slice(1));
    }
  }

  /*
   * These form a 'public' interface/API.
   * calling gr("<function>") in JS console will dispatch through the proxy
   * function to one of these.
   */
  var fn = {
    /* Serializes the tracking arguments into pixel URL params and creates
     * the beacon element.
     *
     * FIXME: the params can be too long to be sent through GET.
     */
    initCustomer: function (id) {
      customerId = id;
    },
    loadReferralWidget: function (config) {
      if (!config) {
        return console.error("No config provided for the referral widget.");
      }

      if (!config.product_id) {
        return console.error(
          "No `product_id` provided for the referral widget."
        );
      }

      if (!config.auth_token) {
        return console.error(
          "No `auth_token` provided for the referral widget."
        );
      }

      const cookieData = {
        product_id: config.product_id,
        auth_token: config.auth_token,
        company_id: config.user_details.company_id,
        company_name: config.user_details.company_name,
        first_name: config.user_details.first_name,
        last_name: config.user_details.last_name,
        email: config.user_details.email,
      };

      const now = new Date().getTime();
      const cookie_ttl = 30 * 24 * 3600 * 1000; // Expires in 30 days
      const expiry = new Date(now + cookie_ttl).toUTCString();

      cookies.set("_gr_referral_widget", JSON.stringify(cookieData), {
        domain: "." + win.location.hostname,
        expires: expiry,
        path: "/",
      });

      const firstScriptElement = document.getElementsByTagName("script")[0];
      var scriptElement = document.createElement("script");
      scriptElement.async = true;
      scriptElement.src = "https://script.getreditus.com/referral-widget.js";
      firstScriptElement.parentNode.insertBefore(
        scriptElement,
        firstScriptElement
      );
    },
    logData: function () {
      console.group("REDITUS LOG");
      console.log("[START] - Call reditus #logData function");
      console.log("Customer ID:");
      console.log(customerId);
      console.log("URL Data:");
      console.log(dataFn.getUrlData());
      console.log("Cookie Data:");
      console.log(dataFn.getCookieData());
      console.log("[END] - Call reditus #logData function");
      console.groupEnd("REDITUS LOG");
    },
    track: function (event, meta) {
      if (!isEmpty(urlData.isDebug)) {
        console.group("REDITUS LOG");
        console.log("[START] - Call reditus #track function");
        console.log("Customer ID:");
        console.log(customerId);
      }

      var d = [];
      var i = doc.createElement("img");
      const cookieData = dataFn.getCookieData();

      if (!isEmpty(urlData.isDebug)) {
        console.log("Customer ID:");
        console.log(customerId);
        console.log("Cookie Data:");
        console.log(cookieData);
      }

      if (!cookieData || !customerId) return;

      var t = {
        evt: event,
        rid: REQUEST_ID,
        ref: doc.referrer,
        url: win.location,
        grid: cookieData.clientId,
        rl: cookieData.rl,
        pk: cookieData.pk,
        uid: cookieData.uid, // Deprecated field
        affiliate_slug:
          cookieData.programType !== "referral"
            ? cookieData.affiliateSlug
            : undefined,
        advocate_slug:
          cookieData.programType === "referral"
            ? cookieData.affiliateSlug
            : undefined,
        customer_id: customerId,
        cslug: cookieData.cSlug,
        ctype: cookieData.cType,
        sid: cookieData.sid,
      };

      /* Prefix user metadata, so they can be handled separately */
      for (var p in meta) {
        t["m_" + p] = meta[p];
      }
      for (var p in t) {
        d.push(p + "=" + encodeURIComponent(t[p] || ""));
      }

      if (!isEmpty(urlData.isDebug)) {
        console.log("Tracking Data:");
        console.log(t);
      }

      i.src = "https://tr.getreditus.com" + "?" + d.join("&");

      if (!isEmpty(urlData.isDebug)) {
        console.log("[END] - Call reditus #track function");
        console.groupEnd("REDITUS LOG");
      }
    },
  };

  const urlData = dataFn.getUrlData();
  const cookieData = dataFn.getCookieData();

  if (win.gr && win.gr._initialized) {
    console.group("REDITUS WARNING");
    console.warn(
      "The Reditus Tracking script has already been initialized. Please remove the duplicate script tag."
    );
    console.groupEnd("REDITUS WARNING");

    return win.gr; // Exit early if already initialized
  }

  if (!isEmpty(urlData.isDebug)) {
    console.group("REDITUS LOG");
    console.log("URL Data:");
    console.log(urlData);
    console.log("Cookie Data:");
    console.log(cookieData);
    console.groupEnd("REDITUS LOG");
  }

  if (
    urlData.affiliateSlug ||
    urlData.pk ||
    urlData.rl ||
    urlData.sid ||
    urlData.via ||
    urlData.wpcr ||
    urlData.fpr ||
    urlData.fpRef ||
    urlData.psPartnerKey
  ) {
    dataFn.setReditusCookie(urlData, cookieData);
  }

  /*
   * When loaded asynchronously, the client could have pushed some
   * events into the queue. Run whatever is there.
   */
  while (win.gr.q && win.gr.q.length > 0) {
    proxy.apply(this, win.gr.q.shift());
  }

  proxy._initialized = true;

  /* Replace window.gr with a synchronous function */
  return proxy;
})(window, document);

/* Automatic conversion tracking integrations */

window.addEventListener("message", function (e) {
  const UUID_SEARCH_REGEX =
    /[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}/g;

  if (
    e.origin === "https://calendly.com" &&
    e.data.event &&
    e.data.event === "calendly.event_scheduled"
  ) {
    var [cal_event, cal_user] =
      e.data.payload.invitee.uri.match(UUID_SEARCH_REGEX);
    console.log("Calendly event scheduled: " + cal_event + " by " + cal_user);
    gr("track", "conversion", {
      source: "calendly",
      cal_event: cal_event,
      cal_user: cal_user,
    });
  }
});

window.addEventListener("message", function (e) {
  if (
    /* Hubspot, iframe embeds */
    (e.data.type === "hsFormCallback" &&
      e.data.eventName === "onFormSubmitted") ||
    /* Hubspot, popups */
    (e.origin.endsWith(".hubspot.com") &&
      e.data.formGuid !== null &&
      e.data.accepted == true) ||
    /* Hubspot Calendar book event */
    (e.data.meetingBookSucceeded === true &&
      e.data.meetingsPayload &&
      e.data.meetingsPayload.bookingResponse &&
      e.data.meetingsPayload.bookingResponse.postResponse &&
      e.data.meetingsPayload.bookingResponse.postResponse.contact)
  ) {
    var hubspotutk = null;
    var email = null;
    var cs = document.cookie.split(/\s*;\s*/);

    for (var i = 0; i < cs.length; i++) {
      var c = cs[i].split("=");
      if (c[0] == "hubspotutk") {
        hubspotutk = decodeURIComponent(c[1]);
        break;
      }
    }

    console.log("Found Hubspot utk: " + hubspotutk);

    // Is Calendar
    if (e.data.meetingBookSucceeded === true) {
      email = e.data.meetingsPayload.bookingResponse.postResponse.contact.email;
    }

    if (
      e.data.type === "hsFormCallback" &&
      e.data.eventName === "onFormSubmitted"
    ) {
      email = e.data.data.submissionValues.email;
    }

    console.log("Hubspot tracking");

    if (hubspotutk !== null) {
      console.log("Hubspot form submitted: " + hubspotutk);
      gr("track", "conversion", {
        source: "hubspot",
        hub_utk: hubspotutk,
        email: email,
      });
    }
  }
});
