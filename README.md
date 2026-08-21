# Notion Countdown

A configurable countdown and duration timer that can be embedded in a Notion page.

## Use it in Notion

1. Publish these files on a static host such as GitHub Pages, Netlify, or Vercel. The public URL must use HTTPS.
2. Copy the deployed URL for `index.html`.
3. In Notion, type `/embed`, paste the URL, and choose **Embed**.

The widget works inside an iframe and saves its event name, target, mode, and timer state in the browser's `localStorage`. Configuration is saved separately for each deployed URL and browser profile.

## Configure

- **Target date** counts down to a future local date and time.
- **Duration timer** supports a custom number of minutes or a preset.
- **Pause** freezes a duration timer; **Reset** clears the current configuration.
- Add and switch between multiple saved countdowns from the countdown menu.
- Choose light or dark mode, custom accent/background colors, and full or clock-style displays.
- Enable a completion sound and request browser notifications for finished timers.

No build step or server-side storage is required. Open `index.html` locally for development, or deploy the repository as a static site.
