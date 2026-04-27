const splitTrackIds = (value) =>
  String(value ?? "")
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);

export const dedupeTrackIds = (trackIds = []) => [
  ...new Set(trackIds.map((trackId) => String(trackId ?? "").trim()).filter(Boolean)),
];

export const CONFIGURED_TRACK_IDS = dedupeTrackIds([
  ...splitTrackIds(import.meta.env.VITE_TRACK_QUEUE_IDS),
  ...splitTrackIds(import.meta.env.VITE_TRACK_IDS),
  import.meta.env.VITE_TRACK_ID,
]);

export const buildTrackQueueIds = (...groups) =>
  dedupeTrackIds(groups.flat().filter(Boolean));
