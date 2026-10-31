/* ============================================================
   AranyaAI Plantation Assistant — site-wide chatbot
   ------------------------------------------------------------
   * Injects its own markup, so it appears on EVERY page
     (Home, Register, Login, Species, Dashboard) with no per-page HTML.
   * Works before login and after login.
   * Answers from a 30-question knowledge base written from this
     project's own code, data and model metrics (nothing invented).
   * Keeps the conversation while you move between pages
     (sessionStorage), so it does not reset on navigation.
   ============================================================ */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     30 QUESTIONS & ANSWERS  (id, group, question, answer, keywords)
     Every number below comes from the project files:
       - model: backend/model + data/model_eval_metrics.json
       - catalog: backend/data/species_catalog.json
       - calculator: POST /api/plantation/calculate in main.py
     --------------------------------------------------------- */
  const QA = [
    // ---------- About the project ----------
    { g: 'About the project', q: 'What is AranyaAI?',
      a: 'AranyaAI is an AI-based commercial tree plantation recommendation system. You enter your soil type, pH, rainfall, temperature and N-P-K values; a trained Random Forest model ranks the best matches from 31 catalog species; and the dashboard then helps you plan the plantation: tree count and spacing, a layered mixed/intercropped layout, care guidance and a printable report.',
      k: ['what is aranyaai', 'what is this project', 'about the project', 'about this project', 'aranyai', 'project overview', 'what does this system do', 'what is this website', 'purpose of the project'] },

    { g: 'About the project', q: 'Which technologies does the project use?',
      a: 'Frontend: HTML, CSS and JavaScript (with Chart.js for the dashboard chart). Backend: Python FastAPI with a SQLite database through SQLAlchemy. Login uses JWT tokens. The recommendation model is a scikit-learn model loaded with joblib.',
      k: ['technologies', 'technology', 'tech stack', 'stack', 'fastapi', 'built with', 'framework', 'which language', 'programming language', 'database', 'sqlite', 'chart.js'] },

    { g: 'About the project', q: 'How do I use the dashboard step by step?',
      a: 'Log in, open Dashboard and follow the Project Steps sidebar: 1) Dashboard summary, 2) Top 5 trees by soil, 3) Location & Soil Analysis (enter your values and click Analyze Soil & Recommend), 4) Soil information, then Explainable AI, the plantation calculator, the layout and intercropping, 5) planting guide and care, 6) report, then Compare and Impact. Steps 4 onward unlock after you get a recommendation.',
      k: ['how to use', 'step by step', 'steps', 'dashboard steps', 'how do i start', 'get started', 'workflow', 'project steps', 'how to use dashboard', 'unlock', 'locked'] },

    { g: 'About the project', q: 'How do I run the project on my computer?',
      a: 'Start the backend first: in the aranyai_backend folder create a virtual environment, run pip install -r requirements.txt, then uvicorn main:app --reload --port 8000 (port 8001 also works). Then serve the frontend folder with a local web server such as VS Code Live Server on port 5500. Do not double-click the HTML files. The frontend finds the backend on port 8000 or 8001 automatically, and API docs are at /docs. If you see “AI analysis failed”, the backend is not running.',
      k: ['run the project', 'how to run', 'run locally', 'setup', 'set up', 'install', 'start the backend', 'start backend', 'uvicorn', 'live server', 'port 8000', 'backend not running', 'analysis failed', 'ai analysis failed', 'requirements', 'localhost', 'api docs', 'docs'] },

    // ---------- The AI model ----------
    { g: 'The AI model', q: 'Which machine-learning model is used?',
      a: 'A scikit-learn RandomForestClassifier with 200 trees and a maximum depth of 12 (random_state 42). For a given set of inputs it outputs a probability for each of the 31 species, and the app shows the highest-ranked ones.',
      k: ['machine learning', 'ml model', 'random forest', 'randomforest', 'algorithm', 'which model', 'model used', 'classifier', 'trained model', 'n_estimators', 'artificial intelligence', 'how is ai used'] },

    { g: 'The AI model', q: 'What inputs does the model need?',
      a: 'Seven inputs: soil pH, annual rainfall (mm), average temperature (°C), soil type, and the nutrients Nitrogen (N), Phosphorus (P) and Potassium (K). All seven are required before you can analyze.',
      k: ['inputs', 'input', 'features', 'model inputs', 'what do i enter', 'parameters', 'required fields', 'seven', '7 inputs', 'nitrogen', 'phosphorus', 'potassium', 'npk', 'n p k', 'ph value'] },

    { g: 'The AI model', q: 'Is the region (Tropical / Subtropical / Arid) used by the model?',
      a: 'No. The region is one of the form fields (Tropical – Kerala/Karnataka, Subtropical – UP/Bihar, Arid – Rajasthan/Gujarat) and is saved with your analysis and used by the Species catalog filter, but it is not one of the model’s seven features. The recommendation itself depends on soil type, pH, rainfall, temperature and N-P-K.',
      k: ['region', 'tropical', 'subtropical', 'arid', 'is region used', 'region used', 'climate zone', 'kerala', 'karnataka', 'rajasthan'] },

    { g: 'The AI model', q: 'How does the recommendation work and what does the percentage mean?',
      a: 'The model gives each species a probability for your inputs. The app removes species that do not suit your planting space, then shows the top 3 with their model probability (%). It is the model’s confidence that the species fits your soil and climate data, not a guarantee of yield or profit.',
      k: ['how does recommendation work', 'how recommendation works', 'recommendation', 'recommend', 'confidence', 'probability', 'percentage', 'top 3', 'top three', 'ranking', 'how are trees selected', 'why this tree', 'explainable', 'how does it recommend', 'model probability'] },

    { g: 'The AI model', q: 'How accurate is the model?',
      a: 'On a held-out 20% test split (434 rows) the overall accuracy is about 97.9%. Please read that carefully: 26 of the 31 species use synthetic (generated) data, which makes them easier to separate, so the overall figure is optimistic. The 5 species with real Kaggle data (Mango, Coconut, Banana, Papaya, Watermelon) scored 100% on a small test set. Treat results as decision support and confirm with a local agriculture expert.',
      k: ['accuracy', 'accurate', 'how good', 'reliable', 'reliability', 'precision', 'performance', 'test accuracy', '97', '98', 'trust', 'limitations', 'limitation', 'can i trust', 'overfit'] },

    { g: 'The AI model', q: 'What dataset was the model trained on?',
      a: 'A dataset of 2,170 rows: 1,820 synthetic-generated rows (26 species) and 350 real Kaggle rows (5 species). Columns include species, category, duration, soil type, pH, rainfall, temperature, N, P, K, region, altitude and investment/profit per acre. It was split 80/20 (1,736 train / 434 test) for evaluation.',
      k: ['dataset', 'data set', 'training data', 'trained on', 'used to train', 'train the model', 'training', 'what data was used', 'data was used', 'kaggle', 'synthetic', 'rows', '2170', 'training set', 'data source', 'where does data come from'] },

    // ---------- Soil, species & planting space ----------
    { g: 'Soil, species & space', q: 'Which soil types are supported?',
      a: 'Six soil types: Alluvial, Laterite, Loamy, Red loam, Rocky and Sandy loam. Pick the one that best matches your plot; the app shows a real photo of it for reference.',
      k: ['soil types', 'soil type', 'which soils', 'supported soil', 'types of soil', 'soil', 'alluvial', 'red loam', 'rocky', 'sandy loam', 'loamy', 'laterite', 'clay', 'sandy'] },

    { g: 'Soil, species & space', q: 'How many species are in the catalog and what are the categories?',
      a: '31 species in four duration categories. Long-term (9): Agarwood, Eucalyptus, Mahogany, Neem, Red Sanders, Rosewood, Sandalwood, Silver Oak, Teak. Annuity (8): Amla, Arecanut, Bamboo, Cashew, Coconut, Guava, Jackfruit, Mango. Six-month group (7): Banana, Ginger, Moringa, Papaya, Pineapple, Sugarcane, Turmeric. Three-month group (7): Brinjal, Chilli, Leafy Greens, Marigold, Okra, Tomato, Watermelon.',
      k: ['how many species', 'species', 'catalog', 'catalogue', 'categories', 'category', 'list of trees', 'which trees', 'available trees', '31', 'long term', 'annuity', 'six month', 'three month', 'species catalog'] },

    { g: 'Soil, species & space', q: 'Which trees suit each soil type?',
      a: 'From the catalog: Alluvial – Bamboo, Banana, Coconut, Guava, Jackfruit, Leafy Greens, Mango, Papaya, Rosewood, Sugarcane, Teak, Watermelon. Laterite – Agarwood, Arecanut, Cashew, Jackfruit, Mahogany, Neem, Pineapple, Silver Oak. Loamy – Bamboo, Banana, Brinjal, Chilli, Eucalyptus, Ginger, Guava, Leafy Greens, Marigold, Okra, Rosewood, Sugarcane, Tomato, Turmeric. Red loam – Amla, Arecanut, Brinjal, Chilli, Ginger, Mahogany, Mango, Marigold, Moringa, Pineapple, Red Sanders, Sandalwood, Silver Oak, Teak, Turmeric. Rocky – Red Sanders. Sandy loam – Agarwood, Amla, Cashew, Coconut, Eucalyptus, Moringa, Neem, Okra, Papaya, Sandalwood, Tomato, Watermelon.',
      k: ['which trees suit', 'best tree for soil', 'trees for soil', 'suit each soil', 'soil wise', 'soil-wise', 'best soil', 'which soil is best', 'what grows in', 'grow in laterite', 'grow in loamy', 'grow in alluvial', 'grow in rocky', 'grow in red loam', 'grow in sandy'] },

    { g: 'Soil, species & space', q: 'What does the “planting space” option do?',
      a: 'It filters the catalog before ranking. Choices are Open farm / large plot (all 31 species), Small backyard / home garden (16 species) and Terrace / balcony containers (11 species). So a terrace request never shows Coconut, Teak or Neem, however well their soil and climate match.',
      k: ['planting space', 'where will you plant', 'open farm', 'backyard', 'terrace', 'balcony', 'container', 'home garden', 'space option', 'small space'] },

    { g: 'Soil, species & space', q: 'Can I use it for a terrace or home garden?',
      a: 'Yes. Choose “Terrace / balcony (containers only)” or “Small backyard / home garden” under planting space. Container-suitable species are Banana, Brinjal, Chilli, Ginger, Leafy Greens, Marigold, Okra, Papaya, Pineapple, Tomato and Turmeric. A backyard also allows Amla, Guava, Mango, Moringa and Watermelon.',
      k: ['terrace garden', 'terrace gardening', 'home gardening', 'kitchen garden', 'balcony garden', 'container plants', 'can i use it for home', 'small plot', 'pots', 'small terrace', 'i have a terrace', 'have a terrace', 'terrace farming', 'rooftop', 'roof top'] },

    { g: 'Soil, species & space', q: 'How long do the trees take to mature?',
      a: 'Catalog durations: Timber (long-term) – Eucalyptus 8 yrs, Neem 10, Agarwood and Silver Oak 12, Sandalwood 14, Teak, Mahogany, Rosewood and Red Sanders 15 yrs. Annuity/orchard – Guava 3 yrs, Amla and Bamboo 4, Coconut, Arecanut, Cashew, Jackfruit and Mango 5. Six-month group – 8 to 14 months. Three-month group – 3 to 4 months. Actual maturity varies with variety, site and management.',
      k: ['mature', 'maturity', 'how long', 'years to grow', 'harvest time', 'duration', 'when can i harvest', 'growth period', 'time to harvest', 'how many years', 'growth time', 'rotation'] },

    // ---------- Spacing, plot size, dashboard, password ----------
    { g: 'Plantation planning', q: 'How far apart should I plant my trees?',
      a: 'You do not have to know this. After you pick your trees, the Location & Plantation Inputs section fills in the recommended tree-to-tree and row-to-row spacing in feet, and lists the spacing for every tree you selected (for example Teak about 12 ft, Coconut about 25 ft, Banana about 6 ft). The plantation follows the spacing of your tallest main tree; shorter crops go between the rows at their own spacing. You can still type your own numbers or tap “Use recommended spacing”.',
      k: ['spacing', 'how far apart', 'distance between trees', 'tree to tree', 'row to row', 'recommended spacing', 'feet', 'ft', 'how much space'] },

    { g: 'Plantation planning', q: 'How many species can I plant in my plot?',
      a: 'It depends on plot size: one commercial species for every 80 sq ft, at least 1 and at most 8. For example a 20 × 20 ft plot (400 sq ft) allows at most 5 species. The AI-recommended species (marked ★ AI) are included automatically and count towards this limit.',
      k: ['how many species', 'limit', 'maximum species', 'too many species', 'plot size', '20 x 20', '20x20', 'small plot', 'restrict'] },

    { g: 'Reports, money & account', q: 'Why is my dashboard empty?',
      a: 'The dashboard shows only your own plantation. A new account starts empty; after you enter your land details and click Analyze Soil & Recommend, it shows your trees, acres, projected revenue and a graph of your own species (the AI-recommended ones plus the ones you pick).',
      k: ['dashboard empty', 'dashboard', 'no data', 'new user', 'my dashboard', 'revenue', 'acres planted'] },

    { g: 'Reports, money & account', q: 'I did not get my password reset code. What do I do?',
      a: 'The code is sent by email (the registration form does not collect a phone number, so there is no SMS). Check spam. If the project administrator has not set up email sending in the backend .env file, no email can leave the server — the administrator can read the code in the backend window or set up email using .env.example.',
      k: ['reset code', 'forgot password', 'otp', 'code not received', 'not getting code', 'password reset', 'mobile code', 'sms'] },

    // ---------- Plantation planning ----------
    { g: 'Plantation planning', q: 'How does the plantation calculator work?',
      a: 'Everything is in feet. Usable length = land length − 2 × boundary gap, and usable width is worked out the same way. Trees stand on the spacing grid, so rows = (usable width ÷ row spacing, rounded down) + 1 and trees per row = (usable length ÷ tree spacing, rounded down) + 1; total trees = rows × trees per row. Example: 60 ft × 40 ft plot, 12 ft spacing both ways, 2 ft gap → usable 56 × 36 ft → 4 rows × 5 trees = 20 trees. You do not need to guess the spacing: once you pick your trees, AranyaAI fills in the recommended tree-to-tree and row-to-row spacing in feet for you.',
      k: ['calculator', 'calculate', 'how many trees', 'number of trees', 'tree count', 'trees per row', 'rows', 'formula', 'spacing calculation', 'how are trees counted', 'land size', 'plantation calculator', 'total trees', 'spacing', 'row spacing', 'tree spacing'] },

    { g: 'Plantation planning', q: 'What is the boundary / access gap?',
      a: 'It is the strip left clear along all four sides of the plot (default 2 ft). It is subtracted from both the length and the width before rows and trees are counted, and it is where the boundary belt and access path in the layout sit. Boundary belt trees shown in the layout are a schematic suggestion and are not included in the calculated tree count.',
      k: ['boundary gap', 'access gap', 'boundary', 'access path', 'windbreak', 'border', 'gap', 'service path', 'margin'] },

    { g: 'Plantation planning', q: 'What is a mixed plantation and how is it laid out?',
      a: 'A mixed plantation grows more than one species on the same plot. Hold Ctrl (Cmd on Mac) to select up to 8 different species in the calculator (no duplicates). The land is split into contiguous row-bands, one per species, shared evenly by default. Each band keeps its own strip so it can be irrigated, managed and harvested as a unit. The layout legend lists the rows and trees of every band.',
      k: ['mixed plantation', 'mixed', 'multiple species', 'more than one species', 'multiple trees', 'row band', 'row-band', 'bands', 'several species', 'combine species', 'mixed farming', 'mixed cropping', 'polyculture', 'more than one tree', 'more than one', 'different species', 'multiple tree species', 'two species', 'combination of trees', 'select more than one', 'plant many species'] },

    { g: 'Plantation planning', q: 'What is intercropping and how does the layout show it?',
      a: 'Intercropping means growing compatible short-duration or shade-tolerant crops in the open space between rows of the main trees for extra income and better soil use. In Plantation Layout, the Layered farm view draws intercrop strips between the tree rows, and the intercropping section shows each suggested intercrop with its photo. Suggestions come from each species’ guidance in the catalog.',
      k: ['intercropping', 'intercrop', 'inter crop', 'inter-crop', 'companion crop', 'between rows', 'layout intercrop', 'what can be planted', 'grow between trees', 'extra income', 'multistorey', 'multi storey', 'multi-layer', 'agroforestry'] },

    { g: 'Plantation planning', q: 'Which intercrops go with which trees, and for how long?',
      a: 'From the species guidance: Coconut and Arecanut – black pepper, cocoa, banana, pineapple and ginger in suitable multistorey systems. Mango and Jackfruit – pulses, ginger or turmeric while young. Cashew – pulses or groundnut. Silver Oak – coffee and pepper. Teak, Mahogany, Neem, Eucalyptus, Rosewood, Red Sanders and Agarwood – short-duration crops only in the early years, while there is enough light and moisture. As the canopy closes, shade reduces intercrop room.',
      k: ['which intercrops', 'intercrops for', 'best intercrop', 'intercrop with teak', 'intercrop with coconut', 'intercrop with mango', 'black pepper', 'pepper', 'cocoa', 'turmeric intercrop', 'ginger intercrop', 'early years', 'shade', 'coffee', 'pulses', 'groundnut', 'compatible crops', 'crops can i grow', 'grow between', 'crops between', 'plant between', 'grow with', 'plant along', 'along with', 'between coconut', 'between teak', 'between mango'] },

    { g: 'Plantation planning', q: 'Why does Sandalwood need a host plant?',
      a: 'Sandalwood is hemi-parasitic, so it does better with a suitable host (nurse) plant. The species guide names Pigeon pea (red gram) and other locally recommended hosts. The layout shows the host separately, so the main-tree count stays accurate. Host choice and spacing should follow local forestry or agriculture guidance. Similarly, black pepper can be trained on coconut or arecanut palms as a support crop.',
      k: ['sandalwood host', 'host plant', 'host', 'nurse plant', 'hemi-parasitic', 'hemiparasitic', 'pigeon pea', 'red gram', 'support tree', 'supporting tree', 'support plant', 'legumes for nitrogen', 'why sandalwood needs'] },

    { g: 'Plantation planning', q: 'What are the layers in the Layered Profit Model?',
      a: 'It is a multi-layer design: 1) Timber layer – tall long-term trees such as Teak or Mahogany, forming the boundary/windbreak; 2) Core layer – high-value trees such as Sandalwood with host plants; 3) Secondary layer – Bamboo, palms and fruit trees that give earlier returns; 4) Ground layer – short-duration crops and intercrops between the rows. The dashboard sorts your selected species into these layers by catalog category. The picture in the reference tab is a concept model, not a forecast.',
      k: ['layers', 'layer', 'layered', 'layered profit model', 'profit layers', 'timber layer', 'core layer', 'ground layer', 'secondary layer', 'reference model', 'reference image', 'profit model', 'isometric', '3d farm', 'farm view', 'layout'] },

    { g: 'Plantation planning', q: 'What are the basic planting and care steps?',
      a: 'The dashboard’s generic guide: dig pits of about 2 × 2 × 2 ft two weeks before planting; mix the topsoil with compost and neem cake; plant the sapling, water well and mulch; stake it if needed. For care: drip irrigation, weed control, pruning, pest monitoring and soil-test-based fertilizer. Each species page in the Species catalog has its own planting steps, pit preparation, spacing, irrigation, fertilizer, pest and harvest guidance.',
      k: ['planting steps', 'planting guide', 'how to plant', 'care', 'maintenance', 'pruning', 'irrigation', 'water', 'fertilizer', 'pest', 'pit', 'mulch', 'weed', 'how to grow', 'drip'] },

    // ---------- Money, reports & accounts ----------
    { g: 'Reports, money & account', q: 'How are profit, investment and revenue shown?',
      a: 'The catalog stores investment and profit per acre for every species, and the app shows the profit-per-acre figure on species cards and uses it to order the Top 5 lists. The dashboard’s “Projected revenue” is only a rough illustrative estimate (trees × an average value for your recommended species, scaled), so please do not treat it as a financial forecast.',
      k: ['profit', 'investment', 'revenue', 'income', 'roi', 'return', 'money', 'earnings', 'projected revenue', 'cost', 'per acre', 'price', 'value per ton', 'how much can i earn'] },

    { g: 'Reports, money & account', q: 'What does “Top 5 by soil type” show?',
      a: 'For each of the six soil types, it lists up to five catalog species that suit that soil, ordered by their profit-per-acre figure. A soil with few matching species shows fewer. For example, Rocky soil has only Red Sanders in the catalog.',
      k: ['top 5', 'top five', 'top 5 by soil', 'soil wise top', 'best five', 'top picks', 'top trees'] },

    { g: 'Reports, money & account', q: 'How do I generate the plantation report?',
      a: 'Complete Location & Soil Analysis first. The Report section then fills itself with your inputs, the recommended species with model probabilities, benefits, intercrops, support/host plants and your plantation plan. Click Print / PDF to print it or save it as a PDF.',
      k: ['report', 'pdf', 'print', 'download', 'plantation report', 'generate report', 'export', 'save report'] },

    { g: 'Reports, money & account', q: 'What do the Compare and Environmental Impact sections show?',
      a: 'Compare is a table of commercial trees with maturity, value, water need and ROI. Environmental Impact shows indicative meters for carbon sequestration, water conservation and biodiversity. Those meters are qualitative illustrations of what well-managed plantations can offer, not measured values for your plot.',
      k: ['compare', 'comparison', 'environmental impact', 'environment', 'carbon', 'biodiversity', 'water conservation', 'sustainability', 'impact', 'eco', 'climate change'] },

    { g: 'Reports, money & account', q: 'How do registration, login and passwords work?',
      a: 'Register with your name, email, password and purpose (Agriculture, Terrace Gardening, Commercial Business, Home Gardening, Environmental Plantation or Other). An email can only be registered once. Passwords are stored as salted scrypt hashes, and login returns a JWT token valid for 120 minutes. Only the token and your profile are kept in the browser, never your password. Species and Dashboard pages need you to be logged in.',
      k: ['register', 'registration', 'sign up', 'signup', 'login', 'log in', 'sign in', 'password', 'account', 'security', 'secure', 'jwt', 'token', 'logout', 'duplicate email', 'forgot password', 'purpose'] },

    { g: 'Reports, money & account', q: 'Where do the species and soil photos come from?',
      a: 'Species photos are fetched live from Wikipedia’s public API by article title, and soil photos come from Wikimedia Commons, so an internet connection is needed to see them. Copyright and attribution stay with each original source. The photos are real photographs, not AI-generated. The layout reference picture is your uploaded Layered Profit Model illustration.',
      k: ['photos', 'photo', 'images', 'image', 'pictures', 'picture', 'wikipedia', 'wikimedia', 'real photos', 'ai generated', 'where do images', 'copyright', 'attribution'] }
  ];

  /* Species facts for "tell me about <species>" questions. */
  const SPECIES_ALIASES = { 'silver oak': 'Silver Oak', 'red sanders': 'Red Sanders', 'leafy greens': 'Leafy Greens', 'ladies finger': 'Okra', 'lady finger': 'Okra', 'eggplant': 'Brinjal', 'aubergine': 'Brinjal', 'arecanut': 'Arecanut', 'areca': 'Arecanut', 'areca nut': 'Arecanut', 'red gram': null };

  const STOP = new Set(('a an the is are was were be been do does did can could should would will i me my we you your it its this that these those of in on at to for from with and or but if so as by about into than then how what which who where when why tell please give show explain want need any some more there here have has had not no yes').split(' '));

  const norm = (s) => String(s || '').toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9%\-\s']/g, ' ').replace(/\s+/g, ' ').trim();
  const toks = (s) => norm(s).split(' ').filter((w) => w && !STOP.has(w));
  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Pre-compute normalised keyword & question tokens
  QA.forEach((e, i) => {
    e.id = i + 1;
    e._k = e.k.map(norm);
    e._qt = new Set(toks(e.q));
  });

  function containsPhrase(text, phrase) {
    if (!phrase) return false;
    return new RegExp('(^|\\s)' + escapeRegex(phrase) + '(s|es)?(\\s|$)').test(text);
  }

  function scoreEntry(entry, text, qtokens) {
    let score = 0;
    entry._k.forEach((kw) => {
      if (containsPhrase(text, kw)) score += kw.split(' ').length * 2 + 1;
    });
    let overlap = 0;
    qtokens.forEach((t) => { if (entry._qt.has(t)) overlap++; });
    score += overlap * 1.5;
    if (norm(entry.q) === text) score += 100;
    return score;
  }

  function byQ(text) { return QA.find((e) => e.q === text); }

  function speciesNames() {
    const kn = window.speciesKnowledge || {};
    return Object.keys(kn);
  }

  function findSpecies(text) {
    const names = speciesNames();
    // aliases first (multi-word), then names
    for (const alias in SPECIES_ALIASES) {
      if (containsPhrase(text, alias) && SPECIES_ALIASES[alias]) return SPECIES_ALIASES[alias];
    }
    let found = null;
    names.forEach((n) => { if (!found && containsPhrase(text, norm(n))) found = n; });
    return found;
  }


  /* Soil-specific lists (from the catalog) for “best trees for <soil>” questions */
  const SOIL_SPECIES = {
    'alluvial': ['Bamboo', 'Banana', 'Coconut', 'Guava', 'Jackfruit', 'Leafy Greens', 'Mango', 'Papaya', 'Rosewood', 'Sugarcane', 'Teak', 'Watermelon'],
    'laterite': ['Agarwood', 'Arecanut', 'Cashew', 'Jackfruit', 'Mahogany', 'Neem', 'Pineapple', 'Silver Oak'],
    'loamy': ['Bamboo', 'Banana', 'Brinjal', 'Chilli', 'Eucalyptus', 'Ginger', 'Guava', 'Leafy Greens', 'Marigold', 'Okra', 'Rosewood', 'Sugarcane', 'Tomato', 'Turmeric'],
    'red loam': ['Amla', 'Arecanut', 'Brinjal', 'Chilli', 'Ginger', 'Mahogany', 'Mango', 'Marigold', 'Moringa', 'Pineapple', 'Red Sanders', 'Sandalwood', 'Silver Oak', 'Teak', 'Turmeric'],
    'rocky': ['Red Sanders'],
    'sandy loam': ['Agarwood', 'Amla', 'Cashew', 'Coconut', 'Eucalyptus', 'Moringa', 'Neem', 'Okra', 'Papaya', 'Sandalwood', 'Tomato', 'Watermelon']
  };
  const SOIL_LABEL = { 'alluvial': 'Alluvial', 'laterite': 'Laterite', 'loamy': 'Loamy', 'red loam': 'Red loam', 'rocky': 'Rocky', 'sandy loam': 'Sandy loam' };
  const SOIL_INTENT = /(^|\s)(tree|trees|plant|plants|grow|grows|crop|crops|species|best|suit|suits|suitable|recommend|recommended|good|ideal|which|what)(\s|$)/;

  function soilAnswer(text) {
    let soil = null;
    ['red loam', 'sandy loam', 'alluvial', 'laterite', 'rocky', 'loamy'].forEach((n) => {
      if (!soil && containsPhrase(text, n)) soil = n;
    });
    if (!soil && containsPhrase(text, 'loam')) soil = 'loamy';
    if (!soil || (!SOIL_INTENT.test(text) && !findSpecies(text))) return null;
    // Only treat as a soil-tree question when it is asking about trees/crops, not about the soil itself
    if (/(what is|define|photo|image|picture|properties|description)/.test(text) && !/(tree|trees|plant|grow|crop|species|best|suit)/.test(text)) return null;
    const list = SOIL_SPECIES[soil];
    const sp = findSpecies(text);
    if (sp) {
      const fits = list.indexOf(sp) !== -1;
      return sp + (fits ? ' is listed for ' : ' is not listed for ') + SOIL_LABEL[soil] + ' soil in the catalog. ' + SOIL_LABEL[soil] + ' soil suits: ' + list.join(', ') + '. Use Analyze Soil & Recommend on the Dashboard to rank species for your exact soil, pH, rainfall, temperature and N-P-K.';
    }
    return SOIL_LABEL[soil] + ' soil – the catalog lists ' + list.length + (list.length === 1 ? ' species: ' : ' species: ') + list.join(', ') + '. For a ranked result on your own soil, pH, rainfall, temperature and N-P-K, run Analyze Soil & Recommend on the Dashboard.';
  }

  function speciesAnswer(name) {
    const k = (window.speciesKnowledge || {})[name];
    if (!k) return null;
    const parts = [];
    parts.push(`${name}${k.uses ? ' — ' + k.uses + '.' : '.'}`);
    if (k.benefits && k.benefits[0]) parts.push(k.benefits[0] + '.');
    if (k.growth_maturity) parts.push(k.growth_maturity.replace(/^Catalog duration:\s*/i, 'Catalog duration: '));
    if (k.spacing) parts.push('Spacing: ' + k.spacing + '.');
    if (k.intercrops && k.intercrops[0]) parts.push('Intercrops: ' + k.intercrops[0] + '.');
    if (k.supporting_tree) parts.push('Support/host: ' + k.supporting_tree + '.');
    parts.push('Open the Species page for the full planting, care and harvest guide.');
    return parts.join(' ').replace(/\.\./g, '.').replace(/\s+/g, ' ');
  }

  function answer(question) {
    const text = norm(question);
    if (!text) return { a: 'Ask me about soil, trees, recommendations, the plantation calculator, layout and intercropping, reports or how the AI model works.', related: [] };

    if (/^(hi|hello|hey|namaste|good (morning|afternoon|evening))\b/.test(text) && text.split(' ').length <= 4) {
      return { a: 'Hello! I am the AranyaAI Plantation Assistant. Ask me about the AI model, soil types, species, the plantation calculator, mixed plantations and intercropping, or ask me directly.', related: [] };
    }
    if (/^(thanks|thank you|ok thanks|great|nice)\b/.test(text)) {
      return { a: 'You’re welcome! Ask me anything else about the project.', related: [] };
    }

    const soilA = soilAnswer(text);
    if (soilA && !/(intercrop|between|layout|calculator|report)/.test(text)) return { a: soilA, related: [byQ('Which trees suit each soil type?')].filter(Boolean) };

    const qt = toks(question);
    const scored = QA.map((e) => ({ e, s: scoreEntry(e, text, qt) })).sort((x, y) => y.s - x.s);
    const best = scored[0];
    const sp = findSpecies(text);

    // Species question ("tell me about mango") unless a project entry clearly wins
    if (sp && (!best || best.s < 8)) {
      const sa = speciesAnswer(sp);
      if (sa) return { a: sa, related: scored.slice(0, 2).filter((x) => x.s >= 3).map((x) => x.e) };
    }
    if (best && best.s >= 3) {
      return { a: best.e.a, related: scored.slice(1, 3).filter((x) => x.s >= 3).map((x) => x.e) };
    }
    if (sp) {
      const sa = speciesAnswer(sp);
      if (sa) return { a: sa, related: [] };
    }
    return {
      a: 'I could not find an exact answer to that. I can help with the AI model, soil types, species, the plantation calculator, mixed plantations, intercropping, reports and login. Try one of these:',
      related: [byQ('What is AranyaAI?'), byQ('How does the plantation calculator work?'), byQ('What is a mixed plantation and how is it laid out?')].filter(Boolean)
    };
  }

  /* ---------------------------------------------------------
     UI  (injected on every page)
     --------------------------------------------------------- */
  const HISTORY_KEY = 'aranyaChatHistory';
  const OPEN_KEY = 'aranyaChatOpen';
  const SUGGESTED = ['What is AranyaAI?', 'What inputs does the model need?', 'How does the plantation calculator work?', 'What is intercropping and how does the layout show it?'];  // quick chips

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }

  function build() {
    if (document.getElementById('chatbotPanel')) return; // already present

    const toggle = el('button', '', '');
    toggle.id = 'chatbotToggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Open AranyaAI plantation assistant');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML =
      '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M12 2C6.5 2 2 5.9 2 10.7c0 2.5 1.2 4.7 3.2 6.3L4.5 21l4.2-2.1c1 .3 2.1.4 3.3.4 5.5 0 10-3.9 10-8.6S17.5 2 12 2zm-4 9.7a1.3 1.3 0 110-2.6 1.3 1.3 0 010 2.6zm4 0a1.3 1.3 0 110-2.6 1.3 1.3 0 010 2.6zm4 0a1.3 1.3 0 110-2.6 1.3 1.3 0 010 2.6z"/></svg>' +
      '<span class="chatbot-toggle-label">Ask Aranya</span>';

    const panel = el('div', '');
    panel.id = 'chatbotPanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Plantation assistant');
    panel.innerHTML =
      '<div class="chatbot-header"><span class="chatbot-title"><span class="chatbot-leaf">🌿</span> Plantation Assistant</span>' +
      '<span class="chatbot-header-actions">' +
      '<button type="button" id="chatbotCloseBtn" aria-label="Close chatbot">✕</button></span></div>' +
      '<div class="chatbot-body" id="chatbotBody" aria-live="polite"></div>' +
      '<div class="chatbot-suggestions" id="chatbotSuggestions"></div>' +
      '<div class="chatbot-input-row"><input type="text" id="chatbotInput" placeholder="Ask about soil, trees, layout…" autocomplete="off" aria-label="Ask a question">' +
      '<button type="button" id="chatbotSendBtn" aria-label="Send"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg></button></div>';

    // Dashboard: the chatbot sits inline, directly under the Impact section.
    const host = document.getElementById('chatbotInline');
    if (host) {
      panel.classList.add('inline', 'open');
      host.appendChild(panel);
      return true;
    }
    // Other pages (Species): floating button + popup.
    document.body.appendChild(toggle);
    document.body.appendChild(panel);
    return true;
  }

  /* Shown from the Dashboard (the first page after login) and continues on
     the Species page. Both pages already require login, so the chatbot is
     never shown on the public Home / Login / Register pages. */
  var ALLOWED_PAGES = ['dashboard.html', 'catalog.html'];
  function isAllowedPage() {
    var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    return ALLOWED_PAGES.indexOf(file) !== -1;
  }
  function init() {
    if (!isAllowedPage()) {
      var existing = document.getElementById('chatbotToggle');
      if (existing) existing.remove();
      var existingPanel = document.getElementById('chatbotPanel');
      if (existingPanel) existingPanel.remove();
      return;
    }
    build();
    const toggle = document.getElementById('chatbotToggle');
    const panel = document.getElementById('chatbotPanel');
    const body = document.getElementById('chatbotBody');
    const input = document.getElementById('chatbotInput');
    const send = document.getElementById('chatbotSendBtn');
    const close = document.getElementById('chatbotCloseBtn');
    const allBtn = document.getElementById('chatbotAllBtn');
    if (allBtn) allBtn.style.display = 'none';
    const suggestions = document.getElementById('chatbotSuggestions');
    const inline = !!document.getElementById('chatbotInline');
    if ((!toggle && !inline) || !panel || !body || body.dataset.ready) return;
    body.dataset.ready = '1';

    let history = [];
    try { history = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || '[]'); } catch (e) { history = []; }
    const save = () => { try { sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-40))); } catch (e) {} };

    const scroll = () => { body.scrollTop = body.scrollHeight; };

    function addMsg(text, who, remember = true) {
      const div = el('div', 'chat-msg ' + who);
      div.textContent = text;
      body.appendChild(div);
      if (remember) { history.push({ t: text, w: who }); save(); }
      scroll();
      return div;
    }

    function addRelated(list) {
      if (!list || !list.length) return;
      const wrap = el('div', 'chat-related');
      wrap.appendChild(el('span', 'chat-related-label', 'Related:'));
      list.forEach((e) => {
        const b = el('button', 'chat-chip');
        b.type = 'button';
        b.textContent = e.q;
        b.addEventListener('click', () => ask(e.q));
        wrap.appendChild(b);
      });
      body.appendChild(wrap);
      scroll();
    }

    function ask(q) {
      const question = (q || '').trim();
      if (!question) return;
      addMsg(question, 'user');
      const res = answer(question);
      addMsg(res.a, 'bot');
      addRelated(res.related);
      if (input) input.value = '';
    }

    function showAll() {
      const wrap = el('div', 'chat-all');
      wrap.appendChild(el('div', 'chat-all-title', 'All ' + QA.length + ' project questions'));
      let group = '';
      QA.forEach((e) => {
        if (e.g !== group) { group = e.g; wrap.appendChild(el('div', 'chat-all-group', group)); }
        const b = el('button', 'chat-all-q');
        b.type = 'button';
        b.textContent = e.id + '. ' + e.q;
        b.addEventListener('click', () => { wrap.remove(); ask(e.q); });
        wrap.appendChild(b);
      });
      body.appendChild(wrap);
      scroll();
    }

    function setOpen(open) {
      panel.classList.toggle('open', open);
      if (toggle) {
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
      }
      if (!inline) { try { sessionStorage.setItem(OPEN_KEY, open ? '1' : '0'); } catch (e) {} }
      if (open) { scroll(); setTimeout(() => input && input.focus({ preventScroll: true }), 50); }
    }

    // restore history or greet
    if (history.length) {
      history.forEach((m) => addMsg(m.t, m.w, false));
    } else {
      addMsg('Hello! I am your Plantation Assistant. Ask me about the AI model, soil types, species, the plantation calculator, mixed plantations or intercropping. Ask me directly about your plantation and species-specific care.', 'bot');
    }

    SUGGESTED.forEach((text) => {
      const e = byQ(text);
      if (!e) return;
      const b = el('button', '');
      b.type = 'button';
      b.textContent = e.q.replace(/\?$/, '');
      b.title = e.q;
      b.addEventListener('click', () => ask(e.q));
      suggestions.appendChild(b);
    });

    if (toggle) toggle.addEventListener('click', () => setOpen(!panel.classList.contains('open')));
    close.addEventListener('click', () => setOpen(false));
    if (allBtn) allBtn.addEventListener('click', showAll);
    send.addEventListener('click', () => ask(input.value));
    input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') ask(input.value); });
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && panel.classList.contains('open')) setOpen(false); });

    let wasOpen = false;
    try { wasOpen = sessionStorage.getItem(OPEN_KEY) === '1'; } catch (e) {}
    if (wasOpen && !inline) setOpen(true);
  }

  // Public hooks (also used by tests and by script.js if it ever needs them)
  window.AranyaChatbot = { QA, answer, init };
  window.initChatbot = init;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
