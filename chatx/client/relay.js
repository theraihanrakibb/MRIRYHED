/* Optional realtime relay for the GitHub Pages build of MRIRYHED Chat.
 *
 * The chat works out-of-the-box in two ways:
 *   1. Served by the Node server (chatx/server)  -> same-origin WebSocket, realtime.
 *   2. Opened from a file / GitHub Pages          -> local demo (BroadcastChannel, syncs tabs).
 *
 * To make the GitHub Pages version chat in REAL TIME across devices, deploy the
 * server (see chatx/README.md, free on Render) and paste its wss URL below, e.g.
 *   window.CHAT_RELAY = "wss://mrihat.onrender.com";
 * Leave it "" to auto-use same-origin when the Node server is serving the page.
 */
window.CHAT_RELAY = "";
