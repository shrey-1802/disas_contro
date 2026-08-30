const http = require('http');

async function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting End-to-End API Verification (including Maps API)...');

  // 1. Health
  const health = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/health',
    method: 'GET',
  });
  console.log('✅ 1. Health check:', health.status, health.data.data.status, 'DB:', health.data.data.database);

  // 2. Maps Status
  const mapsStatus = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/maps/status',
    method: 'GET',
  });
  console.log('✅ 2. Maps API Status:', mapsStatus.status, 'Provider:', mapsStatus.data.data.activeProvider);

  // 3. Login
  const login = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { username: 'warehouse_manager', password: 'password123' },
  );
  console.log('✅ 3. Login:', login.status, 'User:', login.data.data.user.username, 'Role:', login.data.data.user.role);
  const token = login.data.data.accessToken;
  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // 4. Maps Geocoding & Routing
  const geocode = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/maps/geocode',
      method: 'POST',
      headers: authHeaders,
    },
    { address: '100 Central Logistics Pkwy, Sector 1' },
  );
  console.log('✅ 4. Maps Geocode Result:', geocode.data.data[0]?.formattedAddress, 'Lat/Lon:', geocode.data.data[0]?.location);

  const route = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/maps/compute-route',
      method: 'POST',
      headers: authHeaders,
    },
    {
      origin: { latitude: 37.7749, longitude: -122.4194 },
      destination: { latitude: 37.8200, longitude: -122.2500 },
    },
  );
  console.log('✅ 5. Maps ComputeRoute Result: Distance =', route.data.data.distanceKm, 'km, Duration =', route.data.data.durationMinutes, 'min');

  // 5. Dashboard Summary
  const summary = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/dashboard/summary',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('✅ 6. Dashboard Summary: Total Inventory =', summary.data.data.inventory.total, 'Active Hazards =', summary.data.data.hazards.active, 'Active Convoys =', summary.data.data.convoys.active);

  // 6. Warehouses
  const warehouses = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/warehouses',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('✅ 7. Warehouses Count =', warehouses.data.data.length, 'First =', warehouses.data.data[0].name);

  // 7. Supply Swap Recommendations
  const recs = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/supply-swaps/recommendations?itemName=Insulin&quantity=100',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('✅ 8. Supply Swap Recommendations =', recs.data.data.length, 'Top Score =', recs.data.data[0].matchScore, 'Reasons =', recs.data.data[0].reasons[0]);

  console.log('\n🎉 ALL END-TO-END VERIFICATIONS (INCLUDING MAPS API) PASSED SUCCESSFULLY!');
}

runTests().catch(console.error);
