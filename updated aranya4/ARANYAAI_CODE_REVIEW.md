# AranyaAI Code Review and Fixes

## Changes made
- Added a best-effort online translation fallback in `frontend/aranyai_frontend_integrated/js/lang.js` for text not found in the bundled Kannada, Hindi, Telugu and Tamil dictionary.
- Kept the local translation dictionary as the first choice; unmatched dynamic text is translated asynchronously and cached for the browser session.
- The fallback checks the currently selected language before replacing text, so a delayed response should not overwrite a newly selected language.
- Updated HTML cache-busting references from `lang.js?v=2` to `lang.js?v=3`.

## Important limitation
The fallback uses Google's public web translation endpoint and therefore requires internet access. It is best-effort, not a guaranteed production translation API; network failures, rate limits, or changes to the endpoint can leave text untranslated. For reliable production use, use an official translation API or complete and QA the local translation catalogue. Scientific Latin names should generally remain unchanged; common species names are translated where a dictionary entry exists.

## Findings from source inspection
1. **Translation coverage is incomplete by design:** `lang-species.js` contains 268 phrase rows, while `species-knowledge.js` contains 812 string values. Not all values can be translated through exact dictionary matches. This explains why some detailed guide text remains English.
2. **Dynamic guide coverage needs runtime testing:** the page uses JavaScript-rendered species and care guides. The existing mutation observer handles added text nodes, but this does not prove every page/widget is translated correctly. Test each page and each language after generating recommendations and care plans.
3. **Missing local Chart.js vendor file:** HTML pages reference `vendor/chart.umd.min.js`, but that file is not present in the archive. Pages attempt a CDN fallback, so charts require internet access; offline charts may fail.
4. **Backend CORS is development-oriented:** allowed origins are localhost/127.0.0.1 only. A deployed frontend on another domain will need an explicit production origin in the backend CORS configuration. Do not use a broad wildcard with credentials.
5. **Agronomy content needs expert validation:** the species knowledge catalogue contains planting and pest-management advice. Validate crop-specific recommendations, chemical advice (if added), local climate/soil suitability, and legal restrictions with qualified local agricultural sources before relying on it for field decisions.

## Checks performed
- `node --check` passed for frontend JavaScript files.
- Python `compileall` passed for backend Python files.
- `species_catalog.json` parsed successfully and contains 31 entries.

## Not verified
No browser end-to-end test, live API test, translation-quality review by native speakers, database migration test, or model accuracy validation was performed. The online translation fallback should be tested with internet access in the target browser before deployment.
