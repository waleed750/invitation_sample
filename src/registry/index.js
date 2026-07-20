import { siteMeta as videoOpenMeta } from "../sites/video-open-invitation/data.js";
import { siteMeta as laceScratchMeta } from "../sites/lace-photo-scratch/data.js";
import { siteMeta as africaMeta } from "../sites/africa/data.js";
import { siteMeta as bohoMeta } from "../sites/boho/data.js";
import { siteMeta as aventurerosMeta } from "../sites/aventureros/data.js";

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
  {
    meta: africaMeta,
    loadComponent: () =>
      import("../sites/africa/AfricaInvitation.jsx").then(
        (m) => m.AfricaInvitation,
      ),
  },
  {
    meta: bohoMeta,
    loadComponent: () =>
      import("../sites/boho/BohoInvitation.jsx").then(
        (m) => m.BohoInvitation,
      ),
  },
  {
    meta: aventurerosMeta,
    loadComponent: () =>
      import("../sites/aventureros/AventurerosInvitation.jsx").then(
        (m) => m.AventurerosInvitation,
      ),
  },
];

export default templates;
