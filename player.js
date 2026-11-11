(function () {
  'use strict';

  var audio = document.getElementById('audio');
  var btnPlay = document.getElementById('btn-play');
  var iconPlay = document.getElementById('icon-play');
  var iconPause = document.getElementById('icon-pause');
  var progress = document.getElementById('progress');
  var fill = document.getElementById('progress-fill');
  var knob = document.getElementById('progress-knob');
  var tCur = document.getElementById('time-current');
  var tDur = document.getElementById('time-duration');
  var volume = document.getElementById('volume');
  var btnMute = document.getElementById('btn-mute');
  var iconVol = document.getElementById('icon-vol');
  var iconMute = document.getElementById('icon-mute');
  var cover = document.getElementById('player-cover');
  var btnRepeat = document.getElementById('btn-repeat');

  if (!audio) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    var s = Math.floor(sec % 60);
    var m = Math.floor(sec / 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function setPlaying(on) {
    iconPlay.hidden = on;
    iconPause.hidden = !on;
    btnPlay.setAttribute('aria-label', on ? 'Pause' : 'Play');
    if (cover) cover.classList.toggle('playing', on);
  }

  function setProgress(ratio) {
    var r = Math.max(0, Math.min(1, ratio));
    fill.style.width = (r * 100).toFixed(3) + '%';
    knob.style.left = (r * 100).toFixed(3) + '%';
    progress.setAttribute('aria-valuenow', String(Math.round(r * 100)));
  }

  function updateVolumeUI() {
    var v = audio.muted ? 0 : audio.volume;
    volume.style.setProperty('--vol', (v * 100).toFixed(1) + '%');
    volume.value = String(Math.round(v * 100));
    var muted = audio.muted || audio.volume === 0;
    iconVol.hidden = muted;
    iconMute.hidden = !muted;
    btnMute.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
  }

  // no autoplay — hanya sinkron UI saat metadata siap
  audio.addEventListener('loadedmetadata', function () {
    tDur.textContent = fmt(audio.duration);
  });
  audio.addEventListener('timeupdate', function () {
    if (!audio.duration) return;
    setProgress(audio.currentTime / audio.duration);
    tCur.textContent = fmt(audio.currentTime);
  });
  audio.addEventListener('ended', function () {
    if (audio.dataset.loop === '1') {
      audio.currentTime = 0;
      audio.play();
    } else {
      setPlaying(false);
      setProgress(0);
      tCur.textContent = fmt(0);
    }
  });
  audio.addEventListener('play', function () { setPlaying(true); });
  audio.addEventListener('pause', function () { setPlaying(false); });

  btnPlay.addEventListener('click', function () {
    if (audio.paused) audio.play().catch(function () {});
    else audio.pause();
  });

  btnRepeat.addEventListener('click', function () {
    var on = audio.dataset.loop === '1';
    audio.dataset.loop = on ? '0' : '1';
    btnRepeat.classList.toggle('active', !on);
    btnRepeat.setAttribute('aria-pressed', String(!on));
  });

  // seek: klik + drag di progress bar
  function seekFromEvent(e) {
    var rect = progress.getBoundingClientRect();
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var ratio = (clientX - rect.left) / rect.width;
    if (audio.duration) {
      audio.currentTime = Math.max(0, Math.min(1, ratio)) * audio.duration;
      setProgress(ratio);
    }
  }
  var dragging = false;
  progress.addEventListener('pointerdown', function (e) {
    dragging = true;
    progress.setPointerCapture(e.pointerId);
    seekFromEvent(e);
  });
  progress.addEventListener('pointermove', function (e) {
    if (dragging) seekFromEvent(e);
  });
  progress.addEventListener('pointerup', function () { dragging = false; });
  progress.addEventListener('pointercancel', function () { dragging = false; });
  progress.addEventListener('click', seekFromEvent);

  // volume
  volume.addEventListener('input', function () {
    audio.muted = false;
    audio.volume = Number(volume.value) / 100;
    updateVolumeUI();
  });
  btnMute.addEventListener('click', function () {
    audio.muted = !audio.muted;
    updateVolumeUI();
  });

  // default volume 80%, muted=false, paused (tanpa autoplay)
  audio.volume = 0.8;
  audio.muted = false;
  audio.dataset.loop = '0';
  setPlaying(false);
  setProgress(0);
  updateVolumeUI();

  if (reduced) {
    document.querySelectorAll('.fade-in').forEach(function (el) {
      el.style.animation = 'none';
    });
  }
})();
