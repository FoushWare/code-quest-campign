import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return (
    <div style={{padding:20,fontFamily:'Inter, sans-serif'}}>
      <h1>Code Quest — Web Shell</h1>
      <p>Welcome — this is the minimal starter shell.</p>
    </div>
  );
}

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(<App />);
}
