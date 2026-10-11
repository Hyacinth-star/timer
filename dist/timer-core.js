export const DURATIONS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };

export function formatTime(seconds) {
  const value = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

export function nextMode(mode, completedFocusSessions) {
  if (mode === 'focus') return completedFocusSessions % 4 === 0 ? 'long' : 'short';
  return 'focus';
}

export function progressFor(remaining, duration) {
  return Math.max(0, Math.min(1, 1 - remaining / duration));
}
