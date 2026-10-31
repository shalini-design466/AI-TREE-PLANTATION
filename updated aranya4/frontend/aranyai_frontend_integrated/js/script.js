
        // ============================================================
        // COMPLETE JAVASCRIPT - All 20 Species
        // ============================================================

        // ===== ARANYAAI BACKEND =====
// The backend's dev port isn't always the same on every machine (8000 is
// the FastAPI default, but it's a common conflict, so this project's own
// docs have it running on 8001 too). Previously this was a single hardcoded
// default that silently broke every API call whenever the backend wasn't on
// exactly that port. An explicit override (localStorage.setItem
// ('aranyaApiBase', 'http://127.0.0.1:XXXX')) always wins; otherwise we
// probe the common candidates once and cache whichever one answers.
// Single-server mode: when this page is served by the AranyaAI backend itself,
// the API lives at the same address (location.origin) -- tried first.
const API_BASE_CANDIDATES = [ ...(location.protocol.startsWith('http') ? [location.origin] : []), 'http://127.0.0.1:8000', 'http://127.0.0.1:8001'];
let API_BASE = localStorage.getItem('aranyaApiBase') || API_BASE_CANDIDATES[0];
let apiBaseResolved = !!localStorage.getItem('aranyaApiBase');
async function resolveApiBase(){
    if (apiBaseResolved) return API_BASE;
    for (const candidate of API_BASE_CANDIDATES) {
        try {
            const res = await fetch(candidate + '/api/health', { signal: AbortSignal.timeout(1500) });
            if (res.ok) { API_BASE = candidate; break; }
        } catch (e) { /* try next candidate */ }
    }
    apiBaseResolved = true;
    return API_BASE;
}
function getAuthToken(){ return localStorage.getItem('aranyaAccessToken') || ''; }
async function apiFetch(path, options={}){
    await resolveApiBase();
    const headers = new Headers(options.headers || {});
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type','application/json');
    const token = getAuthToken();
    if (token) headers.set('Authorization', 'Bearer ' + token);
    const res = await fetch(API_BASE + path, {...options, headers});
    let data = null;
    try { data = await res.json(); } catch(e) {}
    if (!res.ok) throw new Error(data?.detail || `Request failed (${res.status})`);
    return data;
}
function backendReady(){ return !!getAuthToken(); }

// ===== PER-USER BROWSER STORAGE =====
// Everything a person enters (analysis, plantation plan, form values) is saved under THEIR OWN user id,
// so another account on the same browser never sees it. (It used to be one shared box for everybody.)
function currentUserId(){ try{ const u=JSON.parse(localStorage.getItem('registeredUser')||'null'); return (u&&u.id!=null)?String(u.id):''; }catch(e){ return ''; } }
function ukey(name){ const id=currentUserId(); return name+':u'+(id||'anon'); }
function uGet(name){ try{ return JSON.parse(localStorage.getItem(ukey(name))||'null'); }catch(e){ return null; } }
function uSetRaw(name,str){ try{ localStorage.setItem(ukey(name),str); }catch(e){} }
// Remove the old shared (all-users) copies once.
['lastAnalysis','plantationPlan'].forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} });

// Units: the app works in FEET (local practice). The backend maths is in metres, so we convert at the API boundary.
const AU = window.AranyaUnits || { M_PER_FT:0.3048, spacingFor:()=>({tree:10,row:10,text:''}), maxSpeciesForSqft:()=>8, fmtFt:n=>n+' ft', fmtNum:n=>String(n), SQFT_PER_SPECIES:80, SPACING:{} };
const M_PER_FT = AU.M_PER_FT || 0.3048;
const SQFT_PER_ACRE = 43560;
function aranyaToast(msg, warn){
    let el=document.getElementById('aranyaToast');
    if(!el){ el=document.createElement('div'); el.id='aranyaToast'; el.className='aranya-toast'; el.setAttribute('role','status'); document.body.appendChild(el); }
    el.textContent=msg; el.classList.toggle('warn',!!warn); el.style.display='block';
    clearTimeout(el._t); el._t=setTimeout(()=>{ el.style.display='none'; }, 4200);
}

