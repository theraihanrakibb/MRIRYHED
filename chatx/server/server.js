/* ------------------------------------------------------------------ *
 * MRIRYHED Chat — real-time server (Node + WebSocket, ZERO dependencies)
 *   • Serves the chat client from ../client
 *   • Relays live messages / presence / feed / wallet across devices
 * Run:  node server.js   (env PORT to override, default 3000)
 * Deploy: any Node host (Render / Railway / Fly / a VPS) → free subdomain.
 * The client auto-connects; if this server is absent it falls back to the
 * local single-browser demo (BroadcastChannel), so nothing breaks.
 * ------------------------------------------------------------------ */
const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const CLIENT_DIR = path.join(__dirname, "..", "client");
const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon",
};

/* ---------------- static file server ---------------- */
const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const filePath = path.join(CLIENT_DIR, path.normalize(urlPath));
  if (!filePath.startsWith(CLIENT_DIR)) { res.writeHead(403).end("Forbidden"); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found"); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
});

/* ---------------- WebSocket layer ---------------- */
const clients = new Set();

server.on("upgrade", (req, socket) => {
  const key = req.headers["sec-websocket-key"];
  if (!key) { socket.destroy(); return; }
  const accept = crypto.createHash("sha1").update(key + GUID).digest("base64");
  socket.write(
    "HTTP/1.1 101 Switching Protocols\r\n" +
    "Upgrade: websocket\r\nConnection: Upgrade\r\n" +
    "Sec-WebSocket-Accept: " + accept + "\r\n\r\n"
  );
  socket.username = null;
  socket.buffer = Buffer.alloc(0);
  clients.add(socket);
  socket.on("data", (chunk) => handleData(socket, chunk));
  socket.on("close", () => dropClient(socket));
  socket.on("error", () => { try { socket.destroy(); } catch {} });
});

function dropClient(socket) {
  clients.delete(socket);
  if (socket.username) {
    broadcast({ type: "presence", user: socket.username, online: false }, socket);
  }
}

function broadcast(obj, except) {
  const msg = JSON.stringify(obj);
  for (const c of clients) {
    if (c !== except && c.readyState !== "closed") sendFrame(c, msg);
  }
}

function handleData(socket, chunk) {
  socket.buffer = Buffer.concat([socket.buffer, chunk]);
  const { frames, rest } = decodeFrames(socket.buffer);
  socket.buffer = rest;
  for (const f of frames) {
    if (f.opcode === 0x8) { try { socket.end(); } catch {} return; }      // close
    if (f.opcode === 0x9) { sendFrame(socket, f.payload, 0xA); continue; } // ping -> pong
    if (f.opcode !== 0x1) continue;                                       // only text
    let obj; try { obj = JSON.parse(f.payload.toString("utf8")); } catch { continue; }
    if (!obj || typeof obj !== "object") continue;

    if (obj.type === "hello") {
      if (obj.user) socket.username = obj.user;
      sendFrame(socket, JSON.stringify({
        type: "roster",
        users: [...clients].map((c) => c.username).filter((u) => u && u !== socket.username),
      }));
      continue;
    }
    if (obj.type === "presence" && obj.online && obj.user) socket.username = obj.user;
    broadcast(obj, socket); // relay everything else to peers
  }
}

/* ---- minimal RFC6455 frame codec (client frames are masked) ---- */
function decodeFrames(buf) {
  const frames = [];
  let offset = 0;
  while (buf.length >= offset + 2) {
    const b0 = buf[offset], b1 = buf[offset + 1];
    const opcode = b0 & 0x0f;
    const masked = (b1 & 0x80) === 0x80;
    let len = b1 & 0x7f;
    let p = offset + 2;
    if (len === 126) { if (buf.length < p + 2) break; len = buf.readUInt16BE(p); p += 2; }
    else if (len === 127) { if (buf.length < p + 8) break; len = Number(buf.readBigUInt64BE(p)); p += 8; }
    let mask;
    if (masked) { if (buf.length < p + 4) break; mask = buf.slice(p, p + 4); p += 4; }
    if (buf.length < p + len) break;
    let payload = buf.slice(p, p + len);
    if (masked) { const out = Buffer.allocUnsafe(len); for (let i = 0; i < len; i++) out[i] = payload[i] ^ mask[i & 3]; payload = out; }
    frames.push({ opcode, payload });
    offset = p + len;
  }
  return { frames, rest: buf.slice(offset) };
}

function sendFrame(socket, data, opcode = 0x1) {
  const payload = Buffer.isBuffer(data) ? data : Buffer.from(String(data), "utf8");
  const len = payload.length;
  let header;
  if (len < 126) header = Buffer.from([0x80 | opcode, len]);
  else if (len < 65536) { header = Buffer.allocUnsafe(4); header[0] = 0x80 | opcode; header[1] = 126; header.writeUInt16BE(len, 2); }
  else { header = Buffer.allocUnsafe(10); header[0] = 0x80 | opcode; header[1] = 127; header.writeBigUInt64BE(BigInt(len), 2); }
  try { socket.write(Buffer.concat([header, payload])); } catch {}
}

server.listen(PORT, () => {
  console.log("MRIRYHED Chat server live → http://localhost:" + PORT);
});
