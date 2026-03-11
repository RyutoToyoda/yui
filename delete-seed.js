const fs = require('fs');
try { fs.rmSync('./src/lib/demo-data.ts', {force: true}); console.log('Deleted demo-data.ts'); } catch (e) { console.error(e); }
try { fs.rmSync('./src/app/seed', {recursive: true, force: true}); console.log('Deleted seed dir'); } catch (e) { console.error(e); }
