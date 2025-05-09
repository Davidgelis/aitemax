
/* All session-related constants live here so QA/Prod can tune without code edits */
export const SESSION_CFG = {
  REFRESH_INTERVAL:       30 * 60 * 1000,   // 30 min
  INACTIVITY_TIMEOUT:      4 * 60 * 60 * 1000, // 4 h
  WARNING_BEFORE_EXPIRE:  30 * 60 * 1000,   // 30 min
  MAX_REFRESH_RETRIES:    3,
  REFRESH_DEBOUNCE:       2000,
};
