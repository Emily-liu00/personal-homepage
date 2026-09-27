const messages = document.querySelector('#messages');
const form = document.querySelector('#chatForm');
const input = document.querySelector('#chatInput');
const suggestions = document.querySelector('#suggestions');
const resetButton = document.querySelector('#resetChat');

const opening = '嗨～我是羽萱的数字分身「小羽」！想聊聊我的大学生活、最近去哪玩、还是吃了什么好吃的？中英文都可以问哦。\nHi! I\'m Yuxuan\'s digital twin Xiaoyu. Ask me in Chinese or English — about campus life, food, or plans!';

// —— 中文知识库 ——
const knowledge = [
  {
    keywords: ['大学', '怎么样', '学校', '学习', '专业', '上学', '最近'],
    answer: '最近在大学还不错！我是天津大学×香港理工大学深圳未来技术学院计算机科学与技术专业的学生。现在主要是认真学习课程、尝试编程，也努力吃好睡好，把状态保持得稳稳的～'
  },
  {
    keywords: ['玩', '去哪', '旅游', '地点', '探店', '周末', '游玩', '去哪儿'],
    answer: '说到出去玩我可就来精神啦～我平时喜欢出去探店，找好吃好逛的地方。周末有空的话，逛街探店、看新店都很开心。你有推荐的地方吗？可以一起去！'
  },
  {
    keywords: ['吃', '好吃', '美食', '餐厅', '饭', '好吃的'],
    answer: '最近还真有在认真探索美食！作为爱探店的女生，我尤其喜欢发现新餐厅、好吃的甜品和奶茶。我暂时没联网，具体店名可能要等我想到～不过聊吃的我超乐意！'
  },
  {
    keywords: ['就业', '工作', '求职', '方向', '未来', '职业', '找工作'],
    answer: '未来的路我也在慢慢看啦～现在就想先把课上好、把编程学一学，多接触多了解，再看看自己喜欢走哪条路。不急，一步一步来就挺好！'
  },
  {
    keywords: ['考研', '研究生', '学历', '深造'],
    answer: '考研这件事我也还在纠结犹豫中呢，想说先把手头的东西学好，之后再慢慢想～你也打算考研吗？可以一起聊聊，互相打打气呀！'
  },
  {
    keywords: ['剧', '电视剧', '好剧', '追剧', '电影', '综艺'],
    answer: '最近在物色好剧！悬疑、轻松、口碑好的我都会追，很乐意和你互相交换片单。你最近在看什么？给我推荐一部吧～'
  },
  {
    keywords: ['音乐', '歌', '听歌', '演唱会', '歌手'],
    answer: '听音乐是我的快乐来源之一，没什么比找到一首喜欢的歌更治愈了！你最近在循环哪首？我们可以互相安利。'
  },
  {
    keywords: ['兴趣', '喜欢', '爱好', '做什么'],
    answer: '我的快乐三件套是：听音乐、追剧、出去探店！平时就是在学习、编程和好好生活之间平衡，把日子过得闪闪发光。'
  },
  {
    keywords: ['特点', '长什么样', '眼镜', '长相', '外貌'],
    answer: '认出我很简单：一副圆框眼镜、一个爱笑的表情，就是我的标志啦～大家都叫我「眼镜妹」呢。'
  },
  {
    keywords: ['你好', '嗨', 'hello', 'hi', '在吗'],
    answer: '嗨嗨～欢迎来到羽萱的小主页！我是她的数字分身小羽。你可以问我：近况、想去哪玩、吃了什么好吃的，或者聊聊好剧、音乐和爱豆呀～'
  }
];

