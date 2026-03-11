const API_URL = process.env.API_URL ?? 'http://localhost:4000/api';
const STAFF_EMAIL = process.env.SMOKE_STAFF_EMAIL;
const STAFF_PASSWORD = process.env.SMOKE_STAFF_PASSWORD;

function assertEnv(name, value) {
  if (!value) throw new Error(`Missing env var: ${name}`);
}

async function post(path, body, token) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed (${res.status}) ${text}`);
  }
  return res.json();
}

async function get(path, token) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${path} failed (${res.status}) ${text}`);
  }
  return res.json();
}

async function main() {
  assertEnv('SMOKE_STAFF_EMAIL', STAFF_EMAIL);
  assertEnv('SMOKE_STAFF_PASSWORD', STAFF_PASSWORD);

  const login = await post('/auth/login', {
    email: STAFF_EMAIL,
    password: STAFF_PASSWORD,
  });
  const token = login?.accessToken;
  if (!token) throw new Error('Login did not return accessToken');

  const mapData = await get('/dashboard/map-data', token);
  const candidateId = mapData?.candidates?.[0]?.id;
  const companyId = mapData?.companies?.[0]?.id;
  if (!candidateId || !companyId) {
    throw new Error('Need at least one candidate and one company for campaign smoke tests');
  }

  const previewEmail = await post(
    '/messages/campaigns/preview',
    { direction: 'CANDIDATE_TO_COMPANIES', selectedEntityId: candidateId, channel: 'EMAIL', maxItems: 3 },
    token,
  );
  if (!previewEmail?.items?.length) throw new Error('Email preview returned no items');

  const campaignEmail = await post(
    '/messages/campaigns/send',
    { direction: 'CANDIDATE_TO_COMPANIES', selectedEntityId: candidateId, channel: 'EMAIL', maxItems: 2, name: 'Smoke Email Campaign' },
    token,
  );
  if (!campaignEmail?.id) throw new Error('Email campaign not created');

  const campaignSms = await post(
    '/messages/campaigns/send',
    { direction: 'COMPANY_TO_CANDIDATES', selectedEntityId: companyId, channel: 'SMS', maxItems: 2, name: 'Smoke SMS Campaign' },
    token,
  );
  if (!campaignSms?.id) throw new Error('SMS campaign not created');

  await post(`/messages/campaigns/${campaignSms.id}/retry-failed`, {}, token);
  console.log('Campaign smoke tests succeeded.');
}

main().catch((error) => {
  console.error('Campaign smoke tests failed:', error.message);
  process.exit(1);
});
