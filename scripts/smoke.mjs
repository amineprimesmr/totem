const API_URL = process.env.API_URL ?? 'http://localhost:4000/api';
const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3003';

async function expectOk(url, label) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${label} en échec (${res.status})`);
  }
  console.log(`OK ${label}: ${res.status}`);
}

async function main() {
  await expectOk(`${API_URL}/health`, 'API health');
  await expectOk(`${API_URL}/docs`, 'API docs');
  await expectOk(`${WEB_URL}/login`, 'Web login');
  console.log('Smoke tests terminés avec succès.');
}

main().catch((error) => {
  console.error('Smoke tests failed:', error.message);
  process.exit(1);
});
