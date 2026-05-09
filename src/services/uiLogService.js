/**
 * Simple in-memory UI log service for debugging in the running app (dev only)
 */

let _logs = [];

export const pushLog = (text) => {
  try {
    const entry = { text: typeof text === 'string' ? text : JSON.stringify(text), time: new Date().toISOString() };
    _logs.push(entry);
    if (_logs.length > 100) _logs.shift();
    return entry;
  } catch (e) {
    return null;
  }
};

export const getLogs = () => _logs.slice();

export const clearLogs = () => {
  _logs = [];
};

export default { pushLog, getLogs, clearLogs };
