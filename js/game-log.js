export function addLog(state, msg, type = 'info') {
  if (!state.log) state.log = [];
  state.log.unshift({ msg, type, t: Date.now() });
  if (state.log.length > 100) state.log.length = 100;
}
