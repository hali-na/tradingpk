/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 开发环境：暂时移除 CSP 限制，避免阻止路由跳转
  // 生产环境可以重新启用更严格的 CSP
  // async headers() {
  //   return [
  //     {
  //       source: '/:path*',
  //       headers: [
  //         {
  //           key: 'Content-Security-Policy',
  //           value: [
  //             "default-src 'self'",
  //             "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:",
  //             "style-src 'self' 'unsafe-inline'",
  //             "img-src 'self' data: https: blob:",
  //             "font-src 'self' data:",
  //             "connect-src 'self' blob:",
  //             "worker-src 'self' blob:",
  //             "frame-src 'self'",
  //             "object-src 'none'",
  //             "base-uri 'self'",
  //             "form-action 'self'",
  //             "frame-ancestors 'none'",
  //           ].join('; '),
  //         },
  //       ],
  //     },
  //   ];
  // },
}

module.exports = nextConfig

