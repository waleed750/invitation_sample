// Read-only legacy ESM fixtures are intentionally unknown at the validation boundary.
declare module '*video-open-invitation/data.js' {
  export const invitationData: unknown;
}
declare module '*lace-photo-scratch/data.js' {
  export const laceScratchData: unknown;
}
declare module '*registry/schema.js' {
  export const SECTION_TYPES: Readonly<Record<string, true>>;
}
