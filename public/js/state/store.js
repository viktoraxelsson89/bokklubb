// store.js - Central state management med säkerhetsfunktioner

const state = {
  books: [],
  currentUser: null,
  photos: []
};

const listeners = [];
let scheduled = false;

// Batched notify - förhindrar render-stormar
function notify() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    listeners.forEach(fn => fn(state));
  });
}

export const store = {
  getState: () => state,
  
  setState: (patch) => {
    Object.assign(state, patch);
    notify();
  },
  
  // Safe unsubscribe - förhindrar buggar vid cleanup
  subscribe: (fn) => {
    listeners.push(fn);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  }
};


