const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000/live');

ws.on('open', function open() {
  console.log('Connected');
  ws.close();
});
ws.on('error', function error(e) {
  console.log('Error:', e);
});
