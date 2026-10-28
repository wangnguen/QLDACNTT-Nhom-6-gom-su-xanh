import { spawn, type ChildProcess } from 'node:child_process'
import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

import EmbeddedPostgres from 'embedded-postgres'

import { DB_NAME, PORTS, SERVER_DIR, SERVER_ENV, SERVER_URL, TMP_DIR } from './config'
import { startMailServer } from './mail-server'

const PG_DIR = join(TMP_DIR, 'postgres')
const SERVER_LOG = join(TMP_DIR, 'server.log')

// Chạy file TypeScript của server giống script `dev` (swc + path alias), luôn với SERVER_ENV
const runServerScript = (args: string[]) =>
  spawn(process.execPath, ['-r', '@swc-node/register', ...args], {
    cwd: SERVER_DIR,
    env: { ...process.env, ...SERVER_ENV },
    stdio: ['ignore', 'pipe', 'pipe']
  })

const runToCompletion = (name: string, args: string[]) =>
  new Promise<void>((resolve, reject) => {
    const child = runServerScript(args)
    let output = ''
    child.stdout?.on('data', (chunk) => (output += chunk))
    child.stderr?.on('data', (chunk) => (output += chunk))
    child.on('error', reject)
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${name} thất bại (exit ${code}):\n${output}`))
    )
  })

const createPostgres = () =>
  new EmbeddedPostgres({
    databaseDir: PG_DIR,
    port: PORTS.postgres,
    user: 'postgres',
    password: 'postgres',
    persistent: true,
    onLog: () => {},
    onError: () => {}
  })

// Giữ lại cluster giữa các lần chạy cho nhanh (initdb mất vài giây); lỗi thì khởi tạo lại từ đầu
const startPostgres = async () => {
  if (existsSync(join(PG_DIR, 'PG_VERSION'))) {
    const pg = createPostgres()
    try {
      await pg.start()
      return pg
    } catch {
      await pg.stop().catch(() => {})
      rmSync(PG_DIR, { recursive: true, force: true })
    }
  }

  const pg = createPostgres()
  await pg.initialise()
  await pg.start()
  return pg
}

// Mỗi lần chạy dùng database trống để kết quả không phụ thuộc lần chạy trước
const recreateDatabase = async (pg: EmbeddedPostgres) => {
  const client = pg.getPgClient('postgres', '127.0.0.1')
  await client.connect()
  try {
    await client.query(`DROP DATABASE IF EXISTS ${DB_NAME} WITH (FORCE)`)
    await client.query(`CREATE DATABASE ${DB_NAME}`)
  } finally {
    await client.end()
  }
}

const waitForServer = async (server: ChildProcess, timeoutMs = 60_000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (server.exitCode !== null) break
    const healthy = await fetch(`${SERVER_URL}/api/v1/health`)
      .then((res) => res.ok)
      .catch(() => false)
    if (healthy) return
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`API server không khởi động được, xem log:\n${readFileSync(SERVER_LOG, 'utf8')}`)
}

export default async function globalSetup() {
  mkdirSync(TMP_DIR, { recursive: true })

  const pg = await startPostgres()
  const mailServer = await startMailServer({ smtpPort: PORTS.smtp, apiPort: PORTS.mailApi })
  let server: ChildProcess | undefined

  const teardown = async () => {
    server?.kill()
    await mailServer.close()
    await pg.stop()
  }

  try {
    await recreateDatabase(pg)
    await runToCompletion('Migration', [
      './node_modules/typeorm/cli.js',
      'migration:run',
      '-d',
      'src/databases/cli-data-source.ts'
    ])
    await runToCompletion('Seed admin', ['src/databases/seeds/admin.seed.ts'])

    server = runServerScript(['src/index.ts'])
    const log = createWriteStream(SERVER_LOG)
    server.stdout?.pipe(log)
    server.stderr?.pipe(log)
    await waitForServer(server)
  } catch (err) {
    await teardown()
    throw err
  }

  return teardown
}
