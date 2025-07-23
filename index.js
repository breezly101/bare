const http = require('http');
const https = require('https');
const url = require('url');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  // Enable CORS so it can be called from anywhere
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

  // Validate the URL and add protocol if missing
  let fetchUrl = targetUrl;
  if (!/^https?:\/\//i.test(fetchUrl)) {
    fetchUrl = 'http://' + fetchUrl;
  }

  // Choose http or https module
  const client = fetchUrl.startsWith('https') ? https : http;

  client.get(fetchUrl, (proxyRes) => {
    // Pipe response headers and status code
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  }).on('error', (err) => {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Error fetching the URL: ' + err.message);
  });
});

server.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
