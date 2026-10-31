# Changes in this version

1. **Forgot password** – codes are sent by EMAIL only (no phone number is collected at registration, so no SMS).
   They were not arriving because email sending was not set up. Copy `backend/aranyai_backend/.env.example` to `.env`,
   fill the SMTP lines (Gmail App Password steps are inside), restart the backend, then run `python test_email.py you@gmail.com`.
   The reset page now says clearly when email is not set up.
2. **Dashboard is per user** – data is saved under each user's own id; a new user sees an empty dashboard with a "get started" message.
   Graph, trees, acres, revenue and species chips use only that user's AI-recommended + selected species.
3. **Spacing is recommended** – tree-to-tree / row-to-row spacing (feet) is filled in from the selected species (`js/spacing-guide.js`).
4. **Everything in feet** – inputs, results, species guides, care text, layout, report, chatbot. (Backend maths still runs in metres; the page converts.)
5. **Layout = AI-recommended species (★ AI) + the commercial species you pick.**
6. **Plot-size limit** – 1 species per 80 sq ft, min 1, max 8 (20 × 20 ft = 400 sq ft -> 5). Enforced in the page and in the backend.
