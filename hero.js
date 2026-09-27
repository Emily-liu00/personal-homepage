/* ============================================================
   hero.js —— 首屏「滚动收拢 / 打开」动画 + 视差
   参考 okaydev.co 首屏的做法：

   · 载入（打开）：底部滚动字幕自下而上滑入；黑色高亮块停在末行、
     用 clip-path 从左到右擦开；漂浮照片位从中心飞散到各自位置。
   · 向下滚动（收拢）：照片向中心聚拢并淡出；眉标 / 首行 / 简介淡出缩小；
     末行与按钮整体下移、在内容区居中，克隆眉标在其上方淡入。
   · 向上滚回顶部（打开）：原路反向还原。

   纯原生 JS、无依赖。若脚本未运行，首屏仍是静态可读版本。
   ============================================================ */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;

  var hero = doc.querySelector('[data-hero]');
  var headline = doc.querySelector('[data-headline]');
  var bar = doc.querySelector('[data-headline-bar]');

  if (!hero || !headline || !bar) return;

  root.classList.add('has-hero-js');

  var reduce = false;
  try {
    reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {
    reduce = false;
  }

  var lines = headline.querySelectorAll('[data-hero-line]');
  var lastLine = lines.length ? lines[lines.length - 1] : null;
  var tiles = hero.querySelectorAll('.hero-tile');
  var ctas = hero.querySelector('.hero-ctas');
  var clone = hero.querySelector('[data-hero-eyebrow-clone]');

  var vw = 0;
  var vh = 0;
  var geo = null;    /* 高亮块几何（相对标题左上角） */
  var shift = 0;     /* 收拢时末行 + 按钮的下移量 */
  var armed = false; /* 已量测、初始态就位 */
  var cur = 0;       /* 收拢进度（平滑后） */
  var target = 0;    /* 收拢进度（滚动目标） */
  var rafId = 0;
  var introId = 0;
  var introStart = 0;
  var resizeTimer = null;
  var introFallbackTimer = null;

  var INTRO_DUR = 1050;
  var INTRO_STAGGER = 140;

  function clamp01(x) {
    return x < 0 ? 0 : (x > 1 ? 1 : x);
  }

  function smooth(x) {
    x = clamp01(x);
    return x * x * (3 - 2 * x);
  }

  function easeOut(x) {
    return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
  }

  function now() {
    return (window.performance && window.performance.now)
      ? window.performance.now()
      : Date.now();
  }

  function scrolled() {
    return Math.max(0, window.scrollY || window.pageYOffset || 0);
  }

  /* 稳定的伪随机，保证 resize 时照片聚拢位置不跳变 */
  function pseudo(n) {
    var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  /* ---------- 量测 ---------- */
  function measure() {
    vw = window.innerWidth || root.clientWidth;
    vh = window.innerHeight || root.clientHeight;

    /* 量测期间先把收拢动画归零，否则会量到形变后的位置 */
    var keep = {
      fm: hero.style.getPropertyValue('--fm'),
      fx: hero.style.getPropertyValue('--fx'),
      fc: hero.style.getPropertyValue('--fc'),
      fade: hero.style.getPropertyValue('--fade')
    };
    hero.style.setProperty('--fm', '0');
    hero.style.setProperty('--fx', '0');
    hero.style.setProperty('--fc', '0');
    hero.style.setProperty('--fade', '0');
    hero.style.setProperty('--shift', '0px');
    hero.style.setProperty('--clone-y', '0px');
    void hero.offsetHeight; /* 强制同步布局 */

    var heroRect = hero.getBoundingClientRect();

    /* 高亮块：停在最后一行 */
    if (lastLine) {
      var hr = headline.getBoundingClientRect();
      var r = lastLine.getBoundingClientRect();
      var padX = r.height * 0.34;
      var padY = r.height * 0.08;
      geo = {
        x: r.left - hr.left - padX,
        y: r.top - hr.top - padY,
        w: r.width + padX * 2,
        h: r.height + padY * 2
      };
    }

    /* 照片位：算出各自「聚到首屏中心」所需的位移。
       offsetLeft/Top 不受 transform 影响，所以能安全重复量测。 */
    var centerX = heroRect.width / 2;
    var centerY = heroRect.height * 0.42;
    for (var i = 0; i < tiles.length; i++) {
      var t = tiles[i];
      var dx = centerX - (t.offsetLeft + t.offsetWidth / 2) + (pseudo(i * 3 + 1) - 0.5) * 46;
      var dy = centerY - (t.offsetTop + t.offsetHeight / 2) + (pseudo(i * 3 + 2) - 0.5) * 46;
      var dr = (pseudo(i * 3 + 3) - 0.5) * 18;
      t.style.setProperty('--cx', dx.toFixed(1) + 'px');
      t.style.setProperty('--cy', dy.toFixed(1) + 'px');
      t.style.setProperty('--cr', dr.toFixed(2) + 'deg');
    }

    /* 收拢后 [末行 .. 按钮] 这一簇应落在内容区垂直中线上。
       简介在收拢时只是淡出、仍占位，所以按钮要额外上移补掉它。 */
    if (lastLine && ctas) {
      var cs = window.getComputedStyle(hero);
      var padTop = parseFloat(cs.paddingTop) || 0;
      var padBottom = parseFloat(cs.paddingBottom) || 0;
      var contentCenter = padTop + (heroRect.height - padTop - padBottom) / 2;

      var desc = hero.querySelector('.hero-description');
      var descH = 0;
      if (desc) {
        var ds = window.getComputedStyle(desc);
        descH = desc.getBoundingClientRect().height + (parseFloat(ds.marginTop) || 0);
      }

      var lr = lastLine.getBoundingClientRect();
      var cr = ctas.getBoundingClientRect();
      var lTop = lr.top - heroRect.top;
      var cBottom = cr.bottom - heroRect.top;
      shift = contentCenter - (lTop + cBottom - descH) / 2;
      hero.style.setProperty('--desc-h', descH.toFixed(1) + 'px');

      /* 克隆眉标贴在收拢后末行的正上方 */
      if (clone) {
        var cloneY = lTop + shift - clone.offsetHeight - 14;
        hero.style.setProperty('--clone-y', cloneY.toFixed(1) + 'px');
      }
    }
    hero.style.setProperty('--shift', shift.toFixed(1) + 'px');

    /* 还原（与量测同帧，不会闪） */
    hero.style.setProperty('--fm', keep.fm || '0');
    hero.style.setProperty('--fx', keep.fx || '0');
    hero.style.setProperty('--fc', keep.fc || '0');
    hero.style.setProperty('--fade', keep.fade || '0');
    void hero.offsetHeight;
  }

  function setBar(g) {
    if (!g) return;
    bar.style.setProperty('--bx', g.x.toFixed(2) + 'px');
    bar.style.setProperty('--by', g.y.toFixed(2) + 'px');
    bar.style.width = g.w.toFixed(2) + 'px';
    bar.style.height = g.h.toFixed(2) + 'px';
  }

  /* ---------- 滚动收拢 ---------- */
  function heroProgress() {
    var rect = hero.getBoundingClientRect();
    var span = Math.max(1, hero.offsetHeight * 0.85);
    return clamp01(-rect.top / span);
  }

  function exitRange() {
    var h = hero.offsetHeight || vh;
    return {
      a: Math.max(16, h * 0.02),
      b: Math.max(160, h * 0.30)
    };
  }

  function readTarget() {
    var r = exitRange();
    return clamp01((scrolled() - r.a) / Math.max(1, r.b - r.a));
  }

  /* 收拢进度 t 拆成三条错开的子进度，避免所有元素一起动 */
  function writeFold(t) {
    hero.style.setProperty('--fm', smooth((t - 0.05) / 0.65).toFixed(4));
    hero.style.setProperty('--fx', smooth(t / 0.5).toFixed(4));
    hero.style.setProperty('--fc', smooth((t - 0.30) / 0.70).toFixed(4));
  }

  function paint() {
    var p = heroProgress();
    hero.style.setProperty('--p', p.toFixed(4));
    hero.style.setProperty('--fade', Math.max(0, (p - 0.62) / 0.38).toFixed(4));
  }

  /* 平滑趋近：滚轮跳变时也有「收拢 / 打开」的过程感 */
  function tick() {
    var d = target - cur;
    if (Math.abs(d) < 0.0008) {
      cur = target;
    } else {
      cur += d * 0.18;
    }
    writeFold(cur);
    rafId = Math.abs(target - cur) > 0.0008 ? window.requestAnimationFrame(tick) : 0;
  }

  function schedule() {
    if (!rafId) rafId = window.requestAnimationFrame(tick);
  }

  function onScroll() {
    if (!armed || reduce) return;
    paint();
    target = readTarget();
    schedule();
  }

  /* ---------- 载入动画 ---------- */
  function introTick() {
    var e = now() - introStart;
    var total = INTRO_DUR + Math.max(0, tiles.length - 1) * INTRO_STAGGER;
    for (var i = 0; i < tiles.length; i++) {
      var p = clamp01((e - i * INTRO_STAGGER) / INTRO_DUR);
      tiles[i].style.setProperty('--fi', (1 - easeOut(p)).toFixed(4));
    }
    if (e < total) {
      introId = window.requestAnimationFrame(introTick);
    } else {
      window.clearTimeout(introFallbackTimer);
      for (var j = 0; j < tiles.length; j++) tiles[j].style.setProperty('--fi', '0');
      introId = 0;
    }
  }

  /* 高亮块从左到右擦开（clip-path wipe） */
  function wipeBar() {
    var closed = 'inset(0 100% 0 0 round 10px)';
    bar.style.transition = 'none';
    bar.style.clipPath = closed;
    void bar.offsetWidth;
    window.requestAnimationFrame(function () {
      bar.style.transition = '';
      bar.style.clipPath = '';
    });
  }

  function arm() {
    measure();
    if (!geo) return;
    setBar(geo);

    if (reduce) {
      armed = true;
      hero.classList.add('is-ready');
      return;
    }

    var fromTop = scrolled() < 4;
    for (var i = 0; i < tiles.length; i++) {
      tiles[i].style.setProperty('--fi', fromTop ? '1' : '0');
    }
    hero.classList.add('is-ready');

    if (fromTop) {
      wipeBar();
      introStart = now();
      introId = window.requestAnimationFrame(introTick);
      /* 兜底：--fi=1 是完全不可见状态，若 requestAnimationFrame 被浏览器
         节流或暂停（后台标签、省电模式、离屏渲染等），载入动画不会推进，
         首屏照片会永久停在 opacity:0。这里用定时器保证一定会落到就位状态。 */
      window.clearTimeout(introFallbackTimer);
      introFallbackTimer = window.setTimeout(function () {
        if (!introId) return;
        for (var k = 0; k < tiles.length; k++) tiles[k].style.setProperty('--fi', '0');
        introId = 0;
      }, INTRO_DUR + Math.max(0, tiles.length - 1) * INTRO_STAGGER + 500);
    }

    armed = true;
    /* 刷新时若已在页面中部，直接落到对应状态，不补播动画 */
    target = readTarget();
    cur = target;
    onScroll();
  }

  function sync() {
    measure();
    if (!geo) return;
    setBar(geo);
    if (armed) onScroll();
  }

  /* ---------- 事件 ---------- */
  window.addEventListener('scroll', onScroll, { passive: true });

  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(sync, 150);
  });

  /* 鼠标悬停视差：照片位随指针轻微移动 */
  if (!reduce) {
    hero.addEventListener('pointermove', function (ev) {
      hero.style.setProperty('--mx', (((ev.clientX / vw) - 0.5) * 30).toFixed(1) + 'px');
      hero.style.setProperty('--my', (((ev.clientY / vh) - 0.5) * 22).toFixed(1) + 'px');
    }, { passive: true });

    hero.addEventListener('pointerleave', function () {
      hero.style.setProperty('--mx', '0px');
      hero.style.setProperty('--my', '0px');
    });
  }

  arm();

  /* 字体加载完成后字宽会变，需要重新量测 */
  if (doc.fonts && doc.fonts.ready && doc.fonts.ready.then) {
    doc.fonts.ready.then(sync).catch(function () {});
  }
})();
