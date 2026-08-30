const net = require('net');
const http = require('http');

function checkPort(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    socket.on('connect', () => {
      socket.destroy();
      resolve({ port, open: true });
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ port, open: false, error: 'Timeout' });
    });
    socket.on('error', (err) => {
      socket.destroy();
      resolve({ port, open: false, error: err.message });
    });
    socket.connect(port, host);
  });
}

function checkBackendHealth() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/api/v1/health', (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', (err) => {
      resolve({ running: false, error: err.message });
    });
  });
}

async function main() {
  console.log('🔍 Checking database and backend status...\n');

  const mysqlCheck = await checkPort(3306);
  console.log(`1. MySQL Port 3306: ${mysqlCheck.open ? '🟢 OPEN (MySQL service is running)' : '🔴 CLOSED (' + mysqlCheck.error + ')'}`);

  const backendCheck = await checkPort(3000);
  console.log(`2. NestJS Backend Port 3000: ${backendCheck.open ? '🟢 OPEN (Backend process is running)' : '🔴 CLOSED (Backend is not currently running)'}`);

  if (backendCheck.open) {
    const health = await checkBackendHealth();
    console.log('\n3. Backend Health Status:', JSON.stringify(health, null, 2));
  } else {
    console.log('\n💡 To start the backend and connect to MySQL, run in backend/ directory:');
    console.log('   npm run prisma:generate');
    console.log('   npm run start:dev');
  }
}

main();
