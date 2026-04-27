import { CONFIGURED_TRACK_IDS, buildTrackQueueIds } from "../config/trackCatalog";
import { getTrack } from "./api";

const formatRelativeDateLabel = (value) => {
  if (!value) return "Recently";

  const targetDate = new Date(value);
  if (Number.isNaN(targetDate.getTime())) return "Recently";

  const differenceInSeconds = Math.round(
    (targetDate.getTime() - Date.now()) / 1000,
  );
  const absoluteSeconds = Math.abs(differenceInSeconds);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absoluteSeconds < 60) {
    return formatter.format(differenceInSeconds, "second");
  }

  const differenceInMinutes = Math.round(differenceInSeconds / 60);
  if (Math.abs(differenceInMinutes) < 60) {
    return formatter.format(differenceInMinutes, "minute");
  }

  const differenceInHours = Math.round(differenceInMinutes / 60);
  if (Math.abs(differenceInHours) < 24) {
    return formatter.format(differenceInHours, "hour");
  }

  const differenceInDays = Math.round(differenceInHours / 24);
  if (Math.abs(differenceInDays) < 30) {
    return formatter.format(differenceInDays, "day");
  }

  const differenceInMonths = Math.round(differenceInDays / 30);
  if (Math.abs(differenceInMonths) < 12) {
    return formatter.format(differenceInMonths, "month");
  }

  return formatter.format(Math.round(differenceInDays / 365), "year");
};

export const loadTracksByIds = async (trackIds = CONFIGURED_TRACK_IDS) => {
  const resolvedTrackIds = buildTrackQueueIds(trackIds);
  const results = await Promise.allSettled(
    resolvedTrackIds.map((trackId) => getTrack(trackId)),
  );

  return results
    .map((result, index) =>
      result.status === "fulfilled"
        ? result.value
        : {
            id: resolvedTrackIds[index],
            title: "Unavailable track",
            artist: "Unknown artist",
            cover: "",
            duration: 0,
            playCount: 0,
            likeCount: 0,
            repostCount: 0,
            commentCount: 0,
            audioUrl: "",
            playbackState: "Blocked",
            previewDurationSeconds: 0,
            postedAt: "",
            viewerHasLiked: false,
            viewerHasReposted: false,
          },
    )
    .filter((track) => track?.id);
};

export const adaptTrackToRow = (track, overrides = {}) => ({
  trackId: track.id,
  title: track.title ?? "Untitled track",
  artist: {
    id: `${track.id}-artist`,
    name: track.artist ?? "Unknown artist",
    avatarUrl: track.artistAvatar ?? track.cover ?? "",
  },
  plays: Number(track.playCount ?? 0),
  likes: Number(track.likeCount ?? 0),
  reposts: Number(track.repostCount ?? 0),
  comments: Number(track.commentCount ?? 0),
  coverArt: track.cover ?? "",
  audioUrl: track.audioUrl ?? "",
  playbackState: track.playbackState ?? "Playable",
  previewDurationSeconds: Number(track.previewDurationSeconds ?? 0),
  durationSeconds: Number(track.duration ?? 0),
  uploadedAt: formatRelativeDateLabel(track.postedAt),
  viewerHasLiked: Boolean(track.viewerHasLiked),
  viewerHasReposted: Boolean(track.viewerHasReposted),
  rank: overrides.rank,
});

export const adaptTrackToCard = (track) => ({
  id: track.id,
  title: track.title ?? "Untitled track",
  artistName: track.artist ?? "Unknown artist",
  coverUrl: track.cover ?? "",
  playCount: Number(track.playCount ?? 0),
  likeCount: Number(track.likeCount ?? 0),
  repostCount: Number(track.repostCount ?? 0),
  commentCount: Number(track.commentCount ?? 0),
  audioUrl: track.audioUrl ?? "",
  playbackState: track.playbackState ?? "Playable",
  previewDurationSeconds: Number(track.previewDurationSeconds ?? 0),
  durationSeconds: Number(track.duration ?? 0),
  viewerHasLiked: Boolean(track.viewerHasLiked),
  viewerHasReposted: Boolean(track.viewerHasReposted),
});

export const loadConfiguredTrackRows = async (
  trackIds = CONFIGURED_TRACK_IDS,
) => {
  const tracks = await loadTracksByIds(trackIds);
  return tracks.map((track) => adaptTrackToRow(track));
};
