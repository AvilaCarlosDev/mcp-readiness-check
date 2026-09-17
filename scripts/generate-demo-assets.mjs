import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const outputDir = join(root, 'docs', 'assets')
const temporaryDir = mkdtempSync(join(tmpdir(), 'mcp-readiness-demo-'))

const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

const command = 'mcp-readiness-check check --cmd node --args examples/echo-server.mjs'

const runCli = () => {
  const stdout = execFileSync(
    process.execPath,
    ['dist/cli.js', 'check', '--cmd', 'node', '--args', 'examples/echo-server.mjs'],
    {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )

  return stdout
    .replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '')
    .trim()
}

const renderHtml = (output, visibleLines) => {
  const lines = output.split('\n')
  const visible = lines.slice(0, visibleLines).join('\n')
  const complete = visibleLines >= lines.length

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 1440px; height: 900px; overflow: hidden; }
    body {
      display: grid;
      place-items: center;
      padding: 68px;
      color: #e7f9f1;
      background:
        radial-gradient(circle at 18% 18%, rgba(52, 211, 153, .18), transparent 30%),
        radial-gradient(circle at 84% 8%, rgba(96, 165, 250, .14), transparent 28%),
        #07110f;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
    }
    .shell {
      width: 100%;
      height: 100%;
      overflow: hidden;
      border: 1px solid rgba(167, 243, 208, .2);
      border-radius: 24px;
      background: rgba(5, 14, 12, .94);
      box-shadow: 0 36px 100px rgba(0, 0, 0, .48);
    }
    .titlebar {
      height: 62px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 24px;
      border-bottom: 1px solid rgba(167, 243, 208, .12);
      background: rgba(255, 255, 255, .025);
    }
    .dot { width: 12px; height: 12px; border-radius: 999px; }
    .red { background: #fb7185; }
    .amber { background: #fbbf24; }
    .green { background: #34d399; }
    .brand {
      margin-left: 14px;
      color: #a7f3d0;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: .04em;
    }
    .badge {
      margin-left: auto;
      padding: 7px 11px;
      border: 1px solid rgba(52, 211, 153, .28);
      border-radius: 999px;
      color: #6ee7b7;
      font: 700 12px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .terminal { padding: 34px 40px; }
    .prompt {
      margin: 0 0 28px;
      color: #d1fae5;
      font: 600 19px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }
    .prompt::before { content: '$ '; color: #34d399; }
    pre {
      margin: 0;
      white-space: pre-wrap;
      color: #d5e9e2;
      font: 16px/1.46 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      tab-size: 2;
    }
    .cursor {
      display: ${complete ? 'none' : 'inline-block'};
      width: 9px;
      height: 18px;
      margin-left: 4px;
      vertical-align: -3px;
      background: #34d399;
    }
    .footer {
      position: absolute;
      right: 92px;
      bottom: 38px;
      color: rgba(209, 250, 229, .55);
      font-size: 13px;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <main class="shell" aria-label="MCP Readiness Check terminal demo">
    <header class="titlebar">
      <span class="dot red"></span><span class="dot amber"></span><span class="dot green"></span>
      <span class="brand">MCP Readiness Check</span>
      <span class="badge">real CLI output</span>
    </header>
    <section class="terminal">
      <p class="prompt">${escapeHtml(command)}</p>
      <pre>${escapeHtml(visible)}<span class="cursor"></span></pre>
    </section>
  </main>
  <div class="footer">stdio · JSON Schema · static security</div>
</body>
</html>`
}

const screenshot = (htmlPath, imagePath) => {
  execFileSync('google-chrome-stable', [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-sandbox',
    '--window-size=1440,900',
    `--screenshot=${imagePath}`,
    `file://${htmlPath}`,
  ], { stdio: 'ignore' })
}

try {
  mkdirSync(outputDir, { recursive: true })
  const output = runCli()
  const totalLines = output.split('\n').length
  const stages = [6, 14, totalLines]
  const frames = []

  for (const [index, visibleLines] of stages.entries()) {
    const htmlPath = join(temporaryDir, `frame-${index + 1}.html`)
    const imagePath = join(temporaryDir, `frame-${index + 1}.png`)
    writeFileSync(htmlPath, renderHtml(output, visibleLines))
    screenshot(htmlPath, imagePath)
    frames.push(imagePath)
  }

  const pngPath = join(outputDir, 'mcp-readiness-check-demo-portable.png')
  const gifPath = join(outputDir, 'mcp-readiness-check-demo-portable.gif')
  writeFileSync(pngPath, readFileSync(frames.at(-1)))
  execFileSync('magick', [
    '-delay', '90', frames[0],
    '-delay', '110', frames[1],
    '-delay', '260', frames[2],
    '-loop', '0',
    '-layers', 'Optimize',
    gifPath,
  ], { stdio: 'ignore' })

  console.log(`Generated ${pngPath}`)
  console.log(`Generated ${gifPath}`)
} finally {
  rmSync(temporaryDir, { recursive: true, force: true })
}
