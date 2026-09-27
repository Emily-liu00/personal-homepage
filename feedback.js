/* ============================================================
   留言板 · 表单逻辑
   ------------------------------------------------------------
   - 前端校验：昵称 + 留言必填，长度与数据库约束保持一致
   - 提交方式：直接调用 Supabase 的 REST 接口（不依赖任何 CDN 脚本，
     这样即使 CDN 被墙或加载失败，留言板依然可用）
   - 只写入、不读取：请求头里用 Prefer: return=minimal，
     因为数据库没有给匿名访客 select 权限
   - 未配置数据库时：明确提示「还没连上」，绝不假装提交成功
   ============================================================ */
(function () {
  'use strict';

  var form = document.getElementById('feedbackForm');
  if (!form) return;

  /* 把填进来的地址整理成「项目根地址」：
     - 去掉首尾空白与结尾斜杠
     - 若误填了 REST 端点（…/rest/v1/ 或 …/rest/v1/feedback），自动去掉这段尾巴
     这样无论填 https://xxx.supabase.co 还是 https://xxx.supabase.co/rest/v1/ 都能正常工作 */
  function normalizeBaseUrl(raw) {
    return String(raw || '')
      .trim()
      .replace(/\/+$/, '')
      .replace(/\/rest\/v1(\/.*)?$/i, '')
      .replace(/\/+$/, '');
  }

  var config = window.FEEDBACK_CONFIG || {};
  var table = config.table || 'feedback';
  var apiUrl = normalizeBaseUrl(config.supabaseUrl);
  var anonKey = String(config.supabaseAnonKey || '').trim();   // 粘贴时容易带上换行，这里清掉
  var isConfigured = /^https?:\/\//.test(apiUrl) && anonKey.length > 20;

  var nicknameInput = document.getElementById('fbNickname');
  var relationSelect = document.getElementById('fbRelation');
  var messageInput = document.getElementById('fbMessage');
  var honeypot = document.getElementById('fbWebsite');   // 机器人陷阱：真人看不到这一栏
  var submitButton = document.getElementById('fbSubmit');
  var statusBox = document.getElementById('fbStatus');
  var counter = document.getElementById('fbCounter');

  var MAX_MESSAGE = 1000;
  var MIN_MESSAGE = 2;
  var COOLDOWN_MS = 60 * 1000;        // 同一个人 60 秒内只能发一条
  var STORAGE_KEY = 'feedback:lastSubmitAt';
  var LABELS = { success: '已收到 ✿', error: '没能寄出', info: '小提示' };

  /* ---------- 提示条 ---------- */
  function showStatus(type, text) {
    if (!statusBox) return;
    statusBox.textContent = text;
    statusBox.className = 'fb-status is-' + type;
    statusBox.setAttribute('role', type === 'error' ? 'alert' : 'status');
    statusBox.hidden = false;
  }

  function clearStatus() {
    if (!statusBox) return;
    statusBox.hidden = true;
    statusBox.textContent = '';
    statusBox.className = 'fb-status';
  }

  /* ---------- 字数统计 ---------- */
  function updateCounter() {
    if (!counter || !messageInput) return;
    var len = messageInput.value.length;
    counter.textContent = len + ' / ' + MAX_MESSAGE;
    counter.classList.toggle('is-close', len > MAX_MESSAGE - 80);
  }
  if (messageInput) {
    messageInput.addEventListener('input', updateCounter);
    updateCounter();
  }

  /* ---------- 按钮状态 ---------- */
  function setBusy(busy) {
    if (!submitButton) return;
    submitButton.disabled = busy;
    submitButton.classList.toggle('is-busy', busy);
    var label = submitButton.querySelector('[data-label]');
    if (label) label.textContent = busy ? '正在寄出…' : '寄出这条留言';
  }

  /* ---------- 校验 ---------- */
  function validate() {
    var nickname = nicknameInput ? nicknameInput.value.trim() : '';
    var message = messageInput ? messageInput.value.trim() : '';

    if (!nickname) {
      showStatus('error', '还没写昵称呢～ 随便写个称呼就好，方便我知道是谁留的言。');
      if (nicknameInput) nicknameInput.focus();
      return null;
    }
    if (nickname.length > 40) {
      showStatus('error', '昵称有点太长啦（最多 40 个字），精简一下好吗？');
      if (nicknameInput) nicknameInput.focus();
      return null;
    }
    if (!message) {
      showStatus('error', '留言还是空的哦～ 哪怕只是打个招呼，我也会很开心。');
      if (messageInput) messageInput.focus();
      return null;
    }
    if (message.length < MIN_MESSAGE) {
      showStatus('error', '再多写一两个字吧，这样我才能明白你的意思～');
      if (messageInput) messageInput.focus();
      return null;
    }
    if (message.length > MAX_MESSAGE) {
      showStatus('error', '留言超过 ' + MAX_MESSAGE + ' 字啦，麻烦分成两次发给我～');
      if (messageInput) messageInput.focus();
      return null;
    }

    return {
      nickname: nickname,
      relation: relationSelect && relationSelect.value ? relationSelect.value : null,
      message: message,
      page_url: location.href,
      user_agent: navigator.userAgent
    };
  }

  /* ---------- 冷却时间 ---------- */
  function cooldownLeft() {
    try {
      var last = Number(localStorage.getItem(STORAGE_KEY) || 0);
      if (!last) return 0;
      var left = COOLDOWN_MS - (Date.now() - last);
      return left > 0 ? Math.ceil(left / 1000) : 0;
    } catch (e) {
      return 0;
    }
  }

  function markSubmitted() {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch (e) { /* 无痕模式忽略 */ }
  }

  /* ---------- 错误信息翻译成人话 ---------- */
  function friendlyError(status, bodyText) {
    if (status === 401 || status === 403) {
      return '数据库暂时不接受写入（权限问题）。请检查 anon key 是否正确、以及建表 SQL 里的 insert 策略是否已执行。';
    }
    if (status === 404) {
      return '找不到 feedback 数据表。请先在 Supabase 里执行 outputs/留言板-Supabase建表.sql。';
    }
    if (status === 429) {
      return '请求有点太频繁啦，歇一分钟再试试好吗？';
    }
    if (status >= 500) {
      return 'Supabase 那边好像打了个盹，稍后再试一次～';
    }
    return '没能寄出：' + (bodyText ? bodyText.slice(0, 160) : '未知错误（HTTP ' + status + '）');
  }

  /* ---------- 提交 ---------- */
  async function submit(payload) {
    var res = await fetch(apiUrl + '/rest/v1/' + encodeURIComponent(table), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': 'Bearer ' + anonKey,
        // 只写入、不回读：数据库没有给匿名访客 select 权限
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      var text = '';
      try { text = await res.text(); } catch (e) { /* ignore */ }
      throw new Error(friendlyError(res.status, text));
    }
  }

  /* ---------- 表单事件 ---------- */
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    clearStatus();

    // 机器人陷阱：真人永远看不到这一栏，填了就悄悄忽略
    if (honeypot && honeypot.value) return;

    // 未配置数据库：如实告知，不假装成功
    if (!isConfigured) {
      showStatus('info', '留言板还没连上数据库呢～ 等你把 Supabase 的 Project URL 和 anon key 填进 supabase-config.js，我就能收到啦。');
      return;
    }

    var wait = cooldownLeft();
    if (wait > 0) {
      showStatus('info', '刚收到你的留言啦，' + wait + ' 秒后再发下一条好吗？');
      return;
    }

    var payload = validate();
    if (!payload) return;

    setBusy(true);
    try {
      await submit(payload);
      form.reset();
      updateCounter();
      markSubmitted();
      showStatus('success', '谢谢你！留言已经平安寄到啦，我会一条条认真看的 ✿');
    } catch (error) {
      var message = error && error.message ? error.message : '';
      if (/Failed to fetch|NetworkError|Load failed/i.test(message)) {
        showStatus('error', '网络好像不太顺畅，留言没能寄出。检查一下网络后再点一次好吗？');
      } else {
        showStatus('error', message || '没能寄出，稍后再试一次好吗？');
      }
    } finally {
      setBusy(false);
    }
  });

  // 开始输入就收起上一次的提示，界面更清爽
  [nicknameInput, relationSelect, messageInput].forEach(function (el) {
    if (el) el.addEventListener('input', clearStatus);
  });
})();
