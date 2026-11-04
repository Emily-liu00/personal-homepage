/* ============================================================
 * 数字分身「小羽」
 * 真实大模型对话：前端只发消息，不接触任何密钥。
 * 接口地址在 twin-config.js 里配置（window.TWIN_API）。
 * 接口约定：POST { messages: [{role, content}] } → { reply } 或 { error }
 * ============================================================ */

const messages = document.querySelector('#messages');
const form = document.querySelector('#chatForm');
const input = document.querySelector('#chatInput');
const suggestions = document.querySelector('#suggestions');
const resetButton = document.querySelector('#resetChat');

const API_ENDPOINT = String(window.TWIN_API || '').trim();
const MAX_HISTORY = 8;        // 最多带 8 条上下文，控制 token 消耗
const REQUEST_TIMEOUT = 30000; // 30 秒，超时给用户明确提示

const opening =
  '嗨～我是羽萱的数字分身「小羽」！想聊聊我的大学生活、最近去哪玩、还是吃了什么好吃的？中英文都可以问哦。\n' +
  "Hi! I'm Yuxuan's digital twin Xiaoyu. Ask me in Chinese or English — about campus life, food, or plans!";

const errorTips = [
  '网络好像开小差了，稍后再试一次吧～',
  "Sorry, I couldn't reach my brain just now. Please try again in a moment!"
];

let history = [];
let pending = false;

function isEnglish(text) {
  const latin = (text.match(/[a-zA-Z]/g) || []).length;
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  return latin > 0 && latin >= cjk;
}

function addMessage(text, sender) {
  const row = document.createElement('div');
  row.className = `message ${sender}`;
  if (sender === 'bot') {
    const avatar = document.createElement('img');
    avatar.src = 'assets/liuyuxuan-avatar.png';
    avatar.alt = '';
    row.appendChild(avatar);
  }
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;
  row.appendChild(bubble);
  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
}

function showTyping() {
  const row = document.createElement('div');
  row.className = 'message bot typing';
  row.id = 'typing';
  const avatar = document.createElement('img');
  avatar.src = 'assets/liuyuxuan-avatar.png';
  avatar.alt = '';
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = '<i></i><i></i><i></i>';
  row.append(avatar, bubble);
  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
}

function removeTyping() {
  document.querySelector('#typing')?.remove();
}

function setPending(value) {
  pending = value;
  const button = form.querySelector('button[type="submit"]');
  if (button) button.disabled = value;
  input.disabled = value;
}

async function requestReply(msgs) {
  if (!API_ENDPOINT) throw new Error('TWIN_API 未配置');

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: msgs }),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.reply) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    return data.reply;
  } finally {
    window.clearTimeout(timer);
  }
}

async function ask(question) {
  const text = question.trim();
  if (!text || pending) return;

  addMessage(text, 'user');
  input.value = '';
  suggestions.style.display = 'none';
  showTyping();
  setPending(true);

  history.push({ role: 'user', content: text });
  if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);

  try {
    const reply = await requestReply(history);
    removeTyping();
    addMessage(reply, 'bot');
    history.push({ role: 'assistant', content: reply });
    if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);
  } catch (error) {
    // 失败不静默兜底：明确告诉访客这次没答上，避免把占位话术冒充模型回答
    console.warn('[twin] 请求失败：', error);
    removeTyping();
    history.pop();
    addMessage(isEnglish(text) ? errorTips[1] : errorTips[0], 'bot');
  } finally {
    setPending(false);
    input.focus();
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  ask(input.value);
});

suggestions.addEventListener('click', event => {
  if (event.target.tagName === 'BUTTON') ask(event.target.textContent);
});

resetButton.addEventListener('click', () => {
  if (pending) return;
  history = [];
  messages.innerHTML = '';
  addMessage(opening, 'bot');
  suggestions.style.display = 'flex';
  input.focus();
});

