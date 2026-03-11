import { execSync } from 'node:child_process';

function run(cmd) {
  try {
    const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
    return { ok: true, out };
  } catch (e) {
    const err = e?.stderr?.toString?.().trim?.() || e?.message || 'unknown error';
    return { ok: false, out: err };
  }
}

function printCheck(name, res) {
  const status = res.ok ? 'OK' : 'MISSING';
  console.log(`[${status}] ${name}`);
  if (!res.ok && res.out) console.log(`  -> ${res.out.split('\n')[0]}`);
}

function main() {
  console.log('Totem Go-Live Doctor');
  console.log('====================');

  const checks = [
    ['Git repository', run('git rev-parse --is-inside-work-tree')],
    ['Git remote origin', run('git remote get-url origin')],
    ['GitHub auth (gh)', run('gh auth status')],
    ['Vercel auth', run('vercel whoami')],
    ['Railway auth', run('railway whoami')],
    ['API build', run('npm run build --workspace @totem/api')],
    ['Web build', run('npm run build --workspace @totem/web')],
  ];

  for (const [name, res] of checks) printCheck(name, res);

  console.log('\nNext step: fix every [MISSING] item, then run deployment.');
}

main();
