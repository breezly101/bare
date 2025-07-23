const http = require('http');
const https = require('https');
const url = require('url');

const PORT = process.env.PORT || 8080;
const cache = new Map();

const CACHE_TTL = 60 * 1000; // 1 minute cache TTL

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const targetUrl = parsedUrl.query.url;

  if (!targetUrl) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    return res.end('Please provide a URL parameter like ?url=https://example.com');
  }

  let fetchUrl = targetUrl;
  if (!/^https?:\/\//i.test(fetchUrl)) {
    fetchUrl = 'http://' + fetchUrl;
  }

  // Check cache
  const cached = cache.get(fetchUrl);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    res.writeHead(200, { 'Content-Type': cached.contentType });
    return res.end(cached.data);
  }

  const client = fetchUrl.startsWith('https') ? https : http;

  client.get(fetchUrl, (proxyRes) => {
    const chunks = [];

    proxyRes.on('data', chunk => chunks.push(chunk));
    proxyRes.on('end', () => {
      const data = Buffer.concat(chunks);

      // Cache the response body and content type
      cache.set(fetchUrl, {
        data,
        timestamp: Date.now(),
        contentType: proxyRes.headers['content-type'] || 'application/octet-stream'
      });

      // Forward status and headers to client
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      res.end(data);
    });

  }).on('error', (err) => {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Error fetching the URL: ' + err.message);
  });
});

server.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
