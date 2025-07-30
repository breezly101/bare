import { createBareServer } from "@tomphttp/bare-server-node";
import express from "express";
import { createServer } from "node:http";
import { publicPath } from "ultraviolet-static";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { join } from "node:path";
import { hostname } from "node:os";
import Ultraviolet from '@titaniumnetwork-dev/ultraviolet';

const bare = createBareServer("/bare/");
const app = express();

/* added */
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*'); // Разрешить все домены
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

/* added */
app.get('/generate-proxy-url', (req, res) => {
  const serviceUrl = req.query.url;

  if (serviceUrl) {
    const encodedUrl = Ultraviolet.encodeUrl(serviceUrl);
    const proxyUrl = `http://localhost:${port}/service/${encodedUrl}`;
    res.send(proxyUrl);
  } else {
    res.status(400).send('No URL provided');
  }
});

app.use(express.static(publicPath));
app.use("/uv/", express.static(uvPath));

app.use((req, res) => {
  res.status(404);
  res.sendFile(join(publicPath, "404.html"));
});

const server = createServer();

server.on("request", (req, res) => {
  if (bare.shouldRoute(req)) {
    bare.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

server.on("upgrade", (req, socket, head) => {
  if (bare.shouldRoute(req)) {
    bare.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

let port = parseInt(process.env.PORT || "");

if (isNaN(port)) port = 8080;

server.on("listening", () => {
  const address = server.address();
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
  server.close();
  bare.close();
  process.exit(0);
}

server.listen({
  port,
})
