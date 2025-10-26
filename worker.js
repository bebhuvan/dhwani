export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const asset = await env.ASSETS.fetch(url);

    // Clone response to modify headers
    const response = new Response(asset.body, asset);

    // Add CSP header to allow Cloudflare analytics
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' https://static.cloudflareinsights.com 'sha256-YpXZkZYp2g9n0BWSPNvNztD42xq+BD9S7NaP9UjnXiA='; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://cloudflareinsights.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
    );

    return response;
  }
};
