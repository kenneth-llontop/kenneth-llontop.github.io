// Bucket list: progress bar and count.
(function () {
  var goals = document.querySelectorAll('.bucket-grid .goal');
  if (!goals.length) return;
  var done = document.querySelectorAll('.bucket-grid .goal.done').length;
  var total = goals.length;

  var q = function (sel) { return document.querySelector(sel); };
  q('.bp-done').textContent = done;
  q('.bp-total').textContent = total;
  var bar = q('.bp-bar');
  bar.setAttribute('aria-valuemax', total);
  bar.setAttribute('aria-valuenow', done);
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { bar.firstElementChild.style.width = (done / total * 100) + '%'; });
  });

})();
