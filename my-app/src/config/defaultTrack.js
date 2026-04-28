const useMock =
  String(
    import.meta.env.VITE_USE_MOCKS ??
      import.meta.env.VITE_USE_MOCK_API ??
      import.meta.env.VITE_USE_MOCK ??
      'false',
  ).toLowerCase() === 'true'

export const DEFAULT_TRACK_ID =
  import.meta.env.VITE_TRACK_ID || (useMock ? 'trk-2026-014' : '')

export const HAS_DEFAULT_TRACK_ID = Boolean(DEFAULT_TRACK_ID)
