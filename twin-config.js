/**
 * 数字分身接口地址 —— 只改这一行
 *
 * 本地调试：保持 http://localhost:9000/api/chat
 *           同时在 twin-backend 目录运行 python3 server.py
 *
 * 线上部署：换成函数计算的 HTTP 触发器地址，例如
 *           window.TWIN_API = 'https://xxxx.fcapp.run/api/chat';
 *
 * 注意：这个文件会被公开托管，只放接口地址，绝不要放任何密钥。
 */
window.TWIN_API = 'https://twin-api-rrrmnngkbq.cn-hangzhou.fcapp.run/api/chat';
