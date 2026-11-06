// FC Barcelona live score / last result / next match, from ESPN's public API (no key needed).
(function () {
  var section = document.getElementById('barca');
  if (!section) return;

  var TEAM_ID = '83'; // FC Barcelona on ESPN
  var BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams/' + TEAM_ID + '/schedule';
  var ESPN_PAGE = 'https://www.espn.com/soccer/team/_/id/' + TEAM_ID + '/barcelona';
  var timer = null;

  function getJSON(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function scoreOf(c) {
    var s = c.score;
    if (s == null) return '';
    return typeof s === 'object' ? (s.displayValue != null ? s.displayValue : s.value) : s;
  }

  function logoOf(t) {
    return (t.logos && t.logos[0] && t.logos[0].href) || t.logo || '';
  }

  function stateOf(e) { return e.competitions[0].status.type.state; } // 'pre' | 'in' | 'post'

  function whenText(e) {
    var d = new Date(e.date);
    if (e.timeValid === false) {
      return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + ' · time TBD';
    }
    return d.toLocaleString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
    });
  }

  function render(slot, label, e, opts) {
    var box = section.querySelector('[data-slot="' + slot + '"]');
    box.textContent = '';
    var head = el('p', 'match-label');
    if (opts.live) head.appendChild(el('span', 'live-dot'));
    head.appendChild(document.createTextNode(label));
    box.appendChild(head);

    if (!e) {
      var none = el('p', 'match-meta');
      none.textContent = opts.empty || 'Nothing scheduled right now.';
      box.appendChild(none);
      return;
    }

    var comp = e.competitions[0];
    var league = (e.league && (e.league.shortName || e.league.name)) || '';
    box.appendChild(el('p', 'match-comp', league));

    var teams = comp.competitors.slice().sort(function (a, b) {
      return (a.homeAway === 'home' ? 0 : 1) - (b.homeAway === 'home' ? 0 : 1);
    });
    var barca = null;
    teams.forEach(function (c) {
      var isBarca = String(c.team.id) === TEAM_ID;
      if (isBarca) barca = c;
      var row = el('div', 'team' + (isBarca ? ' is-barca' : ''));
      if (opts.showScore && stateOf(e) === 'post' && c.winner === false && teams.some(function (o) { return o.winner; })) {
        row.className += ' lost';
      }
      var img = el('img'); img.alt = ''; img.loading = 'lazy'; img.src = logoOf(c.team);
      row.appendChild(img);
      row.appendChild(el('span', 'team-name', c.team.shortDisplayName || c.team.displayName));
      row.appendChild(el('span', 'team-score', opts.showScore ? scoreOf(c) : ''));
      box.appendChild(row);
    });

    var meta = el('p', 'match-meta');
    if (opts.live) {
      meta.textContent = comp.status.type.shortDetail || 'In progress';
    } else if (opts.showScore) {
      if (barca) {
        var other = teams.filter(function (c) { return c !== barca; })[0];
        var res = barca.winner ? 'w' : (other && other.winner ? 'l' : 'd');
        var badge = el('span', 'badge ' + res, { w: 'WIN', l: 'LOSS', d: 'DRAW' }[res]);
        meta.appendChild(badge);
        meta.appendChild(document.createTextNode(' '));
      }
      meta.appendChild(document.createTextNode(
        new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
        (comp.status.type.shortDetail && comp.status.type.shortDetail !== 'FT' ? ' · ' + comp.status.type.shortDetail : '')));
    } else {
      meta.textContent = whenText(e) + (comp.venue && comp.venue.fullName ? ' · ' + comp.venue.fullName : '');
    }
    box.appendChild(meta);
  }

  function fail() {
    ['last', 'next'].forEach(function (slot) {
      var box = section.querySelector('[data-slot="' + slot + '"]');
      var msg = box.querySelector('.match-meta') || box.appendChild(el('p', 'match-meta'));
      msg.textContent = '';
      msg.appendChild(document.createTextNode('Couldn’t load scores right now. '));
      var a = el('a', null, 'See ESPN'); a.href = ESPN_PAGE; a.target = '_blank'; a.rel = 'noopener';
      msg.appendChild(a);
    });
  }

  function load() {
    Promise.all([getJSON(BASE), getJSON(BASE + '?fixture=true')]).then(function (res) {
      var seen = {}, all = [];
      res.forEach(function (d) {
        (d.events || []).forEach(function (e) { if (!seen[e.id]) { seen[e.id] = 1; all.push(e); } });
      });
      all.sort(function (a, b) { return new Date(a.date) - new Date(b.date); });

      var live = all.filter(function (e) { return stateOf(e) === 'in'; })[0];
      var past = all.filter(function (e) { return stateOf(e) === 'post'; });
      var next = all.filter(function (e) { return stateOf(e) === 'pre' && new Date(e.date) > Date.now() - 3 * 3600e3; })[0];

      if (live) render('last', 'Live now', live, { live: true, showScore: true });
      else render('last', 'Last result', past[past.length - 1], { showScore: true, empty: 'No recent results.' });
      render('next', 'Next match', next, { showScore: false });

      clearTimeout(timer);
      timer = setTimeout(load, live ? 60e3 : 10 * 60e3); // every minute during a game, else every 10 min
    }).catch(fail);
  }

  load();
})();
