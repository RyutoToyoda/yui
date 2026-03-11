const { execSync } = require('child_process');
try {
  const out = execSync('npx tsc --noEmit', { encoding: 'utf-8' });
  require('fs').writeFileSync('tsc.log', out);
} catch (e) {
  require('fs').writeFileSync('tsc.log', (e.stdout || '') + '\n' + (e.stderr || ''));
}
