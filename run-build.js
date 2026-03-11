const { execSync } = require('child_process');
try {
  process.env.NEXT_TELEMETRY_DISABLED = "1";
  const out = execSync('npm run build', { encoding: 'utf-8', stdio: 'pipe' });
  require('fs').writeFileSync('build.log', out);
} catch (e) {
  require('fs').writeFileSync('build.log', (e.stdout || '') + '\n' + (e.stderr || ''));
}
