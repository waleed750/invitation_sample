# Riwaq: prompts for the owner's own media (paste into ChatGPT or any generator)

Rules: use ONLY these text prompts. Never upload or reference the old demo files or screenshots as inspiration. Keep the raw outputs and note the tool, plan and date (needed for the licence record; for video and music confirm the plan allows commercial use).

Prepend to every image or video prompt:
"Painterly watercolor illustration, soft sage green and warm ivory palette, delicate gold hairline accents, white garden roses and eucalyptus, gentle candlelight glow, airy and romantic, fine paper texture, no people, no faces, no text, no letters, no logos, no watermark."

Drop the files into apps/web/public/assets/demo/riwaq/ under these names (same names replace the placeholders):

1. intro-poster.jpg, 1080x1920, <=200 KB: tall ivory stone archway between two classical columns, heavy sage-green velvet curtains fully closed, tied with a thin gold cord, rose and eucalyptus garlands over the arch, warm candle glow leaking through the curtain gap, centered and symmetrical.
2. intro-video.mp4, 1080x1920, 4-5 s, plays ONCE, no audio, <=1.5 MB: starts on the closed curtains inside the arch, they part slowly to both sides revealing a candlelit rose-garden aisle, ends holding on the open arch, slow push-in, no cuts, no text, no people. Last frame close to the hero poster.
3. hero-video.mp4, 1080x1920 (or 720x1280), 6-8 s, SEAMLESS LOOP (first and last frame identical), no audio, <=2.5 MB: static view through an open ivory arch with sage curtains tied back, tall candles flicker, a few white petals drift down, eucalyptus sways, empty calm area in the upper-middle third, no camera movement, no text, no people.
4. hero-poster.jpg: the first frame of the hero video (1080x1920, <=200 KB).
5. background-music.mp3, 60-90 s seamless loop, 128 kbps, <=1.5 MB: original instrumental wedding track, soft string quartet with gentle piano and a delicate oud melody, slow ~70 BPM, no vocals, no percussion hits, no sudden swells.
6. column.png, transparent, about 500x1800: a single tall classical ivory fluted column entwined with white roses and eucalyptus and thin gold details, isolated, full height.
7. event-welcome.png, transparent, 1000x1000: a garden terrace pavilion at dusk with hanging glass lanterns and a candlelit table, vignette fading to transparent.
8. event-venue.png, transparent, 1000x1000: an ivory palace facade with tall arched windows, rose bushes and cypress at the entrance, evening candlelight, vignette fading to transparent.
9. candles.jpg, 1080x1350: a cluster of tall ivory taper candles in slim gold holders with white roses and eucalyptus on soft ivory, lots of empty space in the centre.

After the files are in: set the flags at the top of apps/web/src/templates/riwaq/data.ts (MEDIA_READY) to true, update the licence entries (tool, plan, date), then flip the template from draft to live only if every file above is a real generated file.
