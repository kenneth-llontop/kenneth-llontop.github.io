// Light / dark toggle (the initial theme is set inline in each page's <head>).
(function () {
  var root = document.documentElement, btn = document.querySelector('.theme-toggle');
  function sync() {
    var dark = root.getAttribute('data-theme') === 'dark';
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  btn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    sync();
  });
  sync();
})();
