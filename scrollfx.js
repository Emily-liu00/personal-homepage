/* ============================================================
 * scrollfx.js — 全站滚动转场动画（自由滚动 + 跟随划出 + 分层错开）
 *
 * 每个内容板块（01 关于我 ~ 06 留言板）分三层：
 *   层0 标题：.section-head
 *   层1 主体：主体容器（col-grid / row-list / chat-intro+chat-card / feedback-wrap）
 *   层2 细节：主体内的子块（.col / .row / .feedback-intro / .feedback-card）
 *
 * 滚动进入时：标题先浮入 → 主体随后 → 细节最后（错开进场）
 * 滚动离开时：标题先划出 → 主体随后 → 细节最后（错开退场）
 * 动画参数集中在 LAYERS，方便微调手感。
 * ============================================================ */
(function () {
  'use strict';

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

  /* 三层的手感参数：
     enter = 进入视口的进度区间（从下方浮入 + 快速淡入）
     exit  = 划出视口的进度区间（保持清晰向上移动 + 最后段才淡出）
     rise  = 浮入起点位移 px（下→上）
     drop  = 划出终点位移 px（上移量，越大越有“跟着滚走”的感觉） */
  var LAYERS = [
    { enter: [0.00, 0.20], exit: [0.42, 0.82], rise: 210, drop: -340 }, // 层0 标题
    { enter: [0.05, 0.28], exit: [0.50, 0.92], rise: 240, drop: -370 }, // 层1 主体
    { enter: [0.12, 0.36], exit: [0.60, 1.02], rise: 200, drop: -320 }  // 层2 细节
  ];

  /* 各板块：层1 / 层2 的选择器（层0 统一为 .section-head） */
  var SECTIONS = [
    { sel: '.about-section',      l1: ['.col-grid'],            l2: ['.col-grid > .col'] },
    { sel: '.experience-section', l1: ['.row-list'],            l2: ['.row-list > .row'] },
    { sel: '.projects-section',   l1: ['.row-list'],            l2: ['.row-list > .row'] },
    { sel: '.chat-section',       l1: ['.chat-intro', '.chat-card'], l2: [] },
    { sel: '.contact-section',    l1: ['.row-list'],            l2: ['.row-list > .row'] },
    { sel: '.feedback-section',   l1: ['.feedback-wrap'],       l2: ['.feedback-wrap > .feedback-intro', '.feedback-wrap > .feedback-card'] }
  ];

  /* 把每个动画元素整理成 { el, layer } 列表 */
  var items = [];
  SECTIONS.forEach(function (cfg) {
    var section = document.querySelector(cfg.sel);
    if (!section) return;
    section.classList.add('scrollfx-section');

    var head = section.querySelector('.section-head');
    if (head) items.push({ el: head, layer: 0, cfg: cfg });

    cfg.l1.forEach(function (s) {
      var els = section.querySelectorAll(s);
      for (var i = 0; i < els.length; i++) items.push({ el: els[i], layer: 1, cfg: cfg });
    });
    cfg.l2.forEach(function (s) {
      var els = section.querySelectorAll(s);
      for (var i = 0; i < els.length; i++) items.push({ el: els[i], layer: 2, cfg: cfg });
    });
  });

  if (!items.length) return;

  /* 每帧：读所有板块位置 → 逐元素计算并写入 transform / opacity */
  function update() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var i, j, cfg, rect, progress, L, st, t, y, o;

    for (i = 0; i < SECTIONS.length; i++) {
      cfg = SECTIONS[i];
      cfg._rect = cfg._el ? cfg._el.getBoundingClientRect() : null;
    }

    for (i = 0; i < items.length; i++) {
      st = items[i];
      if (!st.cfg._el) continue;
      rect = st.cfg._rect;
      progress = (vh - rect.top) / (rect.height + vh); // 0 尚未进入 → 1 完全滚出
      L = LAYERS[st.layer];
      if (progress < L.enter[0]) {
        y = L.rise; o = 0;
      } else if (progress < L.enter[1]) {
        t = (progress - L.enter[0]) / (L.enter[1] - L.enter[0]);
        y = L.rise * (1 - t);      // 从下方浮入
        o = t * t;                 // 快速淡入（easeOut 曲线）
      } else if (progress < L.exit[0]) {
        y = 0; o = 1;              // 静止展示
      } else if (progress < L.exit[1]) {
        t = (progress - L.exit[0]) / (L.exit[1] - L.exit[0]);
        y = L.drop * t;            // 保持清晰向上移动
        o = t < 0.5 ? 1 : 1 - (t - 0.5) / 0.5; // 前 50% 完全不淡，后 50% 淡出
      } else {
        y = L.drop; o = 0;
      }
      st.el.style.transform = 'translateY(' + y.toFixed(1) + 'px)';
      st.el.style.opacity = o.toFixed(3);
    }
  }

  var ticking = false;
  function request() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }
  }

  SECTIONS.forEach(function (cfg) {
    cfg._el = document.querySelector(cfg.sel);
  });

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  window.addEventListener('load', request);
  request();
})();
