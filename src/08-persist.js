/* ========================= 08 PERSISTENCE ========================= *
 * Versioned saves + append-only migrations (S1-D026). A player's
 * world is never destroyed on upgrade (Q12): migrations only add
 * fields; unknown kinds are carried forward verbatim and self-heal
 * at render time (seal fallback, C3). The raw pre-migration payload
 * is copied once to a backup key before the first v2 write.
 * ================================================================== */
// Append-only: never edit an existing entry, only add the next version step.
const MIGRATIONS = {
  1: d => ({
    version: 2,
    els: (d.els || []).map(e => ({ ...e, cls: e.cls !== undefined ? e.cls : classOfKind(e.k) })),
  }),
};
function migrateSave(raw) {
  let d = JSON.parse(raw);
  let from = d.version || 1;
  let migrated = false;
  while (from < SAVE_VERSION) {
    if (!MIGRATIONS[from]) throw new Error('no migration from save v' + from);
    d = MIGRATIONS[from](d);
    from = d.version;
    migrated = true;
  }
  if (from > SAVE_VERSION) throw new Error('save from a future build (v' + from + ')');
  return { d, migrated };
}
function initWorld() {
  if (QUERY.get('reset')) { try { localStorage.removeItem(WORLD_KEY); } catch (e) {} }
  try {
    const raw = localStorage.getItem(WORLD_KEY);
    if (raw) {
      const { d, migrated } = migrateSave(raw);
      if (migrated) {
        try { if (!localStorage.getItem(WORLD_BACKUP_KEY)) localStorage.setItem(WORLD_BACKUP_KEY, raw); } catch (e) {}
      }
      state.world.els = d.els || [];
    }
  } catch (e) { console.warn('[S1] world load failed, starting fresh:', e.message); }
  for (const el of state.world.els) el.born = 0;
  METRICS.world.elements = state.world.els.length;
}
function saveWorld() {
  try {
    localStorage.setItem(WORLD_KEY, JSON.stringify({
      version: SAVE_VERSION,
      els: state.world.els.map(({ k, x, y, s, seed, cls, ch, p }) => ({ k, x, y, s, seed, cls, ch, p })),
    }));
  } catch (e) {}
}
