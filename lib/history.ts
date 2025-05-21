const addToHistory = (key: string, data: string, index: number) => {
  const prev = localStorage.getItem(key);
  const history = prev ? JSON.parse(prev) : [];
  const newHistory = history.slice(0, index + 1);
  newHistory.push(data);
  localStorage.setItem(key, JSON.stringify(newHistory));
};

const getFromHistory = (key: string, index: number) => {
  const history = JSON.parse(localStorage.getItem(key) || '[]');
  if (history) {
    if (index > history.length) return;
    return history[index];
  }
};

const getHistoryLength = (key: string) => {
  const history = JSON.parse(localStorage.getItem(key) || '[]');
  return history.length;
};

const getFirstVersion = (key: string) => {
  const history = JSON.parse(localStorage.getItem(key) || '[]');
  return history[0];
};

const getLastVersion = (key: string) => {
  const history = JSON.parse(localStorage.getItem(key) || '[]');
  return history[history.length - 1];
};

const removeFromHistory = (key: string) => {
  localStorage.removeHistory(key);
};

const initHistory = () => {
  localStorage.clear();
};

export {
  addToHistory,
  getFromHistory,
  removeFromHistory,
  initHistory,
  getHistoryLength,
  getFirstVersion,
  getLastVersion,
};
