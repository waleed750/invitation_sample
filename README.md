# Abdelrahman & Nourhan Invitation

Editable React/Vite invitation template lab for Abdelrahman and Nourhan.

The app now contains separate testable invitation websites. Each template lives
in its own folder under `src/sites/`.

## Test URLs

```text
http://localhost:5173/
http://localhost:5173/video-open-invitation/
http://localhost:5173/lace-photo-scratch/
```

## Implemented Templates

### Video Open Invitation

Folder:

```text
src/sites/video-open-invitation/
```

Flow:

```text
poster/photo -> tap to open -> intro video + audio -> fade into invitation -> scrollable sections
```

- Full-screen poster/open state using `/public/assets/media/intro-poster-new.jpg`
- Tap-to-open intro video using `/public/assets/media/intro-video-new.mp4`
- Background music using `/public/assets/media/background-music.mp3`
- Fade transition from intro into the invitation
- Hero section with looping local video
- Countdown section
- Welcome section
- Order of the day section
- Venue/details section
- Embedded map section
- Local preview message form

### Lace Photo Scratch

Folder:

```text
src/sites/lace-photo-scratch/
```

Flow:

```text
lace cover -> tap to open -> scratch card -> save-the-date reveal
```

- Full-screen lace/wax-seal opening state
- Separate save-the-date category
- Scratch-to-reveal interaction for mouse and touch
- Background music toggle
- Single-screen minimal layout

## How It Is Made

This project was originally a scraped static export. It has now been converted
into an editable Vite + React app while reusing the existing local assets.

The important editable files are:

- `src/main.jsx` - searchable gallery and simple route picker for the template test URLs
- `src/app.css` - gallery styling
- `src/sites/video-open-invitation/data.js` - content and assets for the full invitation
- `src/sites/video-open-invitation/VideoOpenInvitation.jsx` - full invitation components
- `src/sites/video-open-invitation/styles.css` - full invitation styling
- `src/sites/lace-photo-scratch/data.js` - content and assets for the scratch template
- `src/sites/lace-photo-scratch/LacePhotoScratch.jsx` - scratch template components
- `src/sites/lace-photo-scratch/styles.css` - scratch template styling
- `public/assets/` - active media and image assets used by the templates
- `public/fonts/` - active local fonts
- `public/maps/` - active local map embed
- `index.html` - Vite entry point and page metadata

Each template folder exports its own `siteMeta` object from `data.js`. The root
gallery uses that metadata for category filters, search, cards, status labels,
and test links.

## Run Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Then open the local URL printed in the terminal.

## Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Deploy To Vercel

This project is ready for Vercel as a Vite app.

Recommended Vercel settings:

- Framework preset: `Vite`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`

## Next Platform Step

The next step is to split this first invitation into a template registry:

- `templateTypes`
- reusable section schemas
- intro presets such as `video-open` and `scratch-reveal`
- editable admin data later
