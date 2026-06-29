<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/b092aaaf-73ac-44da-bb90-e9306fe6964b

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Admin bootstrap

The first administrator must be created manually or with the secure seed script.

Set these environment variables before running `npm run seed:admin` or starting the app:

- `FIXDIT_ADMIN_NAME`
- `FIXDIT_ADMIN_EMAIL`
- `FIXDIT_ADMIN_PASSWORD`
- `FIXDIT_ADMIN_USERNAME` (optional)