// —— 英文知识库 ——
const enKnowledge = [
  {
    keywords: ['university', 'campus', 'school', 'study', 'major', 'college', 'course', 'recent', 'how are you', 'how is school'],
    answer: "Campus is going well! I'm an undergraduate in Computer Science & Technology at the Tianjin University × Hong Kong Polytechnic University Shenzhen Future Technology Institute. Right now I'm focusing on my coursework, getting into programming, and keeping a healthy work–life balance."
  },
  {
    keywords: ['where', 'play', 'travel', 'hang out', 'weekend', 'outing', 'trip', 'explore', 'fun'],
    answer: "I'm always up for an adventure! On weekends I love cafe-hopping, discovering new places and hanging out with friends. Got a spot to recommend? Let's go together!"
  },
  {
    keywords: ['food', 'eat', 'restaurant', 'tasty', 'snack', 'dessert', 'tea', 'delicious'],
    answer: "I've been seriously exploring food lately! As a big foodie, I especially love finding new restaurants, desserts and bubble tea. I'm not online so I can't name specific places off the top of my head — but I'm always happy to talk food!"
  },
  {
    keywords: ['job', 'career', 'work', 'future', 'employment', 'intern', 'path'],
    answer: "I'm taking my time figuring out the future. For now I want to focus on my courses and programming, explore and learn as much as I can, and see which path suits me. No rush — one step at a time!"
  },
  {
    keywords: ['graduate', 'grad school', 'postgrad', 'master', 'phd', 'further study'],
    answer: "I'm still weighing grad school options. I'd like to really nail down my current studies first and think it through later. Are you considering grad school too? We can cheer each other on!"
  },
  {
    keywords: ['show', 'series', 'drama', 'movie', 'film', 'binge', 'watch'],
    answer: "I'm on the lookout for good shows right now! I follow mysteries, light-hearted comedies and well-reviewed series, and I love swapping watchlists. What are you watching lately? Recommend me one!"
  },
  {
    keywords: ['music', 'song', 'listen', 'concert', 'singer', 'playlist'],
    answer: "Music is one of my greatest joys — nothing beats finding a song you love! What's on repeat for you lately? Let's trade recommendations."
  },
  {
    keywords: ['hobby', 'interest', 'like', 'enjoy', 'do for fun', 'passion'],
    answer: "My happiness trio: music, binge-watching shows, and going out to explore food. I balance study, coding and enjoying life — making everyday things shine."
  },
  {
    keywords: ['appearance', 'look', 'glasses', 'face', 'photo'],
    answer: "Easy to spot me: round glasses and a big smile are my signature. People often call me 'the girl with glasses'!"
  },
  {
    keywords: ['hello', 'hi', 'hey', 'who are you', 'introduce', 'about'],
    answer: "Hi there! Welcome to Yuxuan's little homepage! I'm her digital twin, Xiaoyu. Ask me about her campus life, where she likes to go, favorite food, or just chat about shows and music!"
  }
];

function isEnglish(text) {
  const latin = (text.match(/[a-zA-Z]/g) || []).length;
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  return latin > 0 && latin >= cjk;
}

function getReply(question) {
  const normalized = question.toLowerCase().trim();
  const base = isEnglish(normalized) ? enKnowledge : knowledge;
  const fallback = isEnglish(normalized)
    ? "That's a bit new — my knowledge cards don't cover it yet. Try asking about her campus life, favorite food, where to go, or shows and music!"
    : '这个问题有点新鲜，我的知识卡片里还没写到呢～不过你可以问我：近况、想去哪玩、吃了什么好吃的，或者聊聊好剧和音乐呀！';
  const result = base.find(item =>
    item.keywords.some(keyword => normalized.includes(keyword))
  );
  return result ? result.answer : fallback;
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

function ask(question) {
  const text = question.trim();
  if (!text) return;
  addMessage(text, 'user');
  input.value = '';
  suggestions.style.display = 'none';
  showTyping();
  window.setTimeout(() => {
    document.querySelector('#typing')?.remove();
    addMessage(getReply(text), 'bot');
  }, 650);
}

form.addEventListener('submit', event => {
  event.preventDefault();
  ask(input.value);
});

suggestions.addEventListener('click', event => {
  if (event.target.tagName === 'BUTTON') ask(event.target.textContent);
});

resetButton.addEventListener('click', () => {
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
