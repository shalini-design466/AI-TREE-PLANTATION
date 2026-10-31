/* ============================================================
   Real soil-type photos (verified Wikimedia Commons files,
   not guessed filenames) -- add this block to js/script.js
   ============================================================ */
const SOIL_PHOTOS = {
    loamy: {
        url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sandy%20loam.JPG?width=500',
        name: 'Loamy Soil',
        desc: 'Crumbly, dark, holds moisture well — a balanced mix of sand, silt and clay.'
    },
    clay: {
        url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Nc-red-clay-soil-1.jpg?width=500',
        name: 'Clay Soil',
        desc: 'Sticky when wet, cracks when dry — fine particles, high water retention.'
    },
    sandy: {
        url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sandy%20soil%20-%20geograph.org.uk%20-%201214933.jpg?width=500',
        name: 'Sandy Soil',
        desc: 'Dry, gritty, drains fast — coarse particles, low nutrient retention.'
    },
    laterite: {
        url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Red%20lateritic%20soil%20in%20the%20mountains%20of%20Guam%20(line378776781).jpg?width=500',
        name: 'Laterite Soil',
        desc: 'Reddish, iron-rich, common in tropical regions with heavy rainfall.'
    }
};

function updateSoilPreview() {
    const soilSelect = document.getElementById('soilSelect');
    const img = document.getElementById('soilPreviewImg');
    const nameEl = document.getElementById('soilPreviewName');
    const descEl = document.getElementById('soilPreviewDesc');
    if (!soilSelect || !img) return;

    const soil = SOIL_PHOTOS[soilSelect.value];
    if (!soil) {
        img.removeAttribute('src');
        img.style.display = 'none';
        if (nameEl) nameEl.textContent = 'No soil selected';
        if (descEl) descEl.textContent = 'Select a soil type above to see a natural photo reference here.';
        return;
    }
    img.src = soil.url;
    img.dataset.soilName = soil.name;
    img.style.display = 'block';
    if (nameEl) nameEl.textContent = soil.name;
    if (descEl) descEl.textContent = soil.desc;
}

document.addEventListener('DOMContentLoaded', () => {
    const soilSelect = document.getElementById('soilSelect');
    if (soilSelect) {
        soilSelect.addEventListener('change', updateSoilPreview);
        updateSoilPreview(); // set initial state
    }
});
