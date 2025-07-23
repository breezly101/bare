const http = require('http');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello with CORS enabled!\n');
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
