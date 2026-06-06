import jwt from 'jsonwebtoken';

async function fetchAllData() {
  const token = jwt.sign(
    {
      id: '6a23ef451aeba9c81b0dc794',
      role: 'senior_manager',
      email: 'ashish@manager.com',
      department: 'Engineering'
    },
    'hrise_super_secure_jwt_token_secret_key_2026',
    { expiresIn: '1h' }
  );

  const headers = { 'Authorization': `Bearer ${token}` };

  const [staff, leaves, attendance, reviews] = await Promise.all([
    fetch('http://localhost:5000/api/staff', { headers }).then(r => r.json()),
    fetch('http://localhost:5000/api/leaves', { headers }).then(r => r.json()),
    fetch('http://localhost:5000/api/attendance', { headers }).then(r => r.json()),
    fetch('http://localhost:5000/api/performance/reviews', { headers }).then(r => r.json())
  ]);

  console.log('--- STAFF ---');
  console.log(JSON.stringify(staff));
  console.log('--- LEAVES ---');
  console.log(JSON.stringify(leaves));
  console.log('--- ATTENDANCE ---');
  console.log(JSON.stringify({
    records: attendance.records,
    activeEmployeeCount: attendance.activeEmployeeCount
  }));
  console.log('--- REVIEWS ---');
  console.log(JSON.stringify(reviews));
}

fetchAllData();
