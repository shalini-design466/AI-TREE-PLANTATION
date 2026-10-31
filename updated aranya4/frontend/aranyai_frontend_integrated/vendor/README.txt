OPTIONAL - run the site fully offline
=====================================
The pages already work online. To make the charts and icons work with NO internet,
download these files once and put them here (the pages use them automatically and
fall back to the internet copies if they are missing):

1. Chart.js
   Open https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js
   Save the file as:  vendor/chart.umd.min.js

2. Font Awesome 6.0.0-beta3 (icons)
   Open https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css
   Save as:  vendor/fontawesome/css/all.min.css
   Also save the icon font files into  vendor/fontawesome/webfonts/  :
   fa-solid-900.woff2, fa-regular-400.woff2, fa-brands-400.woff2
   (same cdnjs address, but ending in /webfonts/<file name>)

After copying, press Ctrl + F5 in the browser.
