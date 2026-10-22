import { spawnSync } from 'node:child_process'
import path from 'node:path'

const projectRoot = path.join(import.meta.dirname, '..')
const browsersPath = path.join(projectRoot, '.playwright-browsers')
const executable = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

const installArgs = ['exec', 'playwright', 'install']

if (process.env.CI) {
  installArgs.push('--with-deps')
}

installArgs.push('chromium')

const result = spawnSync(executable, installArgs, {
  cwd: projectRoot,
  env: {
    ...process.env,
    PLAYWRIGHT_BROWSERS_PATH: browsersPath,
  },
  shell: process.platform === 'win32',
  stdio: 'inherit',
})

process.exit(result.status ?? 1)