// ===== 20 COMMERCIAL TREE SPECIES =====
        const speciesData = [
            {
                id: 1,
                name: 'Teak',
                icon: '🌳',
                region: ['tropical', 'subtropical'],
                soil: ['loamy', 'laterite'],
                maturity: 25,
                value: '₹ 1,20,000/ton',
                waterNeed: 'Medium',
                roi: 'High',
                description: 'Premium hardwood with exceptional durability and commercial value.',
                uses: 'Furniture, flooring, construction, shipbuilding, veneer'
            },
            {
                id: 2,
                name: 'Sandalwood',
                icon: '🌲',
                region: ['tropical'],
                soil: ['loamy', 'sandy'],
                maturity: 30,
                value: '₹ 2,50,000/ton',
                waterNeed: 'Low',
                roi: 'Very High',
                description: 'Highly valued for its aromatic heartwood and essential oil.',
                uses: 'Perfumery, cosmetics, pharmaceuticals, carving, incense'
            },
            {
                id: 3,
                name: 'Eucalyptus',
                icon: '🌿',
                region: ['tropical', 'subtropical', 'arid'],
                soil: ['loamy', 'sandy', 'laterite'],
                maturity: 10,
                value: '₹ 45,000/ton',
                waterNeed: 'Medium',
                roi: 'Medium',
                description: 'Fast-growing timber tree with multiple commercial uses.',
                uses: 'Paper pulp, timber, essential oil, bioenergy, poles'
            },
            {
                id: 4,
                name: 'Coconut',
                icon: '🥥',
                region: ['tropical'],
                soil: ['sandy', 'loamy'],
                maturity: 7,
                value: '₹ 30,000/ton (copra)',
                waterNeed: 'High',
                roi: 'Medium',
                description: 'Versatile palm with high economic value from fruits to timber.',
                uses: 'Coconut oil, copra, coir, timber, beverages, fiber'
            },
            {
                id: 5,
                name: 'Mango',
                icon: '🥭',
                region: ['tropical', 'subtropical'],
                soil: ['loamy', 'clay'],
                maturity: 8,
                value: '₹ 25,000/ton',
                waterNeed: 'Medium',
                roi: 'Medium',
                description: 'Popular fruit tree with high demand in domestic and export markets.',
                uses: 'Fresh fruit, juice, pulp, pickles, dried fruit, chutney'
            },
            {
                id: 6,
                name: 'Amla',
                icon: '🍈',
                region: ['tropical', 'subtropical', 'arid'],
                soil: ['sandy', 'loamy'],
                maturity: 6,
                value: '₹ 20,000/ton',
                waterNeed: 'Low',
                roi: 'Medium',
                description: 'Medicinal fruit tree with high demand in Ayurvedic industry.',
                uses: 'Medicines, health supplements, pickles, juices, hair care'
            },
            {
                id: 7,
                name: 'Cashew',
                icon: '🥜',
                region: ['tropical', 'arid'],
                soil: ['sandy', 'laterite'],
                maturity: 5,
                value: '₹ 40,000/ton',
                waterNeed: 'Low',
                roi: 'High',
                description: 'Drought-resistant nut tree with profitable returns.',
                uses: 'Cashew nuts, cashew apple, oil, Feni (liquor), shell oil'
            },
            {
                id: 8,
                name: 'Arecanut',
                icon: '🌴',
                region: ['tropical'],
                soil: ['clay', 'loamy'],
                maturity: 8,
                value: '₹ 35,000/ton',
                waterNeed: 'High',
                roi: 'Medium',
                description: 'Economically important palm with consistent demand.',
                uses: 'Betel nut, chewing, medicine, dyes, thatch'
            },
            {
                id: 9,
                name: 'Neem',
                icon: '🌳',
                region: ['tropical', 'subtropical', 'arid'],
                soil: ['loamy', 'sandy', 'laterite'],
                maturity: 15,
                value: '₹ 50,000/ton',
                waterNeed: 'Low',
                roi: 'High',
                description: 'Versatile tree with medicinal and commercial value.',
                uses: 'Neem oil, pesticides, medicines, timber, soap, toothpaste'
            },
            {
                id: 10,
                name: 'Bamboo',
                icon: '🎋',
                region: ['tropical', 'subtropical'],
                soil: ['loamy', 'clay'],
                maturity: 5,
                value: '₹ 25,000/ton',
                waterNeed: 'High',
                roi: 'High',
                description: 'Fast-growing grass with extensive commercial applications.',
                uses: 'Construction, furniture, paper, textiles, flooring, scaffolding'
            },
            {
                id: 11,
                name: 'Rubber',
                icon: '🌱',
                region: ['tropical'],
                soil: ['loamy', 'laterite'],
                maturity: 7,
                value: '₹ 60,000/ton',
                waterNeed: 'High',
                roi: 'High',
                description: 'Primary source of natural rubber with global demand.',
                uses: 'Natural rubber, latex, tires, gloves, industrial products'
            },
            {
                id: 12,
                name: 'Coffee',
                icon: '☕',
                region: ['tropical', 'subtropical'],
                soil: ['loamy', 'laterite'],
                maturity: 4,
                value: '₹ 80,000/ton',
                waterNeed: 'Medium',
                roi: 'High',
                description: 'High-value beverage crop with premium pricing.',
                uses: 'Coffee beans, beverages, cosmetics, flavorings'
            },
            {
                id: 13,
                name: 'Tea',
                icon: '🍃',
                region: ['tropical', 'subtropical'],
                soil: ['loamy', 'laterite'],
                maturity: 3,
                value: '₹ 70,000/ton',
                waterNeed: 'High',
                roi: 'High',
                description: 'Popular beverage crop with established global market.',
                uses: 'Tea leaves, beverages, health supplements, cosmetics'
            },
            {
                id: 14,
                name: 'Cinnamon',
                icon: '🌿',
                region: ['tropical'],
                soil: ['loamy', 'sandy'],
                maturity: 3,
                value: '₹ 90,000/ton',
                waterNeed: 'Medium',
                roi: 'High',
                description: 'Valuable spice with high demand in culinary and medicinal uses.',
                uses: 'Spices, essential oil, medicine, cosmetics, flavoring'
            },
            {
                id: 15,
                name: 'Nutmeg',
                icon: '🌰',
                region: ['tropical'],
                soil: ['loamy', 'laterite'],
                maturity: 6,
                value: '₹ 85,000/ton',
                waterNeed: 'Medium',
                roi: 'High',
                description: 'Premium spice with high export value.',
                uses: 'Spices, essential oil, medicine, flavoring, cosmetics'
            },
            {
                id: 16,
                name: 'Clove',
                icon: '🌿',
                region: ['tropical'],
                soil: ['loamy', 'laterite'],
                maturity: 4,
                value: '₹ 95,000/ton',
                waterNeed: 'Medium',
                roi: 'Very High',
                description: 'High-value spice with medicinal and culinary applications.',
                uses: 'Spices, essential oil, medicine, cosmetics, flavoring'
            },
            {
                id: 17,
                name: 'Pepper',
                icon: '🌿',
                region: ['tropical', 'subtropical'],
                soil: ['loamy', 'laterite'],
                maturity: 3,
                value: '₹ 1,00,000/ton',
                waterNeed: 'Medium',
                roi: 'Very High',
                description: 'King of spices with premium global demand.',
                uses: 'Spices, essential oil, medicine, flavoring, preservative'
            },
            {
                id: 18,
                name: 'Cardamom',
                icon: '🌿',
                region: ['tropical'],
                soil: ['loamy', 'laterite'],
                maturity: 3,
                value: '₹ 1,20,000/ton',
                waterNeed: 'High',
                roi: 'Very High',
                description: 'Premium spice with high demand in domestic and export markets.',
                uses: 'Spices, essential oil, medicine, flavoring, beverages'
            },
            {
                id: 19,
                name: 'Tamarind',
                icon: '🌳',
                region: ['tropical', 'arid'],
                soil: ['sandy', 'loamy'],
                maturity: 6,
                value: '₹ 15,000/ton',
                waterNeed: 'Low',
                roi: 'Medium',
                description: 'Drought-resistant tree with multiple uses.',
                uses: 'Fruit pulp, chutney, medicine, wood, furniture, dyes'
            },
            {
                id: 20,
                name: 'Mahogany',
                icon: '🌳',
                region: ['tropical'],
                soil: ['loamy', 'laterite'],
                maturity: 25,
                value: '₹ 1,50,000/ton',
                waterNeed: 'Medium',
                roi: 'High',
                description: 'Premium hardwood with exceptional beauty and durability.',
                uses: 'Furniture, cabinets, musical instruments, boat building, veneer'
            }
        ];

        // Commercial-only catalog: exclude general-purpose/non-tree entries.
        let commercialSpecies = [];
        const REGION_LABELS = {tropical:'Tropical',subtropical:'Sub-Tropical',arid:'Arid',semi_arid:'Semi-Arid',coastal:'Coastal',temperate_hill:'Temperate / Hill'};
        // Photos are fetched LIVE from Wikipedia's public REST API by article
        // title, instead of hardcoded Wikimedia Commons file links. Guessed
        // Commons filenames break silently when they don't exactly match the
        // real file (case/spacing/suffix) -- fetching by article title avoids
        // that entirely, and self-heals if Wikipedia's own lead image changes.
        // Only species whose common name is ambiguous on Wikipedia need an
        // explicit override to the correct article title.
        const WIKI_TITLE_OVERRIDES = {
            'Coconut': 'Cocos nucifera',
            'Amla': 'Phyllanthus emblica',
            'Arecanut': 'Areca nut',
            'Rubber': 'Hevea brasiliensis',
            'Pepper': 'Black pepper',
            'Mahogany': 'Swietenia macrophylla',
            // Added for image accuracy — these common names are ambiguous
            // or point to a disambiguation/wrong page on plain Wikipedia.
            'Teak': 'Tectona grandis',
            'Sandalwood': 'Santalum album',
            'Neem': 'Azadirachta indica',
            'Coffee': 'Coffea',
            'Tea': 'Camellia sinensis',
            'Cinnamon': 'Cinnamomum verum',
            'Nutmeg': 'Myristica fragrans',
            'Clove': 'Syzygium aromaticum',
            'Cardamom': 'Elettaria cardamomum',
            'Bamboo': 'Bambusoideae',
            // Catalog species that were previously missing an override and
            // resolving to the wrong Wikipedia page entirely:
            //  - 'Rosewood' plain title is about the generic timber (and in
            //    some cases resolves to an unrelated person/place page), not
            //    the actual tree -- pinned to the Indian rosewood species
            //    this catalog actually means.
            //  - 'Silver Oak' collides with buildings/schools/estates that
            //    share the name; pinned to the actual species grown as
            //    "silver oak" in Indian plantations.
            //  - 'Red Sanders', 'Marigold', 'Brinjal', 'Chilli' and
            //    'Leafy Greens' are common Indian-English/agricultural
            //    names that don't reliably map to a single unambiguous
            //    Wikipedia article title.
            'Rosewood': 'Dalbergia latifolia',
            'Silver Oak': 'Grevillea robusta',
            'Red Sanders': 'Pterocarpus santalinus',
            'Agarwood': 'Aquilaria malaccensis',
            'Moringa': 'Moringa oleifera',
            'Marigold': 'Tagetes',
            'Brinjal': 'Eggplant',
            'Chilli': 'Chili pepper',
            'Leafy Greens': 'Leaf vegetable',
        };

        // Fallback second-choice titles if the first Wikipedia lookup returns
        // no image (rare, but keeps every catalog card showing a real photo
        // rather than a blank placeholder).
        const WIKI_FALLBACK_TITLES = {
            'Cashew': 'Anacardium occidentale',
            'Guava': 'Psidium guajava',
            'Tamarind': 'Tamarindus indica',
            'Agarwood': 'Agarwood',
            'Marigold': 'Calendula',
        };

        const speciesImageCache = new Map();
        const CATALOG_IMAGE_OVERRIDES = {};
        // v2 key: discards photos cached by earlier versions, which could
        // include botanical drawings / plates used as a Wikipedia lead image.
        const IMG_CACHE_KEY = 'aranyaSpeciesPhotoCache_v3';
        let persistedImageCache = null;
        function loadPersistedImageCache() {
            if (persistedImageCache) return persistedImageCache;
            try { persistedImageCache = JSON.parse(localStorage.getItem(IMG_CACHE_KEY) || '{}'); }
            catch (e) { persistedImageCache = {}; }
            return persistedImageCache;
        }
        function savePersistedImage(name, url) {
            const cache = loadPersistedImageCache();
            cache[name] = { url, t: Date.now() };
            try { localStorage.setItem(IMG_CACHE_KEY, JSON.stringify(cache)); } catch (e) { /* storage full/unavailable */ }
        }
        const IMG_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

        // ---- REAL PHOTOGRAPHS ONLY ----
        // Wikipedia's lead image for a plant is often a botanical drawing or a
        // plate (e.g. Koehler's Medizinal-Pflanzen), a herbarium sheet, a map,
        // or a photo of wood/seeds/powder. Those are rejected here: we search
        // Wikimedia Commons for the species' scientific name and only accept
        // JPEG photographs whose file name doesn't look like art or a product.
        const SCIENTIFIC_NAME = {
            'Agarwood':'Aquilaria malaccensis','Amla':'Phyllanthus emblica','Arecanut':'Areca catechu','Bamboo':'Bambusa vulgaris',
            'Banana':'Musa acuminata','Brinjal':'Solanum melongena','Cashew':'Anacardium occidentale','Chilli':'Capsicum annuum',
            'Coconut':'Cocos nucifera','Eucalyptus':'Eucalyptus globulus','Ginger':'Zingiber officinale','Guava':'Psidium guajava',
            'Jackfruit':'Artocarpus heterophyllus','Leafy Greens':'Spinacia oleracea','Mahogany':'Swietenia macrophylla',
            'Mango':'Mangifera indica','Marigold':'Tagetes erecta','Moringa':'Moringa oleifera','Neem':'Azadirachta indica',
            'Okra':'Abelmoschus esculentus','Papaya':'Carica papaya','Pineapple':'Ananas comosus','Red Sanders':'Pterocarpus santalinus',
            'Rosewood':'Dalbergia latifolia','Sandalwood':'Santalum album','Silver Oak':'Grevillea robusta','Sugarcane':'Saccharum officinarum',
            'Teak':'Tectona grandis','Tomato':'Solanum lycopersicum','Turmeric':'Curcuma longa','Watermelon':'Citrullus lanatus'
        };
        const NOT_A_PHOTO = /illustrat|plate|drawing|sketch|herbari|specimen|botanic|k[oö]hler|koehler|flora\b|\.svg|\bmaps?\b|distribution|diagram|logo|\bicons?\b|stamp|painting|engrav|lithograph|\bcoins?\b|\bseeds?\b|\bwood\b|timber|furniture|powder|\boil\b|extract|packag|\blabel|\bfig\b|\bpng\b|\bgif\b|\bpdf\b|book|herbal|manuscript|nursery catalog|sculpture|statue|\bcut\b|slice|sliced|market|dish|recipe|cooked/i;
        const PHOTO_HINT = /tree|plantation|plant|leaves|leaf|flower|fruit|field|crop|garden|farm|orchard|forest|grove|harvest|bush|shrub|palm/i;
        // Food crops should show the harvested crop/produce when available, not only a generic plant photo.
        const PRODUCE_IMAGE_TYPE = {Banana:'fruit',Brinjal:'vegetable',Chilli:'fruit',Ginger:'root',Guava:'fruit',Jackfruit:'fruit','Leafy Greens':'leafy vegetable',Mango:'fruit',Marigold:'flower',Okra:'vegetable',Papaya:'fruit',Pineapple:'fruit',Tomato:'fruit',Turmeric:'rhizome',Watermelon:'fruit',Sugarcane:'crop'};
        // Verified real-photo fallbacks for common produce examples. These are Wikimedia Commons
        // photographs, not illustrations or generated images.
        const VERIFIED_REAL_PHOTOS = {
            'Tomato':'https://commons.wikimedia.org/wiki/Special:Redirect/file/Tomato%20Fruit.jpg',
            'Jackfruit':'https://commons.wikimedia.org/wiki/Special:Redirect/file/Artocarpus%20Heterophyllus.jpg',
            'Chilli':'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chili%20pepper%20fruit%20on%20a%20plant.jpg'
        };

        function pickBestPhoto(pages) {
            const list = Object.values(pages || {}).map(pg => {
                const info = pg.imageinfo && pg.imageinfo[0];
                return info ? { title: pg.title || '', url: info.thumburl || info.url, mime: info.mime, w: info.width || 0, h: info.height || 0 } : null;
            }).filter(Boolean)
              .filter(x => x.mime === 'image/jpeg' && x.w >= 500 && x.h >= 350 && !NOT_A_PHOTO.test(x.title));
            if (!list.length) return null;
            list.sort((a, b) => ((PHOTO_HINT.test(b.title) ? 2 : 0) + (b.w >= 1000 ? 1 : 0)) - ((PHOTO_HINT.test(a.title) ? 2 : 0) + (a.w >= 1000 ? 1 : 0)));
            return list[0].url;
        }
        const COMMONS_API = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=url%7Cmime%7Csize&iiurlwidth=500';
        async function commonsCategoryPhoto(category) {
            try {
                const res = await fetch(`${COMMONS_API}&generator=categorymembers&gcmtype=file&gcmlimit=50&gcmtitle=${encodeURIComponent('Category:' + category)}`);
                if (res.ok) { const d = await res.json(); return pickBestPhoto(d.query && d.query.pages); }
            } catch (e) { /* next tier */ }
            return null;
        }
        async function commonsSearchPhoto(term) {
            try {
                const res = await fetch(`${COMMONS_API}&generator=search&gsrnamespace=6&gsrlimit=30&gsrsearch=${encodeURIComponent(term + ' filetype:bitmap')}`);
                if (res.ok) { const d = await res.json(); return pickBestPhoto(d.query && d.query.pages); }
            } catch (e) { /* next tier */ }
            return null;
        }
        // Last resort: Wikipedia's lead image -- but only when its file name
        // shows it is a JPEG photograph rather than a drawing/plate/map.
        async function wikipediaPhoto(title) {
            try {
                const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`);
                if (res.ok) {
                    const d = await res.json();
                    const src = d.thumbnail && d.thumbnail.source;
                    if (src) { const decoded = decodeURIComponent(src); if (/\.jpe?g/i.test(decoded) && !NOT_A_PHOTO.test(decoded)) return src; }
                }
            } catch (e) { /* none */ }
            return null;
        }

        // Local photos shipped in assets/species/ are tried first; the online
        // lookup below is only a fallback when a local file is missing.
        const localPhotoCache = new Map();
        function localSpeciesPhotoUrl(name) {
            if (localPhotoCache.has(name)) return localPhotoCache.get(name);
            const url = 'assets/species/' + String(name).trim().toLowerCase().replace(/\s+/g, '-') + '.jpg';
            const p = new Promise(resolve => {
                const im = new Image();
                im.onload = () => resolve(url);
                im.onerror = () => resolve(null);
                im.src = url;
            });
            localPhotoCache.set(name, p);
            return p;
        }
        function fetchSpeciesImage(name) {
            return localSpeciesPhotoUrl(name).then(url => url || fetchRemoteSpeciesImage(name));
        }

        function fetchRemoteSpeciesImage(name) {
            if (speciesImageCache.has(name)) return speciesImageCache.get(name);
            const override = CATALOG_IMAGE_OVERRIDES[name];
            if (VERIFIED_REAL_PHOTOS[name]) { const p=Promise.resolve(VERIFIED_REAL_PHOTOS[name]); speciesImageCache.set(name,p); return p; }
            // Catalog used to contain relative assets/species/*.jpg paths, but those files
            // were not shipped in the ZIP. Never let a missing relative path block the
            // real-photo resolver. Only explicit absolute HTTPS photo URLs are overrides.
            if (override && /^https:\/\//i.test(override)) { const p=Promise.resolve(override); speciesImageCache.set(name,p); return p; }
            const cache = loadPersistedImageCache();
            const cached = cache[name];
            if (cached && cached.url && (Date.now() - (cached.t || 0)) < IMG_CACHE_TTL_MS) {
                const p = Promise.resolve(cached.url);
                speciesImageCache.set(name, p);
                return p;
            }
            // Cache the in-flight PROMISE so many <img> tags for one species
            // (e.g. every cell of the 4x4 grid) share a single request.
            const promise = (async () => {
                const sci = SCIENTIFIC_NAME[name];
                let url = null;
                if (sci) {
                    url = await commonsCategoryPhoto(sci);
                    if (!url) url = await commonsSearchPhoto(sci);
                }
                const produceType = PRODUCE_IMAGE_TYPE[name];
                if (!url) url = await commonsSearchPhoto(produceType ? `${name} ${produceType}` : name + ' plant');
                if (!url && produceType) url = await commonsSearchPhoto(`${sci || name} ${produceType}`);
                if (!url) url = await wikipediaPhoto(WIKI_TITLE_OVERRIDES[name] || name);
                if (!url && WIKI_FALLBACK_TITLES[name]) url = await wikipediaPhoto(WIKI_FALLBACK_TITLES[name]);
                if (url) savePersistedImage(name, url);
                return url;
            })();
            speciesImageCache.set(name, promise);
            return promise;
        }

        // Never draw a substitute picture: if no real photograph can be
        // loaded, show the species name as plain text instead.
        function showPhotoMissing(img) {
            if (!img || !img.parentNode) return;
            const span = document.createElement('span');
            span.className = 'photo-missing';
            span.textContent = img.dataset.treeName || img.alt || 'Photo unavailable';
            img.replaceWith(span);
        }

        // Call after any innerHTML render that included <img data-tree-name="...">
        // placeholders -- fetches and fills in each one that hasn't loaded yet.
        function hydrateSpeciesImages(root) {
            root = root || document;
            if (!root.querySelectorAll) return;
            root.querySelectorAll('img[data-tree-name]:not([data-hydrated])').forEach(img => {
                img.dataset.hydrated = '1';
                img.addEventListener('error', () => showPhotoMissing(img));
                fetchSpeciesImage(img.dataset.treeName).then(url => {
                    if (url) img.src = url; else showPhotoMissing(img);
                });
            });
        }

        // ===== SOIL TYPE — real photo preview (Location page) =====
        // Fetched live from Wikipedia the same way species photos are, so
        // every soil type shows a genuine natural photograph, not an icon.
        const SOIL_INFO = {
            loamy: {
                label: 'Loamy soil',
                desc: 'A balanced mixture of sand, silt and clay. Usually dark, crumbly and fertile with good moisture retention and drainage.',
                image: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Loam_soil_of_Hesbaye.jpg',
                source: 'Wikimedia Commons — Loam soil of Hesbaye'
            },
            clay: {
                label: 'Clay soil',
                desc: 'Fine-textured soil that holds water and nutrients strongly. It can become sticky when wet and hard when dry.',
                image: 'https://upload.wikimedia.org/wikipedia/commons/d/da/Clay_Soil.jpg',
                source: 'Wikimedia Commons — Clay Soil'
            },
            sandy: {
                label: 'Sandy soil',
                desc: 'Coarse, gritty soil with large particles and rapid drainage. It usually needs more frequent irrigation and nutrient management.',
                image: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Sandy-soil.jpg',
                source: 'Wikimedia Commons — Sandy-soil.jpg'
            },
            laterite: {
                label: 'Laterite soil',
                desc: 'Reddish, iron-rich tropical soil. It is commonly well drained and can support hardy trees when nutrients and moisture are managed well.',
                image: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Laterite_soil_adhering_motorcycle_wheel_wet_season_Thailand.jpg',
                source: 'Wikimedia Commons — Laterite soil, Thailand'
            }
        };
        SOIL_INFO.Alluvial = {label:'Alluvial soil',desc:'Fertile soil formed by deposited sediments; drainage and nutrient management depend on local texture.',image:SOIL_INFO.loamy.image,source:'Wikimedia Commons — soil reference'};
        SOIL_INFO['Red loam'] = {label:'Red loam soil',desc:'Red, iron-rich loam with good structure when organic matter and moisture are managed well.',image:SOIL_INFO.laterite.image,source:'Wikimedia Commons — soil reference'};
        SOIL_INFO.Rocky = {label:'Rocky soil',desc:'Soil with substantial rock fragments; planting depth, drainage and pit preparation require site assessment.',image:SOIL_INFO.sandy.image,source:'Wikimedia Commons — soil reference'};
        SOIL_INFO['Sandy loam'] = {label:'Sandy loam soil',desc:'A lighter soil balancing drainage with some moisture retention; organic matter can improve water holding.',image:SOIL_INFO.sandy.image,source:'Wikimedia Commons — soil reference'};
        SOIL_INFO.Loamy = SOIL_INFO.loamy;
        SOIL_INFO.Laterite = SOIL_INFO.laterite;

        const soilImageCache = new Map();

        // ===== Auto-fill soil pH / N-P-K from typical values per soil type =====
        // Most people don't have a lab report handy. These are the average pH
        // and N-P-K this project's own training dataset actually has for each
        // soil type (final_training_dataset.csv), so the recommendation model
        // still gets a real, soil-specific value for all 7 of its inputs --
        // the fields are just filled in for you instead of asked as numbers.
        // Anyone who does have lab results can still see and edit them.
        const SOIL_TYPICAL_NPK = {
            'Loamy':      { ph: 6.3, n: 65.4, p: 48.9, k: 59.6 },
            'Alluvial':   { ph: 6.5, n: 63.8, p: 45.3, k: 51.3 },
            'Sandy loam': { ph: 6.4, n: 45.8, p: 31.4, k: 41.5 },
            'Laterite':   { ph: 6.0, n: 46.8, p: 44.3, k: 66.7 },
            'Rocky':      { ph: 7.1, n: 16.5, p: 20.1, k: 16.7 },
            'Red loam':   { ph: 6.4, n: 43.6, p: 39.9, k: 60.0 }
        };
        function autoFillSoilChemistry() {
            const soilEl = document.getElementById('soilSelect');
            const soilKey = soilEl && soilEl.value;
            const t = SOIL_TYPICAL_NPK[soilKey];
            if (!t) return;
            const phI = document.getElementById('phInput'), nI = document.getElementById('nInput'),
                  pI = document.getElementById('pInput'), kI = document.getElementById('kInput');
            if (phI && !phI.dataset.userEdited) phI.value = t.ph;
            if (nI && !nI.dataset.userEdited) nI.value = t.n;
            if (pI && !pI.dataset.userEdited) pI.value = t.p;
            if (kI && !kI.dataset.userEdited) kI.value = t.k;
        }
        (function initSoilAutoFill() {
            const soilEl = document.getElementById('soilSelect');
            if (!soilEl) return;
            soilEl.addEventListener('change', autoFillSoilChemistry);
            autoFillSoilChemistry();
            ['phInput', 'nInput', 'pInput', 'kInput'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('input', () => { el.dataset.userEdited = '1'; });
            });
            const toggle = document.getElementById('soilAutoToggle');
            if (toggle) toggle.addEventListener('click', () => {
                const shown = toggle.dataset.shown === '1';
                ['phInput', 'nInput', 'pInput', 'kInput'].forEach(id => {
                    const wrap = document.getElementById(id) && document.getElementById(id).closest('.input-group');
                    if (wrap) wrap.classList.toggle('is-visible', !shown);
                });
                toggle.dataset.shown = shown ? '0' : '1';
                toggle.textContent = shown ? 'Show / edit these values' : 'Hide these values';
            });
        })();

        async function updateSoilPreview() {
            if (!soilSelect) return;
            const soilKey = soilSelect.value;
            const previewImg = document.getElementById('soilPreviewImg');
            const previewName = document.getElementById('soilPreviewName');
            const previewDesc = document.getElementById('soilPreviewDesc');
            if (!previewImg) return;

            if (!soilKey || !SOIL_INFO[soilKey]) {
                previewName.textContent = 'No soil selected';
                previewDesc.textContent = '';
                previewImg.removeAttribute('src');
                return;
            }

            const info = SOIL_INFO[soilKey];
            previewName.textContent = info.label;
            previewDesc.textContent = '';
            previewImg.src = info.image;
            previewImg.alt = `${info.label} — real soil photograph`;
            previewImg.title = info.source;
        }

        // Use the commercial-only list everywhere in the catalog/comparison.

        // ===== TOP 5 PICKS PER SOIL TYPE =====
        const soilTypeList = [
            { key: 'Loamy', label: '🧱 Loamy Soil' },
            { key: 'Laterite', label: '🧡 Laterite Soil' },
            { key: 'Alluvial', label: '🟤 Alluvial Soil' },
            { key: 'Red loam', label: '🔴 Red loam Soil' },
            { key: 'Rocky', label: '🪨 Rocky Soil' },
            { key: 'Sandy loam', label: '🏖️ Sandy loam Soil' }
        ];

        function getTopSpeciesForSoil(soilType, n = 5) {
            return commercialSpecies
                .filter(s => (s.soil || []).some(v => String(v).toLowerCase() === String(soilType).toLowerCase() || (soilType==='Sandy loam' && String(v).toLowerCase()==='sandy')))
                .sort((a, b) => parseInt(b.value.replace(/[^0-9]/g, '')) - parseInt(a.value.replace(/[^0-9]/g, '')))
                .slice(0, n);
        }

        function miniSpeciesCardHTML(s, rank) {
            return `
                <div class="mini-species-card">
                    <img data-tree-name="${s.name}" alt="${s.name}" loading="lazy">
                    <div class="name">${s.icon} #${rank} ${s.name}</div>
                    <div class="meta">${s.value}</div>
                    <div class="meta">ROI: ${s.roi}</div>
                </div>`;
        }

        function renderTopPicksBySoil(containerId) {
            const el = document.getElementById(containerId);
            if (!el) return;
            el.innerHTML = soilTypeList.map(st => {
                const top5 = getTopSpeciesForSoil(st.key, 5);
                if (top5.length === 0) return '';
                const soilInfo = SOIL_INFO[st.key];
                return `
                    <div class="soil-top-block">
                        <div class="soil-top-heading">
                            <img class="soil-type-photo" src="${soilInfo.image}" alt="${soilInfo.label} real soil photograph" loading="lazy">
                            <div><h4>${st.label} — Top 5 Picks</h4><p>${soilInfo.desc}</p></div>
                        </div>
                        <div class="soil-top-grid">
                            ${top5.map((s, i) => miniSpeciesCardHTML(s, i + 1)).join('')}
                        </div>
                    </div>`;
            }).join('');
            hydrateSpeciesImages(el);
        }
        function updateHomeRecommendation() {
            const card = document.getElementById('myRecommendationCard');
            if (!card) return;
            const loggedIn = !!getAuthToken();
            if (!loggedIn) {
                card.style.display = 'none';
                return;
            }
            const userRaw = localStorage.getItem('registeredUser');
            const user = userRaw ? JSON.parse(userRaw) : null;
            let lastAnalysis = null;
            try { lastAnalysis = uGet('lastAnalysis'); } catch (e) {}

            card.style.display = 'block';
            const introEl = document.getElementById('recoIntroText');
            if (introEl) {
                introEl.textContent = lastAnalysis
                    ? `Welcome back${user ? ', ' + user.name : ''}! Based on your ${lastAnalysis.soil} soil in the ${REGION_LABELS[lastAnalysis.region] || lastAnalysis.region} region, here are your top picks:`
                    : `Welcome back${user ? ', ' + user.name : ''}! Analyze your soil on the Location page to personalize this further. Meanwhile, here are our default top picks:`;
            }

            const recNames = (lastAnalysis && lastAnalysis.recommendations && lastAnalysis.recommendations.length)
                ? lastAnalysis.recommendations
                : commercialSpecies.slice(0,4).map(s => s.name);
            const recSpecies = recNames.map(n => commercialSpecies.find(s => s.name === n)).filter(Boolean);

            const grid = document.getElementById('recoSpeciesGrid');
            if (grid) {
                grid.innerHTML = recSpecies.map(s => `
                    <div class="species-card">
                        <div class="species-image-wrap"><img class="species-image" data-tree-name="${s.name}" alt="${s.name}" loading="lazy"></div>
                        <div class="species-icon">${s.icon}</div><h3>${s.name}</h3>
                        <div class="species-details">
                            <p><i class="fas fa-clock"></i> Maturity: ${s.maturity} years</p>
                            <p><i class="fas fa-coins"></i> Value: ${s.value}</p>
                            <p style="margin-top:0.5rem;font-size:0.8rem;color:#2a5a3f;"><i class="fas fa-info-circle"></i> ${s.description}</p>
                        </div>
                        <button class="btn btn-outline btn-sm" onclick="viewSpeciesDetails('${s.name.replace("'", "\\'")}')"><i class="fas fa-book-open"></i> Full species guide</button>
                    </div>`).join('');
                hydrateSpeciesImages(grid);
            }

            const topName = recSpecies[0] ? recSpecies[0].name : 'Teak';
            const careText = document.getElementById('recoCareText');
            const plantText = document.getElementById('recoPlantingText');
            const layoutText = document.getElementById('recoLayoutText');
            if (careText) careText.textContent = `Irrigation, pruning & pest-control tips tailored for ${topName}.`;
            if (plantText) plantText.textContent = `Step-by-step planting instructions for ${topName} saplings.`;
            if (layoutText) layoutText.textContent = `View your calculated plantation grid sized for ${topName}.`;
        }

        // ===== RENDER SPECIES CATALOG =====
        function renderSpeciesCatalog(filter = 'all', sort = 'name', search = '') {
            const grid = document.getElementById('speciesGrid');
            if (!grid) return;

            let filtered = [...commercialSpecies];

            if (filter !== 'all') {
                filtered = filtered.filter(s => Array.isArray(s.region) && s.region.includes(filter));
            }

            if (search.trim()) {
                const term = search.toLowerCase().trim();
                filtered = filtered.filter(s => 
                    s.name.toLowerCase().includes(term) ||
                    s.description.toLowerCase().includes(term) ||
                    s.uses.toLowerCase().includes(term)
                );
            }

            if (sort === 'name') {
                filtered.sort((a, b) => a.name.localeCompare(b.name));
            } else if (sort === 'value') {
                filtered.sort((a, b) => {
                    const valA = parseInt(a.value.replace(/[^0-9]/g, ''));
                    const valB = parseInt(b.value.replace(/[^0-9]/g, ''));
                    return valB - valA;
                });
            } else if (sort === 'maturity') {
                filtered.sort((a, b) => a.maturity - b.maturity);
            }

            if (filtered.length === 0) {
                grid.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-search"></i>
                        <h3>No species found</h3>
                        <p>Try adjusting your filters or search terms.</p>
                    </div>
                `;
                return;
            }

            grid.innerHTML = filtered.map(species => `
                <div class="species-card">
                    <div class="species-image-wrap"><img class="species-image" data-tree-name="${species.name}" alt="${species.name}" loading="lazy"></div>
                    <div class="species-icon">${species.icon}</div><h3>${species.name}</h3>
                    <div class="species-tags">
                        ${species.region.map(r => `<span>${r}</span>`).join('')}
                        ${species.soil.map(s => `<span>${s}</span>`).join('')}
                    </div>
                    <div class="species-details">
                        <p><i class="fas fa-clock"></i> Maturity: ${species.maturity} years</p>
                        <p><i class="fas fa-coins"></i> Value: ${species.value}</p>
                        <p><i class="fas fa-tint"></i> Water: ${species.waterNeed}</p>
                        <p><i class="fas fa-chart-line"></i> ROI: ${species.roi}</p>
                        <p style="margin-top: 0.5rem; font-size: 0.8rem; color: #2a5a3f;">
                            <i class="fas fa-info-circle"></i> ${species.description}
                        </p>
                        <p style="font-size: 0.8rem; color: #3f6b52;">
                            <i class="fas fa-box"></i> Uses: ${species.uses}
                        </p>
                    </div>
                    <div class="species-card-actions">
                        <button class="btn btn-primary btn-sm" onclick="selectSpecies('${species.name.replace("'", "\\'")}')">
                            <i class="fas fa-plus"></i> Select
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="viewSpeciesDetails('${species.name.replace("'", "\\'")}')">
                            <i class="fas fa-book-open"></i> View details
                        </button>
                    </div>
                </div>
            `).join('');
            hydrateSpeciesImages(grid);
        }

        // ===== COMPLETE SPECIES GUIDE =====
        function escHtml(value){
            return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
        }
        function rangeText(arr, unit=''){ return Array.isArray(arr)&&arr.length===2 ? `${arr[0]}–${arr[1]}${unit}` : 'Not available'; }
        function ensureSpeciesModal(){
            let modal=document.getElementById('speciesDetailModal');
            if(modal) return modal;
            modal=document.createElement('div'); modal.id='speciesDetailModal'; modal.className='species-detail-modal';
            modal.innerHTML=`<div class="species-detail-backdrop" onclick="closeSpeciesDetails()"></div><div class="species-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="speciesDetailTitle"><button class="species-detail-close" onclick="closeSpeciesDetails()" aria-label="Close"><i class="fas fa-times"></i></button><div id="speciesDetailContent"></div></div>`;
            document.body.appendChild(modal);
            return modal;
        }
        function detailList(title, icon, items){
            const list=Array.isArray(items)?items.filter(Boolean):[];
            if(!list.length) return '';
            return `<section class="species-detail-section"><h4><i class="fas ${icon}"></i> ${title}</h4><ul>${list.map(x=>`<li>${escHtml(x)}</li>`).join('')}</ul></section>`;
        }
        window.viewSpeciesDetails=async function(name){
            const modal=ensureSpeciesModal(), content=document.getElementById('speciesDetailContent');
            modal.classList.add('open'); document.body.classList.add('modal-open');
            content.innerHTML='<div class="species-detail-loading"><i class="fas fa-spinner fa-spin"></i> Loading species guide...</div>';
            let s=commercialSpecies.find(x=>x.name===name)||speciesData.find(x=>x.name===name)||{};
            try { const remote=await apiFetch('/api/species/'+encodeURIComponent(name)); s={...s,...remote,knowledge:remote.knowledge||s.knowledge||window.speciesKnowledge?.[name]||{}}; } catch(e) { s={...s,knowledge:s.knowledge||window.speciesKnowledge?.[name]||{}}; }
            const k=s.knowledge||{}; const mp=k.model_suitability||s.modelProfile||{}; const cp=k.commercial_profile||s.commercialProfile||{};
            const image=`<div class="species-detail-hero-image"><img data-tree-name="${escHtml(name)}" alt="Real photograph of ${escHtml(name)}" loading="lazy"></div>`;
            const support=k.supporting_tree ? `<div class="species-support-box"><strong><i class="fas fa-tree"></i> Support / host:</strong> ${escHtml(k.supporting_tree)}<br><span>${escHtml(k.supporting_tree_rule||'Use only where agronomically appropriate.')}</span></div>` : '';
            const model=`<section class="species-detail-section"><h4><i class="fas fa-sliders-h"></i> AranyaAI suitability profile</h4><div class="species-facts"><div><b>Soil</b><span>${(mp.soil_types||s.soil_types||[]).map(escHtml).join(', ')||'Not available'}</span></div><div><b>pH</b><span>${rangeText(mp.pH_range||s.soil_ph_range)}</span></div><div><b>Rainfall</b><span>${rangeText(mp.rainfall_mm_range||s.rainfall_mm_range,' mm/year')}</span></div><div><b>Temperature</b><span>${rangeText(mp.temperature_c_range||s.temperature_c_range,' °C')}</span></div><div><b>Regions in dataset</b><span>${(mp.regions||s.regions||[]).map(escHtml).join(', ')||'Not available'}</span></div><div><b>Growth category</b><span>${escHtml(cp.category||s.category||'')}</span></div></div><p class="species-data-note">These ranges describe the values represented in the AranyaAI training/catalog data. They are not a substitute for a local soil test or agricultural/forestry recommendation.</p></section>`;
            const money=(a)=>Array.isArray(a)&&a.length===2?`₹${Number(a[0]).toLocaleString('en-IN')}–₹${Number(a[1]).toLocaleString('en-IN')}/acre`: 'Not available';
            const commercial=`<section class="species-detail-section"><h4><i class="fas fa-store"></i> Commercial profile</h4><div class="species-facts"><div><b>Duration</b><span>${escHtml(s.duration_months||cp.duration_months||'')} months</span></div><div><b>Investment in dataset</b><span>${money(cp.investment_per_acre_inr_range||s.investment_per_acre_inr_range)}</span></div><div><b>Profit in dataset</b><span>${money(cp.profit_per_acre_inr_range||s.profit_per_acre_inr_range)}</span></div><div><b>Main uses</b><span>${escHtml(s.uses||'See uses below')}</span></div></div><p class="species-data-note">Investment/profit figures are dataset fields and should not be treated as a guaranteed market return.</p></section>`;
            content.innerHTML=`<div class="species-detail-header"><div>${image}</div><div><div class="species-detail-kicker">🌿 AranyaAI species guide</div><h2 id="speciesDetailTitle">${escHtml(name)}</h2><p>${escHtml(s.description||'Commercial plantation profile')}</p>${support}</div></div><div class="species-detail-body">${model}${commercial}${detailList('Benefits','fa-leaf',k.benefits)}${detailList('Commercial uses','fa-store',k.uses ? [k.uses] : [])}${detailList('Growth & maturity','fa-hourglass-half',k.growth_maturity ? [k.growth_maturity] : [])}${detailList('Planting steps','fa-seedling',k.planting_steps)}${detailList('Pit / bed preparation','fa-tools',k.pit_preparation)}${detailList('Spacing','fa-ruler-combined',k.spacing ? [k.spacing] : [])}${detailList('Irrigation & water management','fa-tint',k.irrigation)}${detailList('Fertilizer & nutrition','fa-flask',k.fertilizer)}${detailList('Weed management','fa-leaf',k.weed_management)}${detailList('Pests & disease management','fa-bug',k.pest_management)}${detailList('Maintenance & pruning','fa-cut',k.maintenance)}${detailList('Harvest','fa-shopping-basket',k.harvest ? [k.harvest] : [])}${detailList('Intercrops','fa-layer-group',k.intercrops)}${detailList('Precautions','fa-exclamation-triangle',k.precautions ? [k.precautions] : [])}</div>`;
            hydrateSpeciesImages(content);
        };
        window.closeSpeciesDetails=function(){ const modal=document.getElementById('speciesDetailModal'); if(modal) modal.classList.remove('open'); document.body.classList.remove('modal-open'); };
        document.addEventListener('keydown',e=>{if(e.key==='Escape') closeSpeciesDetails();});

        // ===== SELECT SPECIES =====
        window.selectSpecies = function(name) {
            alert(`✅ ${name} selected! You can now view recommendations for this species.`);
            navigateToWorkspace('wb-location');
            const result = document.getElementById('soilResult');
            if (result) {
                const species = commercialSpecies.find(s => s.name === name) || speciesData.find(s => s.name === name);
                if (species) {
                    result.innerHTML = `🌱 Selected: ${name} — ${species.description}`;
                }
            }
        };

        // ===== RENDER COMPARISON TABLE =====
        function renderComparison() {
            const tbody = document.getElementById('comparisonBody');
            if (!tbody) return;
            
            tbody.innerHTML = commercialSpecies.map(s => `
                <tr>
                    <td><strong>${s.icon} ${s.name}</strong></td>
                    <td>${s.maturity}</td>
                    <td>${s.value}</td>
                    <td>${s.waterNeed}</td>
                    <td><span style="color: ${s.roi === 'Very High' ? '#1f6e47' : s.roi === 'High' ? '#2b7a4e' : '#3f6b52'}">${s.roi}</span></td>
                </tr>
            `).join('');
        }

        // ===== RECOMMENDATION-GATED CONTENT =====
        // Feature pages remain empty until the Location page produces a recommendation.
        const RECOMMENDATION_PAGES = [
            'wb-recommendation', 'wb-care',
            'wb-report', 'wb-compare', 'wb-impact'
        ];

        function hasRecommendation() {
            try {
                const data = uGet('lastAnalysis');
                return !!(data && Array.isArray(data.recommendations) && data.recommendations.length);
            } catch (e) {
                return false;
            }
        }

        function updateRecommendationAccess() {
            const unlocked = hasRecommendation();
            RECOMMENDATION_PAGES.forEach(id => {
                const page = document.getElementById(id);
                if (page) page.classList.toggle('recommendation-unlocked', unlocked);
            });
        }

        // ===== FILE-BASED NAVIGATION =====
        const GATED_PAGES = ['page-catalog','page-workspace'];
        const PAGE_FILES = {
            'page-home': 'index.html',
            'page-register': 'register.html',
            'page-login': 'login.html',
            'page-catalog': 'catalog.html',
            'page-workspace': 'dashboard.html'
        };

        window.navigateTo = function(pageId) {
            const target = PAGE_FILES[pageId] || pageId;
            if (target) window.location.href = target;
        };

        window.navigateToWorkspace = function(blockId) {
            if (!getAuthToken()) {
                window.location.href = 'login.html';
                return;
            }
            window.location.href = 'dashboard.html#' + encodeURIComponent(blockId || 'wb-dashboard');
        };

        const navBtns = document.querySelectorAll('.nav-tabs button');
        function showPage(pageId) {
            const target = PAGE_FILES[pageId] || pageId;
            if (target) window.location.href = target;
        }

        navBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const pageId = this.dataset.page;
                if (pageId) showPage(pageId);
            });
        });

        // ===== CATALOG FILTERS =====
        const catalogFilter = document.getElementById('catalogFilter');
        const catalogSort = document.getElementById('catalogSort');
        const catalogSearch = document.getElementById('catalogSearch');

        function updateCatalog() {
            renderSpeciesCatalog(
                catalogFilter ? catalogFilter.value : 'all',
                catalogSort ? catalogSort.value : 'name',
                catalogSearch ? catalogSearch.value : ''
            );
        }

        if (catalogFilter) catalogFilter.addEventListener('change', updateCatalog);
        if (catalogSort) catalogSort.addEventListener('change', updateCatalog);
        if (catalogSearch) catalogSearch.addEventListener('input', updateCatalog);

        
        // Icons shown on the species picker (tap to select / unselect — no dragging or Ctrl-click needed).
        const SPECIES_ICONS={Agarwood:'🪵',Amla:'🍏',Arecanut:'🌴',Bamboo:'🎋',Banana:'🍌',Brinjal:'🍆',Cashew:'🥜',Chilli:'🌶️',Coconut:'🥥',Eucalyptus:'🌿',Ginger:'🫚',Guava:'🍐',Jackfruit:'🍈','Leafy Greens':'🥬',Mahogany:'🪑',Mango:'🥭',Marigold:'🌼',Moringa:'🌱',Neem:'🍃',Okra:'🫛',Papaya:'🧡',Pineapple:'🍍','Red Sanders':'🔴',Rosewood:'🌹',Sandalwood:'🪷','Silver Oak':'🌲',Sugarcane:'🎍',Teak:'🌳',Tomato:'🍅',Turmeric:'🟡',Watermelon:'🍉'};
        function speciesIconFor(x){ return SPECIES_ICONS[x.name]||x.icon||'🌳'; }
        function aiRecommendedNames(){ const a=uGet('lastAnalysis'); return (a&&Array.isArray(a.recommendations))?a.recommendations.slice():[]; }
        function plotDims(){ return { L:parseFloat(document.getElementById('landLength')?.value)||0, W:parseFloat(document.getElementById('landWidth')?.value)||0 }; }
        function speciesLimit(){ const d=plotDims(); return (d.L>0&&d.W>0)?AU.maxSpeciesForSqft(d.L*d.W):null; }
        // Species the AI recommended that are locked into the layout (limited by what the plot can hold).
        function lockedAINames(){
            const sel=document.getElementById('calcSpecies'); if(!sel) return [];
            const have=new Set(Array.from(sel.options).map(o=>o.value));
            const rec=aiRecommendedNames().filter(n=>have.has(n)); const lim=speciesLimit();
            return lim?rec.slice(0,lim):rec;
        }
        // Selection = AI-recommended species + the commercial species the user picked, never more than the plot allows.
        function syncAIRecommendedSelection(){
            const sel=document.getElementById('calcSpecies'); if(!sel) return;
            const ai=lockedAINames(), lim=speciesLimit();
            const chosen=new Set(Array.from(sel.selectedOptions).map(o=>o.value)); ai.forEach(n=>chosen.add(n));
            let dropped=[];
            if(lim && chosen.size>lim){
                const manual=Array.from(chosen).filter(n=>!ai.includes(n));
                while(chosen.size>lim && manual.length){ const d=manual.pop(); chosen.delete(d); dropped.push(d); }
            }
            Array.from(sel.options).forEach(o=>{ o.selected=chosen.has(o.value); });
            if(dropped.length) aranyaToast(`Your plot allows at most ${lim} species, so ${dropped.join(', ')} ${dropped.length>1?'were':'was'} removed.`,true);
        }
        function updatePlotLimitNote(){
            const el=document.getElementById('plotLimitNote'); if(!el) return;
            const d=plotDims(), lim=speciesLimit(), n=selectedCalcSpecies().length;
            if(!lim){ el.textContent='Enter your land length and width (in feet) to see how many species your plot can hold.'; el.classList.remove('warn'); return; }
            el.textContent=`📐 Your plot is ${AU.fmtNum(d.L)} × ${AU.fmtNum(d.W)} ft (${AU.fmtNum(d.L*d.W)} sq ft): you can plant up to ${lim} commercial species. Selected: ${n} of ${lim}.`;
            el.classList.toggle('warn',n>lim);
        }
        function renderSpeciesPicker(){
            const sel=document.getElementById('calcSpecies'), box=document.getElementById('calcSpeciesPicker'); if(!sel||!box) return;
            const lim=speciesLimit(), ai=new Set(lockedAINames()), count=Array.from(sel.selectedOptions).length;
            box.innerHTML=Array.from(sel.options).map(o=>{
                const isAI=ai.has(o.value), full=lim&&count>=lim&&!o.selected;
                return `<button type="button" class="species-chip${o.selected?' selected':''}${isAI?' ai-rec':''}${full?' disabled-limit':''}" data-species="${escHtml(o.value)}" aria-pressed="${o.selected?'true':'false'}">${escHtml(o.value)}${isAI?'<span class="ai-star">★ AI</span>':''}</button>`;
            }).join('');
            const st=document.getElementById('calcSpeciesStatus');
            if(st) st.textContent=count?`${count} species selected: ${Array.from(sel.selectedOptions).map(o=>o.value).join(', ')}`:'No species selected yet — tap the names above to choose';
            updatePlotLimitNote();
        }
        document.getElementById('calcSpeciesPicker')?.addEventListener('click',e=>{
            const b=e.target.closest('.species-chip'); if(!b) return;
            const sel=document.getElementById('calcSpecies'); if(!sel) return;
            const opt=Array.from(sel.options).find(o=>o.value===b.dataset.species); if(!opt) return;
            if(lockedAINames().includes(opt.value)){ aranyaToast(`${opt.value} was recommended by the AI for your soil, so it stays in your layout. Run "Analyze Soil & Recommend" again to change the AI picks.`); return; }
            const lim=speciesLimit();
            if(!opt.selected && lim && selectedCalcSpecies().length>=lim){ const d=plotDims(); aranyaToast(`A ${AU.fmtNum(d.L)} × ${AU.fmtNum(d.W)} ft plot (${AU.fmtNum(d.L*d.W)} sq ft) allows at most ${lim} species. Unselect one first, or use a bigger plot.`,true); return; }
            opt.selected=!opt.selected;
            b.classList.toggle('selected',opt.selected); b.setAttribute('aria-pressed',String(opt.selected));
            sel.dispatchEvent(new Event('change',{bubbles:true}));
        });
        document.getElementById('calcSpecies')?.addEventListener('change',renderSpeciesPicker);
        function populateCalcSpecies(){
            const sel=document.getElementById('calcSpecies'); if(!sel) return;
            const keep=new Set(Array.from(sel.selectedOptions).map(o=>o.value));
            if(commercialSpecies.length && window.__pendingRestoreSpecies){ window.__pendingRestoreSpecies.forEach(n=>keep.add(n)); window.__pendingRestoreSpecies=null; }
            const space=document.getElementById('plantingSpaceInput')?.value||'';
            const list=space ? commercialSpecies.filter(x=>!Array.isArray(x.spaceSuitability)||!x.spaceSuitability.length||x.spaceSuitability.includes(space)) : commercialSpecies;
            sel.innerHTML=list.map(x=>`<option value="${x.name}">${x.name}</option>`).join('');
            if(keep.size) Array.from(sel.options).forEach(o=>{ o.selected=keep.has(o.value); });
            syncAIRecommendedSelection();
            renderSpeciesPicker();
            const hidden=commercialSpecies.length-list.length;
            const hint=sel.closest('.input-group')?.querySelector('.field-hint');
            if(hint) hint.dataset.baseText=hint.dataset.baseText||hint.textContent;
            if(hint) hint.textContent=(hint.dataset.baseText||'')+(hidden?` (${hidden} species hidden — not suited to this space)`:'');
        }
        document.getElementById('plantingSpaceInput')?.addEventListener('change', populateCalcSpecies);
        // ===== RECOMMENDED SPACING (feet) =====
        function mainSpeciesOf(names){
            const ordered=window.AranyaLayout?window.AranyaLayout.orderSpecies(names,speciesInfoFor):names;
            return ordered[0];
        }
        function updateSpacingAdvice(force){
            const names=selectedCalcSpecies(), box=document.getElementById('spacingAdvice');
            const tsEl=document.getElementById('treeSpacing'), rsEl=document.getElementById('rowSpacing');
            const tsHint=document.getElementById('treeSpacingHint'), rsHint=document.getElementById('rowSpacingHint');
            if(!tsEl||!rsEl) return;
            if(!names.length){
                if(box) box.innerHTML='';
                if(tsHint) tsHint.textContent='Pick your trees below — the best spacing is filled in for you.';
                if(rsHint) rsHint.textContent='Pick your trees below — the best spacing is filled in for you.';
                return;
            }
            const main=mainSpeciesOf(names), g=AU.spacingFor(main);
            if(force){ delete tsEl.dataset.userSet; delete rsEl.dataset.userSet; }
            if(!tsEl.dataset.userSet) tsEl.value=g.tree;
            if(!rsEl.dataset.userSet) rsEl.value=g.row;
            const same=(tsEl.value==g.tree);
            const sameR=(rsEl.value==g.row);
            if(tsHint) tsHint.textContent=`Recommended for ${main}: ${AU.fmtFt(g.tree)}${same?'':' (you changed it)'}`;
            if(rsHint) rsHint.textContent=`Recommended for ${main}: ${AU.fmtFt(g.row)}${sameR?'':' (you changed it)'}`;
            if(box){
                const rows=names.map(n=>{ const s=AU.spacingFor(n); return `<div class="sa-row"><span><b>${escHtml(n)}</b>${n===main?'<em>main tree — sets the spacing above</em>':''}</span><span>tree-to-tree <b>${AU.fmtFt(s.tree)}</b> · row-to-row <b>${AU.fmtFt(s.row)}</b></span></div>`; }).join('');
                box.innerHTML=`<div class="sa-box"><div class="sa-head"><i class="fas fa-ruler-combined"></i> Recommended spacing for your selected trees</div>${rows}<div class="sa-actions"><button type="button" class="btn btn-primary" id="useRecSpacingBtn"><i class="fas fa-magic"></i> Use recommended spacing</button><span class="sa-note">The plantation uses the spacing of your tallest main tree. Shorter crops are grown between the rows at their own spacing shown above. You can still type your own numbers.</span></div></div>`;
                document.getElementById('useRecSpacingBtn')?.addEventListener('click',()=>{ updateSpacingAdvice(true); calculateTrees(true); saveFormState(); });
            }
        }
        document.getElementById('treeSpacing')?.addEventListener('input',function(){ this.dataset.userSet='1'; });
        document.getElementById('rowSpacing')?.addEventListener('input',function(){ this.dataset.userSet='1'; });

        // ===== SAVE / RESTORE MY INPUTS (per user) =====
        const FORM_IDS=['regionSelect','soilSelect','tempInput','rainInput','phInput','nInput','pInput','kInput','plantingSpaceInput','landLength','landWidth','treeSpacing','rowSpacing','boundaryGap'];
        function saveFormState(){
            if(!document.getElementById('landLength')||!getAuthToken()) return;
            const s={}; FORM_IDS.forEach(id=>{ const el=document.getElementById(id); if(el) s[id]=el.value; });
            s.species=selectedCalcSpecies();
            s.tsUser=!!document.getElementById('treeSpacing')?.dataset.userSet; s.rsUser=!!document.getElementById('rowSpacing')?.dataset.userSet;
            uSetRaw('formState',JSON.stringify(s));
        }
        function restoreFormState(){
            const s=uGet('formState'); if(!s||!document.getElementById('landLength')) return;
            FORM_IDS.forEach(id=>{ const el=document.getElementById(id); if(el&&s[id]!==undefined&&s[id]!==null) el.value=s[id]; });
            const typ=SOIL_TYPICAL_NPK[s.soilSelect];
            [['phInput','ph'],['nInput','n'],['pInput','p'],['kInput','k']].forEach(([id,k])=>{ const el=document.getElementById(id); if(el&&typ&&parseFloat(el.value)!==typ[k]) el.dataset.userEdited='1'; });
            if(s.tsUser) document.getElementById('treeSpacing').dataset.userSet='1';
            if(s.rsUser) document.getElementById('rowSpacing').dataset.userSet='1';
            window.__pendingRestoreSpecies=new Set(s.species||[]);
        }
        FORM_IDS.forEach(id=>{ const el=document.getElementById(id); if(el){ el.addEventListener('input',saveFormState); el.addEventListener('change',saveFormState); } });
        ['landLength','landWidth'].forEach(id=>document.getElementById(id)?.addEventListener('input',()=>{ syncAIRecommendedSelection(); renderSpeciesPicker(); }));
        ['landLength','landWidth','rowSpacing','boundaryGap'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>{ if(getAuthToken()&&selectedCalcSpecies().length) calculateTrees(true); }));
        async function loadBackendSpecies(){
            try{
                const list=await apiFetch('/api/species');
                if(Array.isArray(list)&&list.length){
                    commercialSpecies=list.map((x,i)=>{
                        const fallback=speciesData.find(s=>s.name===x.name)||{};
                        const k=x.knowledge||window.speciesKnowledge?.[x.name]||{}; return {...fallback,name:x.name,icon:fallback.icon||'🌳',maturity:Math.round((x.duration_months||fallback.maturity*12||12)/12),value:x.profit_per_acre_inr_range?.length?`₹ ${Math.round(x.profit_per_acre_inr_range[0]).toLocaleString('en-IN')}/acre`:(fallback.value||'See report'),waterNeed:fallback.waterNeed||'See species guidance',roi:fallback.roi||'Model data',description:fallback.description||`${x.name} commercial plantation profile`,uses:k.uses||fallback.uses||'Commercial uses',region:Array.isArray(fallback.region)&&fallback.region.length?fallback.region:['tropical','subtropical','arid'],soil:x.soil_types||fallback.soil||[],spaceSuitability:x.space_suitability||[],knowledge:k,modelProfile:{soil_types:x.soil_types,pH_range:x.soil_ph_range,rainfall_mm_range:x.rainfall_mm_range,temperature_c_range:x.temperature_c_range,N_range:x.N_range,P_range:x.P_range,K_range:x.K_range,regions:x.regions},commercialProfile:{category:x.category,duration_months:x.duration_months,investment_per_acre_inr_range:x.investment_per_acre_inr_range,profit_per_acre_inr_range:x.profit_per_acre_inr_range,data_source:x.data_sources}};
                    });
                    list.forEach(x=>{ if (x.image) CATALOG_IMAGE_OVERRIDES[x.name]=x.image; });
                    window.commercialSpecies = commercialSpecies; // read-only mirror for the Smart Plantation Layout module
                    populateCalcSpecies(); renderSpeciesCatalog(); renderComparison(); renderTopPicksBySoil('soilTopPicksDashboard'); refreshIntercropPlan(); updateSpacingAdvice(); updateDashboardStats(); if (getAuthToken() && selectedCalcSpecies().length) calculateTrees(true);
                    if (window.SmartPlantation) window.SmartPlantation.onCatalogReady();
                }
            }catch(e){ console.warn('Backend species catalog unavailable; using local catalog.',e.message); }
        }
        restoreFormState();
        populateCalcSpecies();
        loadBackendSpecies();


        // ===== BACKEND AUTHENTICATION =====
        const regEmail = document.getElementById('regEmail');
        const regEmailError = document.getElementById('regEmailError');
        function validateEmail(email){ return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email); }
        function setFieldError(el, message){ if(!el)return; el.textContent=message||''; el.classList.toggle('has-error',!!message); }
        if(regEmail) regEmail.addEventListener('input', function(){
            const email=this.value.trim();
            if(!email){setFieldError(regEmailError,'');this.classList.remove('input-invalid');return;}
            if(!validateEmail(email)){setFieldError(regEmailError,'Please enter a valid email (e.g., name@domain.com)');this.classList.add('input-invalid');}
            else {setFieldError(regEmailError,'');this.classList.remove('input-invalid');}
        });

        document.querySelectorAll('.toggle-password').forEach(btn=>btn.addEventListener('click',function(){
            const input=document.getElementById(this.dataset.target); if(!input)return;
            const showing=input.type==='text'; input.type=showing?'password':'text';
            this.innerHTML=showing?'<i class="fas fa-eye"></i>':'<i class="fas fa-eye-slash"></i>';
        }));

        // ===== PASSWORD RULES: 8+ chars, uppercase, lowercase, special character =====
        const PW_RULES = {
            length:  pw => pw.length >= 8,
            upper:   pw => /[A-Z]/.test(pw),
            lower:   pw => /[a-z]/.test(pw),
            special: pw => /[^A-Za-z0-9\s]/.test(pw)
        };
        function passwordProblems(pw){
            const msgs = {length:'at least 8 characters', upper:'one uppercase letter', lower:'one lowercase letter', special:'one special character'};
            return Object.keys(PW_RULES).filter(k => !PW_RULES[k](pw)).map(k => msgs[k]);
        }
        function updatePasswordChecklist(pw){
            document.querySelectorAll('#pwRules li').forEach(li => {
                const ok = PW_RULES[li.dataset.rule](pw);
                li.classList.toggle('ok', ok);
                const ic = li.querySelector('i'); if (ic) ic.className = ok ? 'fas fa-check-circle' : 'fas fa-circle';
            });
        }
        const regPasswordInput = document.getElementById('regPassword');
        if (regPasswordInput) regPasswordInput.addEventListener('input', function(){ updatePasswordChecklist(this.value); setFieldError(document.getElementById('regPasswordError'),''); this.classList.remove('input-invalid'); });

        const registerForm=document.getElementById('registerForm');
        if(registerForm) registerForm.addEventListener('submit', async function(e){
            e.preventDefault();
            const name=document.getElementById('regName').value.trim();
            const email=document.getElementById('regEmail').value.trim();
            const role='user';
            const password=document.getElementById('regPassword').value;
            const confirmPassword=document.getElementById('regConfirmPassword').value;
            const purpose=document.getElementById('regPurpose').value;
            ['regNameError','regEmailError','regPasswordError','regConfirmError','regPurposeError'].forEach(id=>setFieldError(document.getElementById(id),''));
            const show=(id,msg)=>{setFieldError(document.getElementById(id+'Error'),msg);document.getElementById(id)?.classList.add('input-invalid');};
            let bad=false;
            if(name.length<2){show('regName','Enter your full name.');bad=true;}
            if(!validateEmail(email)){show('regEmail','Please enter a valid email.');bad=true;}
                        {const probs=passwordProblems(password); if(probs.length){show('regPassword','Password needs '+probs.join(', ')+'.');bad=true;}}
            if(password!==confirmPassword){show('regConfirmPassword','Passwords do not match.');bad=true;}
            if(!purpose){show('regPurpose','Please select your purpose.');bad=true;}
            if(bad)return;
            try{
                const data=await apiFetch('/api/register',{method:'POST',body:JSON.stringify({name,email,password,purpose,role})});
                localStorage.setItem('aranyaAccessToken',data.access_token);
                localStorage.setItem('registeredUser',JSON.stringify(data.user));
                localStorage.setItem('isLoggedIn','true');
                alert('Registration successful! Welcome '+name+'.');
                window.location.href='dashboard.html';
            }catch(err){
                if(/already exists/i.test(err.message)){show('regEmail','This email is already registered. Please login instead.');}
                else alert('Registration failed: '+err.message+'\n\nMake sure the AranyaAI backend is running.');
            }
        });

        const loginForm=document.getElementById('loginForm');
        if(loginForm) loginForm.addEventListener('submit', async function(e){
            e.preventDefault();
            const email=document.getElementById('loginEmail').value.trim();
            const password=document.getElementById('loginPassword').value;
            setFieldError(document.getElementById('loginEmailError'),''); setFieldError(document.getElementById('loginPasswordError'),'');
            if(!validateEmail(email)){setFieldError(document.getElementById('loginEmailError'),'Please enter a valid email address');return;}
            try{
                const data=await apiFetch('/api/login',{method:'POST',body:JSON.stringify({email,password})});
                localStorage.setItem('aranyaAccessToken',data.access_token);
                localStorage.setItem('registeredUser',JSON.stringify(data.user));
                localStorage.setItem('isLoggedIn','true');
                setLoggedInUI(true);
                window.location.replace(data.user.role==='admin' ? 'admin.html' : 'dashboard.html');
            }catch(err){
                setFieldError(document.getElementById('loginPasswordError'),err.message.includes('Invalid')?'Incorrect email or password.':err.message);
            }
        });


        // ===== FORGOT PASSWORD =====
        (function initForgotPassword(){
            const link=document.getElementById('forgotLink'); if(!link) return;
            const loginCard=document.querySelector('#page-login > .auth-card');
            const card=document.getElementById('forgotCard');
            const form=document.getElementById('forgotForm');
            const emailEl=document.getElementById('forgotEmail');
            const step=document.getElementById('resetStep');
            const msg=document.getElementById('forgotMessage');
            const btn=document.getElementById('forgotSubmit');
            const help=document.getElementById('forgotHelp');
            let codeSent=false;
            function reset(){ codeSent=false; step.style.display='none'; emailEl.readOnly=false; btn.innerHTML='<i class="fas fa-paper-plane"></i> Send reset code'; help.textContent='Enter your registered email and we will send you a 6-digit reset code.'; setFieldError(msg,''); msg.classList.remove('ok'); ['forgotEmailError','resetCodeError','resetPasswordError'].forEach(i=>setFieldError(document.getElementById(i),'')); }
            link.addEventListener('click',e=>{ e.preventDefault(); reset(); emailEl.value=(document.getElementById('loginEmail')||{}).value||''; loginCard.style.display='none'; card.style.display=''; emailEl.focus(); });
            document.getElementById('backToLogin').addEventListener('click',e=>{ e.preventDefault(); card.style.display='none'; loginCard.style.display=''; });
            form.addEventListener('submit', async function(e){
                e.preventDefault();
                const email=emailEl.value.trim();
                setFieldError(msg,''); msg.classList.remove('ok');
                if(!validateEmail(email)){ setFieldError(document.getElementById('forgotEmailError'),'Please enter a valid email address'); return; }
                setFieldError(document.getElementById('forgotEmailError'),'');
                btn.disabled=true;
                try{
                    if(!codeSent){
                        const r=await apiFetch('/api/forgot-password',{method:'POST',body:JSON.stringify({email})});
                        codeSent=true; step.style.display=''; emailEl.readOnly=true;
                        btn.innerHTML='<i class="fas fa-check"></i> Reset password';
                        help.textContent='Enter the 6-digit code and choose a new password.';
                        setFieldError(msg,r.message);
                        if(r.email_configured===false){ msg.classList.remove('ok'); help.textContent='No email can be delivered yet (email is not set up on the server). Ask the administrator for the code, or set up email — see .env.example.'; }
                        else { msg.classList.add('ok'); }
                    } else {
                        const code=document.getElementById('resetCode').value.trim();
                        const pw=document.getElementById('resetNewPassword').value;
                        setFieldError(document.getElementById('resetCodeError'),''); setFieldError(document.getElementById('resetPasswordError'),'');
                        if(!/^\d{6}$/.test(code)){ setFieldError(document.getElementById('resetCodeError'),'Enter the 6-digit code'); return; }
                        const problems=[]; if(pw.length<8)problems.push('at least 8 characters'); if(!/[A-Z]/.test(pw))problems.push('one uppercase letter'); if(!/[a-z]/.test(pw))problems.push('one lowercase letter'); if(!/[^A-Za-z0-9\s]/.test(pw))problems.push('one special character');
                        if(problems.length){ setFieldError(document.getElementById('resetPasswordError'),'Password needs '+problems.join(', ')); return; }
                        const r=await apiFetch('/api/reset-password',{method:'POST',body:JSON.stringify({email,code,new_password:pw})});
                        card.style.display='none'; loginCard.style.display='';
                        document.getElementById('loginEmail').value=email; document.getElementById('loginPassword').value='';
                        setFieldError(document.getElementById('loginPasswordError'),r.message); document.getElementById('loginPasswordError').classList.add('ok');
                    }
                }catch(err){ setFieldError(msg,err.message+(err.message.startsWith('Request failed')||err.message==='Failed to fetch'?' — make sure the AranyaAI backend is running.':'')); }
                finally{ btn.disabled=false; }
            });
        })();
        // ===== LOGGED-IN UI STATE =====
        function setLoggedInUI(loggedIn) {
            const currentFile = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
            const isAuthPage = currentFile === 'register.html' || currentFile === 'login.html';
            const loginBtn = document.querySelector('.nav-tabs button[data-page="page-login"]');
            const registerBtn = document.querySelector('.nav-tabs button[data-page="page-register"]');
            const logoutBtn = document.getElementById('logoutBtn');
            const catalogBtn = document.querySelector('.nav-tabs button[data-page="page-catalog"]');
            const dashboardBtn = document.querySelector('.nav-tabs button[data-page="page-workspace"]');

            // Species and Dashboard are protected. They must never appear on the
            // registration/login screens, even if an old localStorage flag exists.
            const showProtectedNav = loggedIn && !isAuthPage;
            if (loginBtn) loginBtn.style.display = loggedIn && !isAuthPage ? 'none' : '';
            if (registerBtn) registerBtn.style.display = loggedIn && !isAuthPage ? 'none' : '';
            if (logoutBtn) logoutBtn.style.display = loggedIn && !isAuthPage ? '' : 'none';
            if (catalogBtn) catalogBtn.style.display = showProtectedNav ? '' : 'none';
            if (dashboardBtn) dashboardBtn.style.display = showProtectedNav ? '' : 'none';
            const userPill = document.getElementById('userSessionPill');
            const userNameEl = document.getElementById('headerUserName');
            if (userPill) userPill.style.display = showProtectedNav ? 'inline-flex' : 'none';
            if (userNameEl) {
                try {
                    const u = JSON.parse(localStorage.getItem('registeredUser') || 'null');
                    userNameEl.textContent = u?.name || u?.fullName || 'User';
                } catch(e) { userNameEl.textContent = 'User'; }
            }

            GATED_PAGES.forEach(pageId => {
                const btn = document.querySelector(`.nav-tabs button[data-page="${pageId}"]`);
                if (btn) btn.style.display = showProtectedNav ? '' : 'none';
            });

            // The Top-5 soil recommendation catalogue is also a logged-in feature.
            const soilTopCard = document.getElementById('soilTopPicksHomeCard');
            if (soilTopCard) soilTopCard.style.display = showProtectedNav ? '' : 'none';

            // Direct access protection for separate page files.
            const protectedFiles = ['catalog.html', 'dashboard.html'];
            if (!loggedIn && protectedFiles.includes(currentFile)) {
                window.location.href = 'index.html';
            }
        }

        document.getElementById('logoutBtn')?.addEventListener('click', function() {
            apiFetch('/api/logout',{method:'POST'}).catch(()=>{});
            localStorage.removeItem('aranyaAccessToken');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('registeredUser');
            try{ sessionStorage.clear(); }catch(e){}
            setLoggedInUI(false);
            window.location.href = 'index.html';
        });

        // ===== SOIL ANALYSIS =====
        const analyzeBtn = document.getElementById('analyzeSoilBtn');
        const regionSelect = document.getElementById('regionSelect');
        const soilSelect = document.getElementById('soilSelect');
        const tempInput = document.getElementById('tempInput');
        const rainInput = document.getElementById('rainInput');
        const soilResult = document.getElementById('soilResult');

        function renderLocationRecommendations(recommendations) {
            const container = document.getElementById('locationRecommendations');
            if (!container) return;

            const items = recommendations
                .map(name => commercialSpecies.find(s => s.name === name) || speciesData.find(s => s.name === name))
                .filter(Boolean);

            if (!items.length) {
                container.innerHTML = '';
                return;
            }

            container.innerHTML = `
                <div class="recommendation-heading">
                    <h3><i class="fas fa-star"></i> Recommended Commercial Plantation Species</h3>
                    <span class="badge">Based on your location, soil & climate inputs</span>
                </div>
                <div class="location-recommendations-grid">
                    ${items.map((s, index) => `
                        <article class="location-reco-card">
                            <img data-tree-name="${s.name}" alt="${s.name} tree photograph" loading="lazy">
                            <span class="tree-tag">#${index + 1} Recommended</span>
                            <h3>${s.icon} ${s.name}</h3>
                            <p><strong>Maturity:</strong> ${s.maturity} years</p>
                            <p><strong>Water need:</strong> ${s.waterNeed}</p>
                            <p>${s.description}</p>
                        </article>
                    `).join('')}
                </div>
            `;
            hydrateSpeciesImages(container);
        }

        // ===== LOCATION VALIDATION =====
        function validateLocationInputs() {
            const region = regionSelect.value;
            const soil = soilSelect.value;
            const tempRaw = tempInput.value.trim();
            const rainRaw = rainInput.value.trim();

            let errors = [];
            [regionSelect, soilSelect, tempInput, rainInput].forEach(el => el.classList.remove('input-invalid'));
            setFieldError(document.getElementById('regionSelectError'), '');
            setFieldError(document.getElementById('soilSelectError'), '');
            setFieldError(document.getElementById('tempInputError'), '');
            setFieldError(document.getElementById('rainInputError'), '');

            if (!region) {
                setFieldError(document.getElementById('regionSelectError'), 'Please select a region.');
                regionSelect.classList.add('input-invalid');
                errors.push('region');
            }
            if (!soil) {
                setFieldError(document.getElementById('soilSelectError'), 'Please select a soil type.');
                soilSelect.classList.add('input-invalid');
                errors.push('soil');
            }
            if (tempRaw === '') {
                setFieldError(document.getElementById('tempInputError'), 'Temperature is required.');
                tempInput.classList.add('input-invalid');
                errors.push('temp');
            } else {
                const t = parseFloat(tempRaw);
                if (isNaN(t) || t < -10 || t > 55) {
                    setFieldError(document.getElementById('tempInputError'), 'Enter a realistic temperature between -10°C and 55°C.');
                    tempInput.classList.add('input-invalid');
                    errors.push('temp');
                }
            }
            if (rainRaw === '') {
                setFieldError(document.getElementById('rainInputError'), 'Rainfall is required.');
                rainInput.classList.add('input-invalid');
                errors.push('rain');
            } else {
                const r = parseFloat(rainRaw);
                if (isNaN(r) || r < 0 || r > 6000) {
                    setFieldError(document.getElementById('rainInputError'), 'Enter a realistic rainfall between 0 and 6000 mm.');
                    rainInput.classList.add('input-invalid');
                    errors.push('rain');
                }
            }

            const nutrientFields=[['phInput',0,14,'pH'],['nInput',0,1000,'Nitrogen (N)'],['pInput',0,1000,'Phosphorus (P)'],['kInput',0,1000,'Potassium (K)']];
            nutrientFields.forEach(([id,min,max,label])=>{const el=document.getElementById(id); if(!el)return; const v=el.value.trim(); const err=document.getElementById(id+'Error'); if(v===''){setFieldError(err,label+' is required.');el.classList.add('input-invalid');errors.push(id);} else if(!Number.isFinite(parseFloat(v))||parseFloat(v)<min||parseFloat(v)>max){setFieldError(err,`Enter ${label} between ${min} and ${max}.`);el.classList.add('input-invalid');errors.push(id);} else {setFieldError(err,'');el.classList.remove('input-invalid');}});

            const summaryEl = document.getElementById('locationValidationError');
            if (errors.length > 0) {
                setFieldError(summaryEl, 'Please fix the highlighted fields above before analyzing.');
                return false;
            }
            setFieldError(summaryEl, '');
            return true;
        }

        async function analyzeSoil(){
            if(!validateLocationInputs()) return;
            const region=regionSelect.value, soil=soilSelect.value;
            const temp=parseFloat(tempInput.value), rain=parseFloat(rainInput.value);
            const ph=parseFloat(document.getElementById('phInput')?.value);
            const N=parseFloat(document.getElementById('nInput')?.value);
            const P=parseFloat(document.getElementById('pInput')?.value);
            const K=parseFloat(document.getElementById('kInput')?.value);
            const planting_space=document.getElementById('plantingSpaceInput')?.value || 'open_farm';
            const purpose=JSON.parse(localStorage.getItem('registeredUser')||'null')?.purpose || 'Commercial Business';
            const result= document.getElementById('soilResult');
            if(![ph,N,P,K].every(Number.isFinite)){ setFieldError(document.getElementById('locationValidationError'),'Please enter pH and N, P, K values before analyzing.'); return; }
            try{
                if(result) result.innerHTML='<i class="fas fa-spinner fa-spin"></i> Analyzing with the trained Random Forest model...';
                const data=await apiFetch('/api/recommend',{method:'POST',body:JSON.stringify({soil_ph:ph,rainfall_mm:rain,temperature_c:temp,soil_type:soil,N,P,K,planting_space})});
                if(!data.recommendations.length){
                    if(result) result.innerHTML=`⚠️ No species in the catalog fit both this soil/climate profile and "${planting_space.replace('_',' ')}". Try a different planting space, or adjust the soil inputs.`;
                    renderLocationRecommendations([]);
                    return;
                }
                const recommendations=data.recommendations.map(x=>x.species);
                const scoring=data.recommendations.map(x=>({name:x.species,score:x.confidence_percent,reasons:[],probability:x.probability,category:x.category}));
                if(result) result.innerHTML=`🌱 Recommended: ${recommendations.join(', ')}`;
                renderLocationRecommendations(recommendations);
                updateExplainAI(recommendations,scoring);
                uSetRaw('lastAnalysis',JSON.stringify({region,soil,temp,rain,ph,N,P,K,planting_space,purpose,recommendations,scoring,modelResults:data.recommendations,analyzedAt:new Date().toISOString()}));
                updateRecommendationAccess(); populateCalcSpecies(); updateSpacingAdvice(); saveFormState();
                updateHomeRecommendation(); updateReport(); updateDashboardStats(); updateDashboardWelcome(); renderSelectedSpeciesCare();
                document.getElementById('calcSpecies')?.dispatchEvent(new Event('change',{bubbles:true}));
                document.getElementById('wb-recommendation')?.scrollIntoView({behavior:'smooth',block:'start'});
            }catch(err){
                if(result) result.textContent='';
                setFieldError(document.getElementById('locationValidationError'),'AI analysis failed: '+err.message+' Make sure the AranyaAI backend is running.');
            }
        }

        if (analyzeBtn) analyzeBtn.addEventListener('click', analyzeSoil);

        // ===== CALCULATOR =====
        const calcBtn = document.getElementById('calcTreesBtn');
        const treeSpacing = document.getElementById('treeSpacing');
        const totalArea = document.getElementById('totalArea');

        function speciesInfoFor(name){
            const s=commercialSpecies.find(x=>x.name===name);
            return { category: s?.commercialProfile?.category, months: s?.commercialProfile?.duration_months };
        }
        let lastFarmOpts=null; // layered-farm drawing options from the latest Calculate Plantation (reused in the report)
        function selectedCalcSpecies(){
            const sel=document.getElementById('calcSpecies');
            return sel ? Array.from(sel.selectedOptions).map(o=>o.value) : [];
        }
        // Pre-select the recommended species (or keep the current selection) so the layout can be drawn straight away.
        function refreshIntercropPlan(){
            if(!window.AranyaLayout) return;
            const names=window.AranyaLayout.orderSpecies(selectedCalcSpecies(), speciesInfoFor);
            window.AranyaLayout.renderPlan(document.getElementById('intercropPlan'), names, speciesInfoFor);
        }

        // silent=true is used for automatic runs (page load / after a recommendation): no pop-up if inputs are incomplete.
        async function calculateTrees(silent){
            silent = silent === true;
            const L=parseFloat(document.getElementById('landLength')?.value)||0, W=parseFloat(document.getElementById('landWidth')?.value)||0;
            const ts=parseFloat(document.getElementById('treeSpacing')?.value)||0, rs=parseFloat(document.getElementById('rowSpacing')?.value)||0;
            const gapRaw=parseFloat(document.getElementById('boundaryGap')?.value); const gap=Number.isFinite(gapRaw)?gapRaw:0;
            // Tall-to-short order (timber -> core -> secondary -> ground) so the bands read like the layered reference model.
            const chosen=selectedCalcSpecies();
            const species = window.AranyaLayout ? window.AranyaLayout.orderSpecies(chosen, speciesInfoFor) : chosen;
            const fail=(m)=>{ if(!silent) alert(m); };
            if(L<=0||W<=0){ fail('Please enter your land length and width in feet.'); return; }
            if(!species.length){ fail('Please select at least one species.'); return; }
            if(ts<=0||rs<=0){ fail('Tree and row spacing are needed. They are filled in automatically once you pick trees — or type your own (in feet).'); return; }
            if(L<=2*gap||W<=2*gap){ fail('The boundary gap is too big for this plot. Reduce the gap or use a bigger plot.'); return; }
            const lim=AU.maxSpeciesForSqft(L*W);
            if(species.length>lim){ const msg=`A ${AU.fmtNum(L)} × ${AU.fmtNum(W)} ft plot (${AU.fmtNum(L*W)} sq ft) allows at most ${lim} species. You selected ${species.length}.`; if(silent) aranyaToast(msg,true); else alert(msg); return; }
            try{
                const data=await apiFetch('/api/plantation/calculate',{method:'POST',body:JSON.stringify({length_m:L*M_PER_FT,width_m:W*M_PER_FT,tree_spacing_m:ts*M_PER_FT,row_spacing_m:rs*M_PER_FT,boundary_gap_m:gap*M_PER_FT,species})});
                const areaSqft=L*W;
                const ids=['treeCountResult','rowCountResult','treesPerRowResult','totalArea','interRowResult','spacingResult'];
                const vals=[data.total_trees,data.rows,data.trees_per_row,AU.fmtNum(areaSqft)+' sq ft',AU.fmtFt(rs),AU.fmtFt(ts)+' × '+AU.fmtFt(rs)];
                ids.forEach((id,i)=>{const el=document.getElementById(id);if(el)el.textContent=vals[i];});
                uSetRaw('plantationPlan',JSON.stringify({unit:'ft',length:L,width:W,treeSpacing:ts,rowSpacing:rs,boundaryGap:gap,rows:data.rows,treesPerRow:data.trees_per_row,total:data.total_trees,areaSqft:areaSqft,species,bands:data.bands,savedAt:new Date().toISOString()}));
                renderLayout(data.rows,data.trees_per_row,species,data.bands);
                if(window.AranyaLayout){
                    lastFarmOpts={rows:data.rows,perRow:data.trees_per_row,bands:data.bands,species,info:speciesInfoFor,tree_spacing:ts,row_spacing:rs,boundary_gap:gap,length:L,width:W};
                    window.AranyaLayout.render(document.getElementById('layeredFarm'),lastFarmOpts);
                    window.AranyaLayout.renderPlan(document.getElementById('intercropPlan'),species,speciesInfoFor);
                    hydrateSpeciesImages(document.getElementById('layeredFarm'));
                }
                renderSelectedSpeciesCare(); updateReport(); updateDashboardStats(); saveFormState();
                const warnEl=document.getElementById('locationValidationError');
                if(data.warning){ setFieldError(warnEl,data.warning); if(warnEl) warnEl.dataset.plantWarn='1'; }
                else if(warnEl && warnEl.dataset.plantWarn==='1'){ setFieldError(warnEl,''); delete warnEl.dataset.plantWarn; }
            }catch(err){ if(!silent) alert('Plantation calculation failed: '+err.message); else console.warn('Automatic layout skipped:',err.message); }
        }

        if (calcBtn) calcBtn.addEventListener('click', () => calculateTrees());

        // ===== LAYOUT =====
        // Pure-CSS isometric toggle: adds/removes .iso-3d on the existing
        // grid (see css/style.css) so the plantation preview can be viewed
        // as a flat table or tilted like a field, without changing any
        // colors or requiring a 3D library.
        // Layout tabs: Layered farm view / Tree grid / Reference model
        document.querySelectorAll('.layout-tab').forEach(tab=>{
            tab.addEventListener('click',()=>{
                const view=tab.dataset.view;
                document.querySelectorAll('.layout-tab').forEach(t=>{const on=t===tab; t.classList.toggle('active',on); t.setAttribute('aria-selected',String(on));});
                const map={grid4x4:'layoutViewGrid4x4',farm:'layoutViewFarm',grid:'layoutViewGrid',ref:'layoutViewRef'};
                Object.entries(map).forEach(([k,id])=>document.getElementById(id)?.classList.toggle('active',k===view));
            });
        });
        document.getElementById('calcSpecies')?.addEventListener('change', refreshIntercropPlan);

        const layoutViewToggle = document.getElementById('layoutViewToggle');
        if (layoutViewToggle) {
            layoutViewToggle.addEventListener('click', () => {
                const grid = document.getElementById('layoutGrid');
                if (!grid) return;
                const isNow3d = grid.classList.toggle('iso-3d');
                layoutViewToggle.setAttribute('aria-pressed', String(isNow3d));
                layoutViewToggle.textContent = isNow3d ? '▦ View as flat grid' : '🧊 View as 3D field';
            });
        }

        // Small palette of shades within the existing green family (not a
        // new hue), used only to tell multiple species' bands apart in the
        // mixed-species layout grid/legend. Falls back to a generated shade
        // if more species than swatches are selected (capped at 8 by the
        // backend schema).
        const BAND_SHADES = ['#2b7a4e', '#1d5c3d', '#3fa06a', '#123f2b', '#4fae7c', '#0f3b2a', '#63bd90', '#245c40'];

        function renderLayout(rows, perRow, speciesList, bands){
            const grid=document.getElementById('layoutGrid'); if(!grid)return;
            const names = Array.isArray(speciesList) ? speciesList : [speciesList];
            const resolvedBands = (bands && bands.length) ? bands : [{species: names[0], rows, trees: rows*perRow, row_start:0, row_end:rows}];
            const maxCells=600, r=Math.min(rows,50), c=Math.min(perRow,50);
            grid.style.gridTemplateColumns=`repeat(${Math.max(1,c)}, minmax(36px,1fr))`; grid.innerHTML='';

            const speciesForRow = (rowIdx) => {
                const b = resolvedBands.find(b => rowIdx >= b.row_start && rowIdx < b.row_end);
                return b ? b.species : names[0];
            };
            const bandIndexForRow = (rowIdx) => {
                const idx = resolvedBands.findIndex(b => rowIdx >= b.row_start && rowIdx < b.row_end);
                return idx === -1 ? 0 : idx;
            };

            let placed=0;
            for(let row=0; row<r && placed<maxCells; row++){
                const rowSpecies = speciesForRow(row);
                const shade = names.length>1 ? BAND_SHADES[bandIndexForRow(row)%BAND_SHADES.length] : null;
                for(let col=0; col<c && placed<maxCells; col++, placed++){
                    const cell=document.createElement('div'); cell.className='layout-cell tree';
                    if(shade) cell.style.background=shade;
                    cell.title=rowSpecies||'Tree';
                    cell.innerHTML=`<img data-tree-name="${rowSpecies||''}" alt="${rowSpecies||'Tree'}" style="width:100%;height:100%;object-fit:cover;border-radius:6px">`;
                    grid.appendChild(cell);
                }
            }
            if(rows*perRow>maxCells){const note=document.createElement('div');note.className='explain-box';note.textContent=`Layout preview limited to ${maxCells} trees; calculation remains ${rows*perRow} trees.`;grid.appendChild(note);}

            const support=document.getElementById('layoutSupportInfo');
            if(support){
                if(names.length>1){
                    // Multi-species: show a row-band legend instead of a single
                    // species' support/host card (each species can still be
                    // opened individually from the catalog for its own guidance).
                    const legendRows = resolvedBands.filter(b=>b.rows>0).map((b,i)=>
                        `<div class="layout-band-row"><span class="layout-band-swatch" style="background:${BAND_SHADES[i%BAND_SHADES.length]}"></span><strong>${escHtml(b.species)}</strong> — ${b.rows} row${b.rows===1?'':'s'} · ${b.trees} trees (rows ${b.row_start+1}–${b.row_end})</div>`
                    ).join('');
                    support.innerHTML=`<div class="layout-legend"><span><i class="fas fa-layer-group"></i> Mixed plantation — ${names.length} species across row-bands</span></div><div class="layout-band-list">${legendRows}</div>`;
                } else {
                    const speciesName=names[0];
                    const s=commercialSpecies.find(x=>x.name===speciesName);
                    const k=(s&&s.knowledge)||window.speciesKnowledge?.[speciesName]||{};
                    support.innerHTML=k.supporting_tree ? `<div class="layout-support-card"><div class="layout-support-image"><img data-tree-name="${escHtml((k.supporting_tree||'').split(' ')[0])}" alt="Support or host plant" loading="lazy"></div><div><h4><i class="fas fa-tree"></i> Support / host guidance</h4><p><strong>${escHtml(k.supporting_tree)}</strong></p><p>${escHtml(k.supporting_tree_rule||'Use a locally recommended support system where appropriate.')}</p><span class="layout-legend-main">Main: ${escHtml(speciesName)}</span></div></div>` : `<div class="layout-legend"><span><i class="fas fa-tree"></i> Main plantation: <strong>${escHtml(speciesName||'Selected species')}</strong></span><span>Support/host: Not required in the AranyaAI species guide</span></div>`;
                }
                hydrateSpeciesImages(support);
            }
            hydrateSpeciesImages(grid);
        }

        // ===== EXPLAINABLE AI =====
        function updateExplainAI(recommendations, scoring) {
            const explainGrid = document.getElementById('explainGrid');
            if (!explainGrid) return;
            const items = (scoring || recommendations.map(n=>({name:n,score:0,reasons:[]}))).slice(0,5);
            explainGrid.innerHTML = items.map((item, index) => {
                const s = commercialSpecies.find(x=>x.name===item.name) || speciesData.find(x=>x.name===item.name);
                if (!s) return '';
                const k = s.knowledge || window.speciesKnowledge?.[s.name] || {};
                const benefits = (k.benefits || []).slice(0,4);
                const uses = k.uses || s.uses || '';
                const benefitHtml = benefits.length
                    ? `<ul class="explain-benefits">${benefits.map(b=>`<li><i class="fas fa-check-circle"></i> ${escHtml(b)}</li>`).join('')}</ul>`
                    : `<p>${escHtml(s.description || 'A commercial plantation species that suits your soil and climate.')}</p>`;
                return `<div class="explain-box">
                    <div class="explain-image-wrap"><img data-tree-name="${escHtml(s.name)}" alt="Real photograph of ${escHtml(s.name)}" loading="lazy"></div>
                    <h4>🌳 ${escHtml(s.name)} ${index===0?'<span class="tree-tag">best match</span>':''}</h4>
                    <p><strong>Why it suits you:</strong> ${escHtml(s.description || 'It matches your soil and climate.')}</p>
                    <p><strong>Benefits of growing ${escHtml(s.name)}:</strong></p>
                    ${benefitHtml}
                    ${uses ? `<p><i class="fas fa-store"></i> <strong>Used for:</strong> ${escHtml(uses)}</p>` : ''}
                </div>`;
            }).join('');
            hydrateSpeciesImages(explainGrid);
        }

        // ===== SELECTED SPECIES PLANTING GUIDE + CARE =====
        function selectedSpeciesObjects(){
            return selectedCalcSpecies().map(name => commercialSpecies.find(s=>s.name===name)||speciesData.find(s=>s.name===name)).filter(Boolean);
        }
        function renderSelectedReference(){
            const box=document.getElementById('selectedReferenceSpecies'); if(!box)return;
            const selected=selectedSpeciesObjects();
            if(!selected.length){box.innerHTML='<div class="lf-empty">Select commercial trees above to preview the exact species used in your layouts.</div>';return;}
            box.innerHTML=selected.map((s,i)=>`<article class="selected-reference-card"><img data-tree-name="${escHtml(s.name)}" alt="Real photograph of ${escHtml(s.name)}" loading="lazy"><div><span class="badge">Selected #${i+1}</span><h4>${escHtml(s.name)}</h4><p>${escHtml(s.knowledge?.spacing||'Species-specific spacing from the catalog')}</p></div></article>`).join('');
            hydrateSpeciesImages(box);
        }

        function renderSelectedSpeciesCare(){
            const selected=selectedSpeciesObjects();
            const guide=document.getElementById('selectedPlantingGuide');
            const care=document.getElementById('selectedCareMaintenance');
            if(!selected.length){
                if(guide) guide.innerHTML='<div class="lf-empty">Select one or more commercial trees above to generate a species-specific planting guide.</div>';
                if(care) care.innerHTML='<div class="lf-empty">Select one or more commercial trees above to generate care and maintenance details.</div>';
                return;
            }
            const card=(s,i)=>{
                const k=s.knowledge||window.speciesKnowledge?.[s.name]||{};
                const spacing=k.spacing||'Follow the species-specific spacing shown in the catalog and verify locally.';
                const rootWarning=/coconut/i.test(s.name)
                    ? '🌴 Coconut needs generous spacing: its palm crown and root zone need room, so do not crowd it with closely spaced main trees.'
                    : /arecanut/i.test(s.name)
                    ? '🌴 Arecanut is a palm crop; allow its full root/canopy zone and plan irrigation/drainage carefully.'
                    : '🌱 Maintain a clear root zone around the trunk and avoid damaging major roots during weeding.';
                const steps=(k.planting_steps||[]).slice(0,6);
                return `<article class="selected-species-care-card"><div class="selected-care-head"><img data-tree-name="${escHtml(s.name)}" alt="Real photograph of ${escHtml(s.name)}" loading="lazy"><div><span class="badge">Selected commercial tree #${i+1}</span><h4>${escHtml(s.name)}</h4><p>${escHtml(s.description||'Species-specific commercial plantation profile.')}</p></div></div><div class="selected-care-facts"><div><b>↔️ Spacing</b><span>${escHtml(spacing)}</span></div><div><b>💧 Irrigation</b><span>${escHtml((k.irrigation||[]).slice(0,2).join(' '))}</span></div><div><b>🧪 Nutrition</b><span>${escHtml((k.fertilizer||[]).slice(0,2).join(' '))}</span></div><div><b>🌿 Maintenance</b><span>${escHtml((k.maintenance||[]).slice(0,2).join(' '))}</span></div><div><b>🐛 Pest/disease watch</b><span>${escHtml((k.pest_management||[]).slice(0,2).join(' '))}</span></div><div><b>🌾 Compatible intercrops</b><span>${escHtml((k.intercrops||[]).slice(0,2).join(' ')||'None specified in the species guide')}</span></div></div><div class="species-real-warning"><strong>Real planting note:</strong> ${escHtml(rootWarning)}</div><h5>Planting sequence</h5><ol>${(steps.length?steps:['Prepare the site and drainage.','Use healthy planting material.','Plant at the recommended species spacing.','Water after planting and mulch appropriately.']).map(x=>`<li>${escHtml(x)}</li>`).join('')}</ol></article>`;
            };
            if(guide) guide.innerHTML=selected.map(card).join('');
            renderSelectedReference();
            if(care) care.innerHTML=selected.map((s,i)=>{
                const k=s.knowledge||window.speciesKnowledge?.[s.name]||{};
                const checkpoints=[
                    ['📅 First 30 days',(k.irrigation||[])[0]||'Check moisture regularly and protect young plants.'],
                    ['🌱 Establishment',(k.maintenance||[])[0]||'Keep the root zone clean and maintain drainage.'],
                    ['💧 Dry period',(k.irrigation||[])[1]||'Increase monitoring during prolonged dry weather.'],
                    ['✂️ Training/pruning',(k.maintenance||[])[1]||'Train the plant according to its growth habit; avoid unnecessary cuts.'],
                    ['🐛 Weekly scouting',(k.pest_management||[])[0]||'Inspect leaves, stems and new growth for early pest/disease signs.'],
                    ['⚠️ Precaution',k.precautions||'Avoid waterlogging and follow locally approved crop-management practices.']
                ];
                return `<article class="selected-species-care-card"><div class="selected-care-head compact"><img data-tree-name="${escHtml(s.name)}" alt="Real photograph of ${escHtml(s.name)}" loading="lazy"><div><h4>${escHtml(s.name)}</h4><p>Practical maintenance checklist for your selected plantation.</p></div></div><div class="care-checklist">${checkpoints.map(x=>`<div><strong>${escHtml(x[0])}</strong><p>${escHtml(x[1])}</p></div>`).join('')}</div></article>`;
            }).join('');
            hydrateSpeciesImages(document.getElementById('selectedPlantingGuide')); hydrateSpeciesImages(document.getElementById('selectedCareMaintenance'));
        }

        // ===== REPORT — recommendations remain informational; the plantation report follows user selections =====
        function updateReport(){
            const reportPreview=document.getElementById('reportPreview'); if(!reportPreview)return;
            let lastAnalysis=null,plan=null,user=null;
            try{lastAnalysis=uGet('lastAnalysis');}catch(e){}
            try{plan=uGet('plantationPlan');}catch(e){}
            try{user=JSON.parse(localStorage.getItem('registeredUser')||'null');}catch(e){}
            const selected=selectedSpeciesObjects();
            if(!lastAnalysis || !selected.length){reportPreview.innerHTML='<p>Complete Location &amp; Soil Analysis, then select your commercial trees and click Calculate Plantation to generate the personalized report.</p>';return;}
            const regionLabels=REGION_LABELS;
            const soilLabels={loamy:'Loamy',Laterite:'Laterite','Alluvial':'Alluvial','Red loam':'Red loam','Rocky':'Rocky','Sandy loam':'Sandy loam'};
            let html=`<div class="report-header-box"><h3>🌿 AranyaAI Selected Plantation Report</h3><p>Prepared for <strong>${escHtml(user?.name||'User')}</strong>${user?.purpose?' — '+escHtml(user.purpose):''}</p><p><strong>Important:</strong> this report is based on the commercial species you selected, not the model's Top-3 recommendations.</p></div>`;
            html+=`<div class="report-facts"><div><b>Location/region</b><span>${escHtml(regionLabels[lastAnalysis.region]||lastAnalysis.region||'Not entered')}</span></div><div><b>Soil</b><span>${escHtml(soilLabels[lastAnalysis.soil]||lastAnalysis.soil||'Not entered')}</span></div><div><b>Temperature</b><span>${escHtml(lastAnalysis.temp)} °C</span></div><div><b>Rainfall</b><span>${escHtml(lastAnalysis.rain)} mm/year</span></div><div><b>Soil pH</b><span>${escHtml(lastAnalysis.ph)}</span></div><div><b>N / P / K</b><span>${escHtml(lastAnalysis.N)} / ${escHtml(lastAnalysis.P)} / ${escHtml(lastAnalysis.K)}</span></div></div>`;
            html+='<h4 class="report-section-title">Selected commercial trees</h4><div class="report-species-list">'+selected.map((s,i)=>{const k=s.knowledge||window.speciesKnowledge?.[s.name]||{};return `<div class="report-species-item"><img data-tree-name="${escHtml(s.name)}" alt="Real photograph of ${escHtml(s.name)}"><div><h4>#${i+1} ${escHtml(s.name)}</h4><p>${escHtml(s.description||'')}</p><p><strong>Spacing:</strong> ${escHtml(k.spacing||'See species guide')}</p><p><strong>Planting:</strong> ${escHtml((k.planting_steps||[]).slice(0,2).join(' '))}</p><p><strong>Care:</strong> ${escHtml((k.irrigation||[]).slice(0,1).join(' '))}</p><p><strong>Intercrops:</strong> ${escHtml((k.intercrops||[]).slice(0,2).join(' ')||'None specified')}</p>${k.supporting_tree?`<p><strong>Support/host:</strong> ${escHtml(k.supporting_tree)}</p>`:''}</div></div>`;}).join('')+'</div>';
            if(plan?.total){html+=`<div class="report-plan-box"><h4>📐 Plantation plan</h4><p><strong>${Number(plan.total).toLocaleString('en-IN')}</strong> main planting positions across <strong>${AU.fmtNum(plan.areaSqft)} sq ft</strong> (${AU.fmtNum(plan.length)} × ${AU.fmtNum(plan.width)} ft).</p><p>${plan.rows} rows × ${plan.treesPerRow} trees/row · ${AU.fmtFt(plan.treeSpacing)} tree spacing · ${AU.fmtFt(plan.rowSpacing)} row spacing · ${AU.fmtFt(plan.boundaryGap)} boundary gap.</p><p><strong>Selected species row-bands:</strong> ${(plan.bands||[]).map(b=>`${escHtml(b.species)} (${b.rows} rows)`).join(' · ')}</p></div>`;}
            html+='<h4 class="report-section-title">Species-specific planting & care highlights</h4><div class="report-care-grid">'+selected.map(s=>{const k=s.knowledge||window.speciesKnowledge?.[s.name]||{};return `<div><strong>${escHtml(s.name)}</strong><p>🌱 ${escHtml((k.planting_steps||[]).slice(0,1).join(' ')||'Prepare the site and use healthy planting material.')}</p><p>💧 ${escHtml((k.irrigation||[]).slice(0,1).join(' ')||'Adjust irrigation to soil and season.')}</p><p>🧪 ${escHtml((k.fertilizer||[]).slice(0,1).join(' ')||'Use soil-test-based nutrition.')}</p><p>🐛 ${escHtml((k.pest_management||[]).slice(0,1).join(' ')||'Scout regularly for pests and disease.')}</p></div>`;}).join('')+'</div>';
            const sameSel=lastFarmOpts&&window.AranyaLayout&&lastFarmOpts.species.length===selected.length&&selected.every(sp=>lastFarmOpts.species.includes(sp.name));
            html+='<div class="report-farm-section"><h4 class="report-section-title">🌳 Your layered farm view</h4>'+(sameSel
                ?'<p>Your selected species drawn as row-bands on your plot, with compatible intercrops/support plants. Simple sketch, not to scale.</p><div id="reportLayeredFarm" class="report-layered-farm"></div>'
                :'<p class="report-farm-pending">Click <strong>Calculate Plantation</strong> after choosing your species to add your layered farm view to this report.</p>')+'</div>';
            html+=`<p class="report-disclaimer">The report uses the selected species' project knowledge and catalog data. Spacing, irrigation, nutrition, pest management and root-zone needs vary with variety, age, soil, climate and local practice. Verify final planting design locally.</p><p style="margin-top:.6rem;font-size:.78rem;color:#5c7a68;">Report generated ${new Date().toLocaleString()}</p>`;
            reportPreview.innerHTML=html;
            if(sameSel){ const fm=document.getElementById('reportLayeredFarm'); if(fm){ window.AranyaLayout.render(fm,lastFarmOpts); } }
            hydrateSpeciesImages(reportPreview);
        }

        // ===== PRINT REPORT =====
        // Only the Plantation Report is printed (not the whole 21-page dashboard). The body class drives the @media print
        // rules in css/style.css; it is set for the button AND for Ctrl+P / browser print, and removed afterwards.
        function setReportPrintMode(on){ document.body.classList.toggle('print-report-only', on); }
        window.addEventListener('beforeprint', ()=>{ if(document.getElementById('reportPreview')) setReportPrintMode(true); });
        window.addEventListener('afterprint', ()=>setReportPrintMode(false));
        document.getElementById('printReportBtn')?.addEventListener('click', function() {
            setReportPrintMode(true);
            // let the browser apply the print layout first, then clean up in afterprint (with a fallback)
            setTimeout(()=>{ window.print(); setTimeout(()=>setReportPrintMode(false),1000); },50);
        });

        // ===== DASHBOARD (built from the user's actual analysis + plan, not fixed sample numbers) =====
        let dashChartInstance = null;

        function profitPerAcre(name){
            const s=commercialSpecies.find(x=>x.name===name); const r=s?.commercialProfile?.profit_per_acre_inr_range;
            return Array.isArray(r)&&r.length===2 ? (r[0]+r[1])/2 : null;
        }
        function updateDashboardStats() {
            const plan = uGet('plantationPlan'), analysis = uGet('lastAnalysis');
            const aiNames = (analysis && Array.isArray(analysis.recommendations)) ? analysis.recommendations : [];
            const hasPlan = !!(plan && plan.total);
            const hasData = hasPlan || aiNames.length > 0;
            const empty=document.getElementById('dashEmpty'), content=document.getElementById('dashContent');
            if (empty) empty.style.display = hasData ? 'none' : '';
            if (content) content.style.display = hasData ? '' : 'none';
            if (!hasData) { if (dashChartInstance) { dashChartInstance.destroy(); dashChartInstance=null; } return; }

            const total = hasPlan ? plan.total : 0;
            const areaSqft = hasPlan ? (plan.areaSqft || 0) : 0;
            const acres = areaSqft / SQFT_PER_ACRE;
            const bands = hasPlan ? (plan.bands || []).filter(b => b.rows > 0) : [];
            const totalRows = bands.reduce((a, b) => a + b.rows, 0) || 1;
            let revenue = 0;
            bands.forEach(b => { const p = profitPerAcre(b.species); if (p != null) revenue += p * acres * (b.rows / totalRows); });

            const set=(id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
            set('dashTrees', total.toLocaleString('en-IN'));
            set('dashAcres', acres ? (acres < 0.1 ? acres.toFixed(3) : acres.toFixed(2)) : '0');
            set('dashRevenue', revenue ? `₹ ${Math.round(revenue).toLocaleString('en-IN')}` : '₹ 0');

            const planNames = hasPlan ? (plan.species || []) : [];
            const all = Array.from(new Set([...aiNames, ...planNames]));
            const chips=document.getElementById('dashSpecies');
            if (chips) chips.innerHTML = all.map(n => `<span class="${aiNames.includes(n)?'ai':''}">${aiNames.includes(n)?'★ ':'🌳 '}${escHtml(n)}${aiNames.includes(n)?' (AI recommended)':''}</span>`).join('');

            let labels, data, title;
            if (bands.length) {
                labels = bands.map(b => b.species); data = bands.map(b => b.trees);
                title = 'Trees planned per species (from your plantation layout)';
            } else {
                const mr = (analysis && analysis.modelResults) || [];
                labels = aiNames; data = aiNames.map(n => { const m = mr.find(x => x.species === n); return m ? Math.round(m.confidence_percent * 10) / 10 : 0; });
                title = 'AI match score (%) for your recommended species — enter your land size and click Calculate Plantation to see trees per species';
            }
            set('dashChartTitle', title);
            set('dashNote', hasPlan ? `Your plot: ${AU.fmtNum(plan.length)} × ${AU.fmtNum(plan.width)} ft = ${AU.fmtNum(areaSqft)} sq ft (${acres.toFixed(3)} acres). Revenue is an indicative yearly estimate from catalog profit-per-acre figures, shared across your species by the rows each one gets.` : '');

            const palette = ['#1f6e47', '#2b8c5a', '#3da36b', '#5cb885', '#7dca9a', '#a8dbb8', '#c9a227', '#8a5a00'];
            const canvas = document.getElementById('dashChart');
            if (canvas && typeof Chart !== 'undefined') {
                if (dashChartInstance) dashChartInstance.destroy();
                dashChartInstance = new Chart(canvas.getContext('2d'), {
                    type: 'bar',
                    data: { labels, datasets: [{ label: title, data, backgroundColor: labels.map((_, i) => palette[i % palette.length]), borderRadius: 8 }] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } } }
                });
            }
        }

        // The Plantation Assistant chatbot now lives in js/chatbot.js and is injected on every page.

        function updateDashboardWelcome() {
            const el = document.getElementById('dashboardWelcome');
            const ctx = document.getElementById('dashboardContext');
            if (!el) return;
            try {
                const user = JSON.parse(localStorage.getItem('registeredUser') || 'null');
                const analysis = uGet('lastAnalysis');
                const returning = !!(analysis || uGet('plantationPlan'));
                el.textContent = user && user.name ? (returning ? `Welcome back, ${user.name}!` : `Welcome, ${user.name}!`) : 'Welcome to your plantation dashboard!';
                if (ctx) {
                    const bits=[];
                    if (user?.purpose) bits.push(user.purpose);
                    if (analysis?.soil) bits.push(analysis.soil + ' soil');
                    if (analysis?.region) bits.push(analysis.region + ' region');
                    ctx.textContent = bits.length ? bits.join('  |  ') : 'Personalized plantation planning';
                }
            } catch(e) {}
        }

        // ===== INITIALIZATION =====
        setTimeout(() => {
            // Do not auto-run analyzeSoil() on load — region/soil/temp/rainfall
            // are now required fields the user must actively fill in.
            if (calcBtn && getAuthToken() && selectedCalcSpecies().length) calculateTrees(true); renderSelectedSpeciesCare();
            renderSpeciesCatalog();
            renderComparison();
            renderTopPicksBySoil('soilTopPicksHome');
            renderTopPicksBySoil('soilTopPicksCatalog');
            renderTopPicksBySoil('soilTopPicksDashboard');
            setLoggedInUI(!!getAuthToken());
            if (getAuthToken()) { apiFetch('/api/me').catch(() => { localStorage.removeItem('aranyaAccessToken'); localStorage.removeItem('isLoggedIn'); setLoggedInUI(false); }); }
            updateHomeRecommendation();
            updateReport();
            updateDashboardStats();
            updateDashboardWelcome();
            if (window.location.hash) {
                setTimeout(() => document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView({behavior:'smooth', block:'start'}), 180);
            }
        }, 100);

        document.getElementById('calcSpecies')?.addEventListener('change', function(){ updateSpacingAdvice(); saveFormState(); renderSelectedSpeciesCare(); renderSelectedReference(); updateReport(); if(getAuthToken() && selectedCalcSpecies().length) calculateTrees(true); });
        if (treeSpacing) treeSpacing.addEventListener('change', () => calculateTrees(true));
        // Auto-analyzing on every keystroke/change would trigger validation
        // errors before the user has filled every field, so recommendations
        // now only run on the explicit "Analyze Soil & Recommend" click.
        // The soil photo preview, however, updates live as soon as a soil
        // type is picked, independent of full-form validation.
        if (soilSelect) soilSelect.addEventListener('change', updateSoilPreview);
        updateSoilPreview();

        console.log('🌳 AI Tree Plantation Recommendation System loaded!');
        console.log(`📚 ${speciesData.length} commercial tree species loaded.`);
        // Restore the correct state when the page is opened again.
        updateRecommendationAccess();
        try {
            const savedAnalysis = uGet('lastAnalysis');
            if (savedAnalysis && savedAnalysis.recommendations && savedAnalysis.recommendations.length) {
                renderLocationRecommendations(savedAnalysis.recommendations);
                updateExplainAI(savedAnalysis.recommendations, savedAnalysis.scoring);
            }
        } catch (e) {}




        // Prefill login email when redirected from registration.
        const loginEmailField = document.getElementById('loginEmail');
        if (loginEmailField) {
            const params = new URLSearchParams(window.location.search);
            const emailParam = params.get('email');
            if (emailParam) loginEmailField.value = emailParam;
        }