/* ===== 照片灯箱：点击「拍照片 / 探店美食」胶囊弹出 ===== */
(function () {
  'use strict';

  const galleries = {
    photography: {
      titleZh: '我的摄影作品',
      titleEn: 'My Photography',
      images: [
        { src: 'assets/photos/photography/scenery/scenery-01-lotus.jpg', zh: '荷塘夏色', en: 'Lotus in Summer' },
        { src: 'assets/photos/photography/scenery/scenery-02-bamboo-creek.jpg', zh: '竹林溪径', en: 'Bamboo Creek' },
        { src: 'assets/photos/photography/scenery/scenery-03-aiwan-pavilion.jpg', zh: '爱晚亭', en: 'Aiwan Pavilion' },
        { src: 'assets/photos/photography/scenery/scenery-04-city-sunset.jpg', zh: '城市日落', en: 'City Sunset' },
        { src: 'assets/photos/photography/scenery/scenery-05-sea-sunset.jpg', zh: '海上日落', en: 'Sunset over the Sea' },
        { src: 'assets/photos/photography/scenery/scenery-06-dusk-buildings.jpg', zh: '暮色楼宇', en: 'Dusk Buildings' },
        { src: 'assets/photos/photography/scenery/scenery-07-sunlit-rocks.jpg', zh: '逆光礁岸', en: 'Sunlit Rocks' },
        { src: 'assets/photos/photography/portrait/portrait-01-study-room.jpg', zh: '自习室一角', en: 'Study Corner' },
        { src: 'assets/photos/photography/portrait/portrait-02-future-rock.jpg', zh: '「未来」', en: 'The Future' },
        { src: 'assets/photos/photography/portrait/portrait-03-vintage.jpg', zh: '复古写真', en: 'Vintage Portrait' },
        { src: 'assets/photos/photography/portrait/portrait-04-silhouette.jpg', zh: '窗边剪影', en: 'Silhouette by the Window' },
        { src: 'assets/photos/photography/portrait/portrait-05-red-rose.jpg', zh: '红玫瑰', en: 'Red Rose' },
        { src: 'assets/photos/photography/portrait/portrait-06-school-uniform.jpg', zh: '校园时光', en: 'Campus Days' },
        { src: 'assets/photos/photography/portrait/portrait-07-childhood.jpg', zh: '小时候', en: 'Childhood' },
        { src: 'assets/photos/photography/portrait/portrait-08-flowers.jpg', zh: '花丛前', en: 'Among Flowers' }
      ]
    },
    food: {
      titleZh: '我的探店美食',
      titleEn: 'Food Hunting',
      images: [
        { src: 'assets/photos/food/food-01-rice-noodle.jpg', zh: '红汤米粉', en: 'Rice Noodle Soup' },
        { src: 'assets/photos/food/food-02-mcdonalds.jpg', zh: '麦当劳之夜', en: "McDonald's Night" },
        { src: 'assets/photos/food/food-03-late-night-delivery.jpg', zh: '夜宵外卖', en: 'Late-night Delivery' },
        { src: 'assets/photos/food/food-04-cheers.jpg', zh: '碰一杯', en: 'Cheers!' },
        { src: 'assets/photos/food/food-05-garlic-oysters.jpg', zh: '蒜蓉烤生蚝', en: 'Garlic Oysters' },
        { src: 'assets/photos/food/food-06-spicy-fish-pot.jpg', zh: '麻辣鱼锅', en: 'Spicy Fish Pot' },
        { src: 'assets/photos/food/food-07-late-night-diner.jpg', zh: '深夜食堂', en: 'Late-night Diner' },
        { src: 'assets/photos/food/food-08-sichuan-table.jpg', zh: '川味一桌', en: 'Sichuan Feast' },
        { src: 'assets/photos/food/food-09-typhoon-crab.jpg', zh: '避风塘炒蟹', en: 'Typhoon Shelter Crab' },
        { src: 'assets/photos/food/food-10-western-plate.jpg', zh: '西式简餐', en: 'Western Plate' },
        { src: 'assets/photos/food/food-11-hotpot.jpg', zh: '热气腾腾的火锅', en: 'Hotpot' },
        { src: 'assets/photos/food/food-12-roast-fish.jpg', zh: '烤鱼', en: 'Roast Fish' },
        { src: 'assets/photos/food/food-13-two-noodle-bowls.jpg', zh: '双碗面', en: 'Two Bowls of Noodles' }
      ]
    }
  };

  const overlay = document.getElementById('galleryOverlay');
  const dialog = overlay.querySelector('.gallery-dialog');
  const titleEl = document.getElementById('galleryTitle');
  const grid = document.getElementById('galleryGrid');
  const viewer = document.getElementById('galleryViewer');
  const imgEl = document.getElementById('galleryImg');
  const captionEl = document.getElementById('galleryCaption');
  const countEl = document.getElementById('galleryCount');
  const btnClose = document.getElementById('galleryClose');
  const btnBack = document.getElementById('galleryBack');
  const btnPrev = document.getElementById('galleryPrev');
  const btnNext = document.getElementById('galleryNext');

  let currentImages = [];
  let currentIndex = 0;
  let lastFocus = null;
  let closeTimer = null;

  function openGallery(key) {
    const g = galleries[key] || galleries.photography;
    clearTimeout(closeTimer);
    currentImages = g.images;
    currentIndex = 0;
    titleEl.innerHTML = g.titleZh + '<em>' + g.titleEn + '</em>';

    grid.innerHTML = '';
    if (currentImages.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'gallery-empty';
      empty.innerHTML = '<span class="gallery-empty-ico">🍜</span><p>照片整理中，敬请期待～</p><p><em>Photos coming soon</em></p>';
      grid.appendChild(empty);
    } else {
      const frag = document.createDocumentFragment();
      currentImages.forEach((item, i) => {
        const btn = document.createElement('button');
        btn.className = 'gallery-item';
        btn.type = 'button';
        btn.setAttribute('aria-label', item.zh);
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.zh;
        btn.appendChild(img);
        btn.addEventListener('click', () => showImage(i));
        frag.appendChild(btn);
      });
      grid.appendChild(frag);
    }

    viewer.hidden = true;
    grid.style.display = '';
    overlay.hidden = false;
    // 触发过渡动画
    requestAnimationFrame(() => overlay.classList.add('show'));
    lastFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    btnClose.focus();
  }

  function closeGallery() {
    clearTimeout(closeTimer);
    overlay.classList.remove('show');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
    closeTimer = setTimeout(() => { overlay.hidden = true; }, 260);
  }

  function showImage(index) {
    const item = currentImages[index];
    if (!item) return;
    currentIndex = index;
    imgEl.src = item.src;
    imgEl.alt = item.zh;
    captionEl.textContent = item.zh + ' · ' + item.en;
    countEl.textContent = (index + 1) + ' / ' + currentImages.length;
    grid.style.display = 'none';
    viewer.hidden = false;
    btnPrev.disabled = currentImages.length <= 1;
    btnNext.disabled = currentImages.length <= 1;
  }

  function backToGrid() {
    viewer.hidden = true;
    grid.style.display = '';
  }

  btnClose.addEventListener('click', closeGallery);
  btnBack.addEventListener('click', backToGrid);
  btnPrev.addEventListener('click', () => showImage((currentIndex - 1 + currentImages.length) % currentImages.length));
  btnNext.addEventListener('click', () => showImage((currentIndex + 1) % currentImages.length));

  // 点击遮罩空白处关闭
  overlay.addEventListener('click', event => {
    if (event.target === overlay) closeGallery();
  });

  // 键盘操作
  document.addEventListener('keydown', event => {
    if (overlay.hidden) return;
    if (event.key === 'Escape') closeGallery();
    else if (!viewer.hidden && event.key === 'ArrowLeft') btnPrev.click();
    else if (!viewer.hidden && event.key === 'ArrowRight') btnNext.click();
  });

  // 绑定胶囊
  document.querySelectorAll('.chip-clickable[data-gallery]').forEach(chip => {
    chip.addEventListener('click', () => openGallery(chip.dataset.gallery));
  });
})();

