/*!
 * mfz-country-select.js v1.0.1
 * Country of Residence dropdown for Meydan Free Zone forms
 * - Supports both name="Country_of_Residence" (Marketing Form)
 *   and name="Country-of-Residence" (Contact Us Form)
 * - Auto-detects user country via api.meydanfz.ae/ip (dedicated route)
 * - Fallback: ipapi.co (if primary fails)
 * - Geo result cached in sessionStorage — only 1 API call per browser session
 * - Double-init guard prevents duplicate event listeners if script loads twice
 * - DocumentFragment used for DOM insertions — zero layout thrash
 * - All failures are silent — form always works without geo
 * Repo: https://github.com/Creo-Global/MFZ-Country-Selector
 * CDN:  https://cdn.jsdelivr.net/gh/Creo-Global/MFZ-Country-Selector@main/mfz-country-select.js
 */

(function () {
  'use strict';

  // ─── Guard: prevent double-init if script tag is duplicated ──────────────────
  if (window.__mfzCountriesLoaded) return;
  window.__mfzCountriesLoaded = true;

  // ─── Country Data ─────────────────────────────────────────────────────────────
  var COUNTRIES = [
    {code:"AF",name:"Afghanistan"},{code:"AX",name:"Åland Islands"},
    {code:"AL",name:"Albania"},{code:"DZ",name:"Algeria"},
    {code:"AS",name:"American Samoa"},{code:"AD",name:"Andorra"},
    {code:"AO",name:"Angola"},{code:"AI",name:"Anguilla"},
    {code:"AG",name:"Antigua & Barbuda"},{code:"AR",name:"Argentina"},
    {code:"AM",name:"Armenia"},{code:"AW",name:"Aruba"},
    {code:"AC",name:"Ascension Island"},{code:"AU",name:"Australia"},
    {code:"AT",name:"Austria"},{code:"AZ",name:"Azerbaijan"},
    {code:"BS",name:"Bahamas"},{code:"BH",name:"Bahrain"},
    {code:"BD",name:"Bangladesh"},{code:"BB",name:"Barbados"},
    {code:"BY",name:"Belarus"},{code:"BE",name:"Belgium"},
    {code:"BZ",name:"Belize"},{code:"BJ",name:"Benin"},
    {code:"BM",name:"Bermuda"},{code:"BT",name:"Bhutan"},
    {code:"BO",name:"Bolivia"},{code:"BA",name:"Bosnia & Herzegovina"},
    {code:"BW",name:"Botswana"},{code:"BR",name:"Brazil"},
    {code:"IO",name:"British Indian Ocean Territory"},{code:"VG",name:"British Virgin Islands"},
    {code:"BN",name:"Brunei"},{code:"BG",name:"Bulgaria"},
    {code:"BF",name:"Burkina Faso"},{code:"BI",name:"Burundi"},
    {code:"KH",name:"Cambodia"},{code:"CM",name:"Cameroon"},
    {code:"CA",name:"Canada"},{code:"CV",name:"Cape Verde"},
    {code:"BQ",name:"Caribbean Netherlands"},{code:"KY",name:"Cayman Islands"},
    {code:"CF",name:"Central African Republic"},{code:"TD",name:"Chad"},
    {code:"CL",name:"Chile"},{code:"CN",name:"China"},
    {code:"CX",name:"Christmas Island"},{code:"CC",name:"Cocos (Keeling) Islands"},
    {code:"CO",name:"Colombia"},{code:"KM",name:"Comoros"},
    {code:"CG",name:"Congo - Brazzaville"},{code:"CD",name:"Congo - Kinshasa"},
    {code:"CK",name:"Cook Islands"},{code:"CR",name:"Costa Rica"},
    {code:"CI",name:"Côte d'Ivoire"},{code:"HR",name:"Croatia"},
    {code:"CU",name:"Cuba"},{code:"CW",name:"Curaçao"},
    {code:"CY",name:"Cyprus"},{code:"CZ",name:"Czechia"},
    {code:"DK",name:"Denmark"},{code:"DJ",name:"Djibouti"},
    {code:"DM",name:"Dominica"},{code:"DO",name:"Dominican Republic"},
    {code:"EC",name:"Ecuador"},{code:"EG",name:"Egypt"},
    {code:"SV",name:"El Salvador"},{code:"GQ",name:"Equatorial Guinea"},
    {code:"ER",name:"Eritrea"},{code:"EE",name:"Estonia"},
    {code:"SZ",name:"Eswatini"},{code:"ET",name:"Ethiopia"},
    {code:"FK",name:"Falkland Islands"},{code:"FO",name:"Faroe Islands"},
    {code:"FJ",name:"Fiji"},{code:"FI",name:"Finland"},
    {code:"FR",name:"France"},{code:"GF",name:"French Guiana"},
    {code:"PF",name:"French Polynesia"},{code:"GA",name:"Gabon"},
    {code:"GM",name:"Gambia"},{code:"GE",name:"Georgia"},
    {code:"DE",name:"Germany"},{code:"GH",name:"Ghana"},
    {code:"GI",name:"Gibraltar"},{code:"GR",name:"Greece"},
    {code:"GL",name:"Greenland"},{code:"GD",name:"Grenada"},
    {code:"GP",name:"Guadeloupe"},{code:"GU",name:"Guam"},
    {code:"GT",name:"Guatemala"},{code:"GG",name:"Guernsey"},
    {code:"GN",name:"Guinea"},{code:"GW",name:"Guinea-Bissau"},
    {code:"GY",name:"Guyana"},{code:"HT",name:"Haiti"},
    {code:"HN",name:"Honduras"},{code:"HK",name:"Hong Kong SAR China"},
    {code:"HU",name:"Hungary"},{code:"IS",name:"Iceland"},
    {code:"IN",name:"India"},{code:"ID",name:"Indonesia"},
    {code:"IR",name:"Iran"},{code:"IQ",name:"Iraq"},
    {code:"IE",name:"Ireland"},{code:"IM",name:"Isle of Man"},
    {code:"IL",name:"Israel"},{code:"IT",name:"Italy"},
    {code:"JM",name:"Jamaica"},{code:"JP",name:"Japan"},
    {code:"JE",name:"Jersey"},{code:"JO",name:"Jordan"},
    {code:"KZ",name:"Kazakhstan"},{code:"KE",name:"Kenya"},
    {code:"KI",name:"Kiribati"},{code:"XK",name:"Kosovo"},
    {code:"KW",name:"Kuwait"},{code:"KG",name:"Kyrgyzstan"},
    {code:"LA",name:"Laos"},{code:"LV",name:"Latvia"},
    {code:"LB",name:"Lebanon"},{code:"LS",name:"Lesotho"},
    {code:"LR",name:"Liberia"},{code:"LY",name:"Libya"},
    {code:"LI",name:"Liechtenstein"},{code:"LT",name:"Lithuania"},
    {code:"LU",name:"Luxembourg"},{code:"MO",name:"Macao SAR China"},
    {code:"MG",name:"Madagascar"},{code:"MW",name:"Malawi"},
    {code:"MY",name:"Malaysia"},{code:"MV",name:"Maldives"},
    {code:"ML",name:"Mali"},{code:"MT",name:"Malta"},
    {code:"MH",name:"Marshall Islands"},{code:"MQ",name:"Martinique"},
    {code:"MR",name:"Mauritania"},{code:"MU",name:"Mauritius"},
    {code:"YT",name:"Mayotte"},{code:"MX",name:"Mexico"},
    {code:"FM",name:"Micronesia"},{code:"MD",name:"Moldova"},
    {code:"MC",name:"Monaco"},{code:"MN",name:"Mongolia"},
    {code:"ME",name:"Montenegro"},{code:"MS",name:"Montserrat"},
    {code:"MA",name:"Morocco"},{code:"MZ",name:"Mozambique"},
    {code:"MM",name:"Myanmar (Burma)"},{code:"NA",name:"Namibia"},
    {code:"NR",name:"Nauru"},{code:"NP",name:"Nepal"},
    {code:"NL",name:"Netherlands"},{code:"NC",name:"New Caledonia"},
    {code:"NZ",name:"New Zealand"},{code:"NI",name:"Nicaragua"},
    {code:"NE",name:"Niger"},{code:"NG",name:"Nigeria"},
    {code:"NU",name:"Niue"},{code:"NF",name:"Norfolk Island"},
    {code:"KP",name:"North Korea"},{code:"MK",name:"North Macedonia"},
    {code:"MP",name:"Northern Mariana Islands"},{code:"NO",name:"Norway"},
    {code:"OM",name:"Oman"},{code:"PK",name:"Pakistan"},
    {code:"PW",name:"Palau"},{code:"PS",name:"Palestinian Territories"},
    {code:"PA",name:"Panama"},{code:"PG",name:"Papua New Guinea"},
    {code:"PY",name:"Paraguay"},{code:"PE",name:"Peru"},
    {code:"PH",name:"Philippines"},{code:"PL",name:"Poland"},
    {code:"PT",name:"Portugal"},{code:"PR",name:"Puerto Rico"},
    {code:"QA",name:"Qatar"},{code:"RE",name:"Réunion"},
    {code:"RO",name:"Romania"},{code:"RU",name:"Russia"},
    {code:"RW",name:"Rwanda"},{code:"WS",name:"Samoa"},
    {code:"SM",name:"San Marino"},{code:"ST",name:"São Tomé & Príncipe"},
    {code:"SA",name:"Saudi Arabia"},{code:"SN",name:"Senegal"},
    {code:"RS",name:"Serbia"},{code:"SC",name:"Seychelles"},
    {code:"SL",name:"Sierra Leone"},{code:"SG",name:"Singapore"},
    {code:"SX",name:"Sint Maarten"},{code:"SK",name:"Slovakia"},
    {code:"SI",name:"Slovenia"},{code:"SB",name:"Solomon Islands"},
    {code:"SO",name:"Somalia"},{code:"ZA",name:"South Africa"},
    {code:"KR",name:"South Korea"},{code:"SS",name:"South Sudan"},
    {code:"ES",name:"Spain"},{code:"LK",name:"Sri Lanka"},
    {code:"BL",name:"St. Barthélemy"},{code:"SH",name:"St. Helena"},
    {code:"KN",name:"St. Kitts & Nevis"},{code:"LC",name:"St. Lucia"},
    {code:"MF",name:"St. Martin"},{code:"PM",name:"St. Pierre & Miquelon"},
    {code:"VC",name:"St. Vincent & Grenadines"},{code:"SD",name:"Sudan"},
    {code:"SR",name:"Suriname"},{code:"SJ",name:"Svalbard & Jan Mayen"},
    {code:"SE",name:"Sweden"},{code:"CH",name:"Switzerland"},
    {code:"SY",name:"Syria"},{code:"TW",name:"Taiwan"},
    {code:"TJ",name:"Tajikistan"},{code:"TZ",name:"Tanzania"},
    {code:"TH",name:"Thailand"},{code:"TL",name:"Timor-Leste"},
    {code:"TG",name:"Togo"},{code:"TK",name:"Tokelau"},
    {code:"TO",name:"Tonga"},{code:"TT",name:"Trinidad & Tobago"},
    {code:"TN",name:"Tunisia"},{code:"TR",name:"Turkey"},
    {code:"TM",name:"Turkmenistan"},{code:"TC",name:"Turks & Caicos Islands"},
    {code:"TV",name:"Tuvalu"},{code:"VI",name:"U.S. Virgin Islands"},
    {code:"UG",name:"Uganda"},{code:"UA",name:"Ukraine"},
    {code:"AE",name:"United Arab Emirates"},{code:"GB",name:"United Kingdom"},
    {code:"US",name:"United States"},{code:"UY",name:"Uruguay"},
    {code:"UZ",name:"Uzbekistan"},{code:"VU",name:"Vanuatu"},
    {code:"VA",name:"Vatican City"},{code:"VE",name:"Venezuela"},
    {code:"VN",name:"Vietnam"},{code:"WF",name:"Wallis & Futuna"},
    {code:"EH",name:"Western Sahara"},{code:"YE",name:"Yemen"},
    {code:"ZM",name:"Zambia"},{code:"ZW",name:"Zimbabwe"}
  ];

  // ─── Config ───────────────────────────────────────────────────────────────────
  var DROPDOWN_SELECTOR   = '[name="Country_of_Residence"], [name="Country-of-Residence"]';
  var CODE_FIELD_SELECTOR = '[name="Country_of_Residence_Code"], [name="Country-of-Residence-Code"]';
  var INIT_ATTR           = 'data-mfz-country-initialized';
  var GEO_CACHE_KEY       = 'mfz_geo_country';

  // ─── Sync ISO code → hidden field in same form ────────────────────────────────
  function syncCodeField(select) {
    var form = select.closest('form');
    if (!form) return;
    var codeField = form.querySelector(CODE_FIELD_SELECTOR);
    if (!codeField) return;
    var opt = select.options[select.selectedIndex];
    codeField.value = (opt && opt.dataset.code) ? opt.dataset.code : '';
  }

  // ─── Select by ISO code + sync ────────────────────────────────────────────────
  function setCountryByCode(select, isoCode) {
    var opts = select.options;
    for (var i = 0; i < opts.length; i++) {
      opts[i].classList.remove('selected', 'current');
    }
    for (var i = 0; i < opts.length; i++) {
      if (opts[i].dataset.code === isoCode) {
        select.selectedIndex = i;
        opts[i].classList.add('selected', 'current');
        syncCodeField(select);

        // ← ADD THIS: notify the form that the value changed
        select.dispatchEvent(new Event('change', { bubbles: true }));
        select.dispatchEvent(new Event('input',  { bubbles: true }));

        return;
      }
    }
  }

  // ─── Build a single dropdown using DocumentFragment (zero layout thrash) ──────
  function buildDropdown(select) {
    if (select.getAttribute(INIT_ATTR)) return; // guard restored
    select.setAttribute(INIT_ATTR, 'true');

    while (select.options.length > 1) select.remove(1); // clear, keep placeholder

    var frag = document.createDocumentFragment();
    var pinned = COUNTRIES.filter(function(c) { return c.code === 'AE'; });
    var rest   = COUNTRIES.filter(function(c) { return c.code !== 'AE'; });
    pinned.concat(rest).forEach(function(c) {
        var opt = document.createElement('option');
        opt.value        = c.name;
        opt.dataset.code = c.code;
        opt.textContent  = c.name;
        frag.appendChild(opt);
    });
    select.appendChild(frag);

    function markSelectedOption(select) {
        Array.prototype.forEach.call(select.options, function(opt) {
            opt.classList.remove('selected', 'current');
        });
        var chosen = select.options[select.selectedIndex];
        if (chosen && chosen.value) {
            chosen.classList.add('selected', 'current');
        }
    }
 
    select.addEventListener('change', function() {
      syncCodeField(this);
      markSelectedOption(this);
      this.dataset.resolvedCountryValue = this.value;
    });
  }

  // ─── Geo-detection: cached in sessionStorage, 1 API call per session ─────────
  // Primary:  api.meydanfz.ae/ip  (dedicated MFZ route)
  // Fallback: ipapi.co/json       (if primary fails)
  // Both fail silently — user just selects manually
  //
  // Expected primary response shapes (any of these are handled):
  //   { "country_code": "AE" }
  //   { "countryCode": "AE" }
  //   { "country": "AE" }
  function applyGeoToSelects(selects, isoCode) {
    Array.prototype.forEach.call(selects, function(select) {
      if (!select.value) setCountryByCode(select, isoCode);
    });
  }

  function detectAndApplyGeoCountry(selects) {
    // Check sessionStorage cache first — zero API calls on repeat visits
    try {
      var cached = sessionStorage.getItem(GEO_CACHE_KEY);
      if (cached) { applyGeoToSelects(selects, cached); return; }
    } catch(e) {}

    // Helper: fire one XHR and call onSuccess(isoCode) or onFail()
    function fetchGeo(url, parseCode, onSuccess, onFail) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.timeout = 3000;
        xhr.onload = function() {
          if (xhr.status !== 200) { onFail(); return; }
          try {
            var data = JSON.parse(xhr.responseText);
            var code = parseCode(data);
            if (code) { onSuccess(code.toUpperCase()); }
            else { onFail(); }
          } catch(e) { onFail(); }
        };
        xhr.onerror   = function() { onFail(); };
        xhr.ontimeout = function() { onFail(); };
        xhr.send();
      } catch(e) { onFail(); }
    }

    function saveAndApply(code) {
      try { sessionStorage.setItem(GEO_CACHE_KEY, code); } catch(e) {}
      applyGeoToSelects(selects, code);
    }

    // Primary: api.meydanfz.ae/ip — dedicated MFZ geo route
    // Handles common ISO code field names returned by typical IP APIs
    fetchGeo(
      'https://api.meydanfz.ae/ip',
      function(d) {
        return d && (d.country_code || d.countryCode || d.country || null);
      },
      saveAndApply,
      function() {
        // Fallback: ipapi.co — silent backup if primary is unreachable
        fetchGeo(
          'https://ipapi.co/json/',
          function(d) { return d && d.country_code; },
          saveAndApply,
          function() { /* both failed — user selects manually */ }
        );
      }
    );
  }

  // ─── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    var selects = document.querySelectorAll(DROPDOWN_SELECTOR);
    if (!selects.length) return; // no country dropdowns on page — exit immediately

    Array.prototype.forEach.call(selects, buildDropdown); // sync + instant
    //detectAndApplyGeoCountry(selects);                    // async + non-blocking / disable auto detect
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
