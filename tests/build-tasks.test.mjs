import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scratch = mkdtempSync(join(tmpdir(), 'glb-build-check-'));
const root = fileURLToPath(new URL('..', import.meta.url));
try
{
  const env = { ...process.env, PATH: scratch };
  const failedBuild = spawnSync(process.execPath, [join(root, 'tasks/build_app.mjs')], {
    cwd: scratch, env, encoding: 'utf8'
  });
  assert.equal(failedBuild.status, 1, 'A failed build command must fail the build task');

  const failedCopy = spawnSync(process.execPath, [join(root, 'tasks/copy_folder.mjs'), 'missing', 'output'], {
    cwd: scratch, encoding: 'utf8'
  });
  assert.equal(failedCopy.status, 1, 'Missing build assets must fail the copy task');

  writeFileSync(join(scratch, 'input.txt'), 'asset', 'utf8');
  const validCopy = spawnSync(process.execPath, [join(root, 'tasks/copy_folder.mjs'), 'input.txt', 'output.txt'], {
    cwd: scratch, encoding: 'utf8'
  });
  assert.equal(validCopy.status, 0, validCopy.stderr);
}
finally
{
  rmSync(scratch, { recursive: true, force: true });
}

console.log('Build task failure checks passed.');