/* ============================================================
 * 首屏照片悬停气泡：鼠标放到照片上弹出「日期 · 地点」可爱对话框
 * 内容来自照片元素的 data-title / data-date / data-place
 * ============================================================ */
(function () {
  'use strict';

  var tip = document.getElementById('tileTip');
  if (!tip) return;
  var dateEl = document.getElementById('tileTipDate');
  var placeEl = document.getElementById('tileTipPlace');
  var tiles = document.querySelectorAll('.hero-tile');
  if (!tiles.length) return;

  var hideTimer = null;
  var visibleFor = null;

  function showTip(tile) {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    dateEl.textContent = tile.dataset.date || '待补充';
    placeEl.textContent = tile.dataset.place || '待补充';

    var rect = tile.getBoundingClientRect();
    var vh = window.innerHeight;
    tip.hidden = false;
    tip.classList.remove('show', 'tip-below');

    // 照片上方放不下气泡时，挪到照片下方（小尾巴也会随之转向）
    var below = rect.top < tip.offsetHeight + 16;
    if (below) tip.classList.add('tip-below');

    var x = rect.left + rect.width / 2 - tip.offsetWidth / 2;
    var maxX = window.innerWidth - tip.offsetWidth - 10;
    if (x < 10) x = 10; else if (x > maxX) x = maxX;
    var y = below ? rect.bottom + 14 : rect.top - tip.offsetHeight - 16;

    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
    void tip.offsetWidth; // 强制回流，保证过渡动画生效
    tip.classList.add('show');
    visibleFor = tile;
  }

  function hideTip() {
    if (hideTimer) return;
    hideTimer = setTimeout(function () {
      hideTimer = null;
      tip.classList.remove('show');
      visibleFor = null;
    }, 140); // 轻微延迟：鼠标快速在照片间移动时不闪烁
  }

  tiles.forEach(function (tile) {
    tile.addEventListener('mouseenter', function () { showTip(tile); });
    tile.addEventListener('mouseleave', hideTip);
    // 触屏没有悬停：点一下照片切换气泡
    tile.addEventListener('click', function (e) {
      e.stopPropagation();
      if (visibleFor === tile) hideTip();
      else showTip(tile);
    });
  });

  // 点照片以外的地方，收掉气泡
  document.addEventListener('click', function (e) {
    if (!visibleFor) return;
    var t = e.target;
    while (t && t !== document) {
      if (t.classList && t.classList.contains('hero-tile')) return;
      t = t.parentNode;
    }
    hideTip();
  });
})();
