(function () {
  'use strict';

  var audio = document.getElementById('audio');
  if (!audio) return;

  var btnPlay = document.getElementById('btn-play');
  var iconPlay = document.getElementById('icon-play');
  var iconPause = document.getElementById('icon-pause');
  var progress = document.getElementById('progress');
  var fill = document.getElementById('progress-fill');
  var tCur = document.getElementById('time-current');
  var tDur = document.getElementById('time-duration');
  var volume = document.getElementById('volume');
  var btnMute = document.getElementById('btn-mute');
  var iconVol = document.getElementById('icon-vol');
  var iconMute = document.getElementById('icon-mute');
  var btnPrev = document.getElementById('btn-prev');
  var btnNext = document.getElementById('btn-next');
  var btnRepeat = document.getElementById('btn-repeat');
  var btnShuffle = document.getElementById('btn-shuffle');
  var btnLike = document.getElementById('btn-like');
  var cover = document.getElementById('player-cover');

  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    var s = Math.floor(sec % 60);
    var m = Math.floor(sec / 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function setPlaying(on) {
    if (iconPlay) iconPlay.hidden = on;
    if (iconPause) iconPause.hidden = !on;
    if (btnPlay) btnPlay.setAttribute('aria-label', on ? 'Pause' : 'Play');
    if (cover) cover.style.opacity = on ? '1' : '0.92';
  }

  function setProgress(ratio) {
    var r = Math.max(0, Math.min(1, ratio || 0));
    if (fill) fill.style.width = (r * 100).toFixed(3) + '%';
    if (progress) progress.setAttribute('aria-valuenow', String(Math.round(r * 100)));
  }

  function updateVolumeUI() {
    var v = audio.muted ? 0 : audio.volume;
    if (volume) {
      volume.style.setProperty('--vol', (v * 100).toFixed(1) + '%');
      volume.value = String(Math.round(v * 100));
    }
    var muted = audio.muted || audio.volume === 0;
    if (iconVol) iconVol.hidden = muted;
    if (iconMute) iconMute.hidden = !muted;
    if (btnMute) btnMute.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
  }

  function syncDuration() {
    if (tDur && audio.duration && isFinite(audio.duration)) {
      tDur.textContent = fmt(audio.duration);
    }
  }
  audio.addEventListener('loadedmetadata', syncDuration);
  audio.addEventListener('durationchange', syncDuration);
  audio.addEventListener('canplay', syncDuration);
  audio.addEventListener('loadeddata', syncDuration);
  audio.addEventListener('timeupdate', function () {
    if (!audio.duration) return;
    setProgress(audio.currentTime / audio.duration);
    if (tCur) tCur.textContent = fmt(audio.currentTime);
  });
  audio.addEventListener('ended', function () {
    if (audio.dataset.loop === '1') {
      audio.currentTime = 0;
      audio.play().catch(function () {});
    } else {
      setPlaying(false);
      setProgress(0);
      if (tCur) tCur.textContent = fmt(0);
    }
  });
  audio.addEventListener('play', function () { setPlaying(true); });
  audio.addEventListener('pause', function () { setPlaying(false); });

  if (btnPlay) {
    btnPlay.addEventListener('click', function () {
      if (audio.paused) audio.play().catch(function () {});
      else audio.pause();
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', function () {
      audio.currentTime = 0;
    });
  }
  if (btnNext) {
    btnNext.addEventListener('click', function () {
      if (audio.duration) audio.currentTime = audio.duration;
    });
  }

  if (btnRepeat) {
    btnRepeat.addEventListener('click', function () {
      var on = audio.dataset.loop === '1';
      audio.dataset.loop = on ? '0' : '1';
      btnRepeat.classList.toggle('active', !on);
      btnRepeat.setAttribute('aria-pressed', String(!on));
    });
  }

  if (btnShuffle) {
    btnShuffle.addEventListener('click', function () {
      var on = btnShuffle.classList.toggle('active');
      btnShuffle.setAttribute('aria-pressed', String(on));
    });
  }

  if (btnLike) {
    btnLike.addEventListener('click', function () {
      var on = btnLike.classList.toggle('liked');
      btnLike.setAttribute('aria-pressed', String(on));
    });
  }

  function seekFromEvent(e) {
    if (!audio.duration || !progress) return;
    var rect = progress.getBoundingClientRect();
    var clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    var ratio = (clientX - rect.left) / rect.width;
    ratio = Math.max(0, Math.min(1, ratio));
    audio.currentTime = ratio * audio.duration;
    setProgress(ratio);
  }

  if (progress) {
    var dragging = false;
    progress.addEventListener('pointerdown', function (e) {
      dragging = true;
      try { progress.setPointerCapture(e.pointerId); } catch (err) {}
      seekFromEvent(e);
    });
    progress.addEventListener('pointermove', function (e) {
      if (dragging) seekFromEvent(e);
    });
    progress.addEventListener('pointerup', function () { dragging = false; });
    progress.addEventListener('pointercancel', function () { dragging = false; });
    progress.addEventListener('click', seekFromEvent);
    progress.addEventListener('keydown', function (e) {
      if (!audio.duration) return;
      var step = e.shiftKey ? 5 : 1;
      if (e.key === 'ArrowRight' || e.key === 'Right') {
        audio.currentTime = Math.min(audio.duration, audio.currentTime + step);
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
        audio.currentTime = Math.max(0, audio.currentTime - step);
        e.preventDefault();
      }
    });
  }

  if (volume) {
    volume.addEventListener('input', function () {
      audio.muted = false;
      audio.volume = Number(volume.value) / 100;
      updateVolumeUI();
    });
  }
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.muted = !audio.muted;
      updateVolumeUI();
    });
  }

  // default: 80% volume, no autoplay
  audio.volume = 0.8;
  audio.muted = false;
  audio.dataset.loop = '0';
  setPlaying(false);
  setProgress(0);
  updateVolumeUI();
})();
