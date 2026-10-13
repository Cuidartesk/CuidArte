const { test } = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');

test('index.js y routers no tienen errores de sintaxis', () => {
  const archivos = [
    'index.js',
    'router/enrutamiento.router.js',
    'router/admin.router.js',
    'router/cliente.router.js',
    'router/cuidador.router.js',
    'router/registro.router.js',
    'router/tienda.router.js',
  ];
  for (const f of archivos) {
    execFileSync(process.execPath, ['--check', f]);
  }
  assert.ok(true);
});
