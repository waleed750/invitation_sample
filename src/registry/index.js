import { siteMeta as videoOpenMeta } from "../sites/video-open-invitation/data.js";
import { siteMeta as laceScratchMeta } from "../sites/lace-photo-scratch/data.js";

/**
 * Central template registry.
 *
 * Each entry = { meta, loadComponent }.
 * `meta` is the siteMeta object from the template's data.js (sync — used by gallery).
 * `loadComponent` returns a Promise resolving to the root React component
 * (lazy — used by routes, each template becomes its own chunk).
 */

const templates = [
  {
    meta: videoOpenMeta,
    loadComponent: () =>
      import("../sites/video-open-invitation/VideoOpenInvitation.jsx").then(
        (m) => m.VideoOpenInvitation,
      ),
  },
  {
    meta: laceScratchMeta,
    loadComponent: () =>
      import("../sites/lace-photo-scratch/LacePhotoScratch.jsx").then(
        (m) => m.LacePhotoScratch,
      ),
  },
];

export default templates;
