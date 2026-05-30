// Minimal web shell stub using UMD React (for local dev without bundler)
(function () {
  const e = React.createElement;

  function App() {
    return e(
      'div',
      { style: { padding: 20, fontFamily: 'Inter, sans-serif' } },
      e('h1', null, 'Code Quest — Web Shell'),
      e('p', null, 'Welcome — this is the minimal starter shell.')
    );
  }

  const root = document.getElementById('root');
  if (root && ReactDOM && React) {
    ReactDOM.createRoot(root).render(e(App));
  }
})();
