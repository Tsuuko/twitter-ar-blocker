import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

chrome.devtools.panels.create(
  'tetete', // 名前
  '', // アイコン
  '/src/devtools/index.html'
  // () => {} // callback
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
