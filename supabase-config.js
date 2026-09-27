/* ============================================================
   留言板数据库配置（Supabase）
   ------------------------------------------------------------
   只需要填这两个值，留言板就能开始工作：

   1. supabaseUrl      → 项目地址，形如 https://abcdefghijklmn.supabase.co
                          ⚠️ 只要到 .supabase.co 为止，不要带 /rest/v1/
                          （带上了也没关系，feedback.js 会自动去掉）

   2. supabaseAnonKey  → Supabase 控制台 → Project Settings → API Keys
                          · 旧版界面：找 anon / public，一长串以 eyJ 开头
                          · 新版界面：找 Publishable key，以 sb_publishable_ 开头
                          两者作用相同，都设计成「可以公开放在网页里」。

   关于安全：
   - 这两个值出现在网页源码里是正常且安全的，它只能做数据库授权过的操作；
   - 本项目的建表脚本（outputs/留言板-Supabase建表.sql）只给匿名访客开了 insert，
     没有开 select，所以别人即使看到这个 key，也读不到任何留言；
   - 千万不要把 secret / service_role key 写进这里
     （那把钥匙能绕过所有限制，只能放在服务端）。
   ============================================================ */
window.FEEDBACK_CONFIG = {
  supabaseUrl: 'https://etzwnxydbrqunhigktbd.supabase.co',
  supabaseAnonKey: 'sb_publishable_kcZOivcqahwgPesoPIpXTw_3-ANS2i8',
  table: 'feedback'
};
