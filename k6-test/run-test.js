import { execSync } from 'child_process';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────
//  Colors
// ─────────────────────────────────────────────
const C = {
  cyan:      '\x1b[36m',
  green:     '\x1b[32m',
  yellow:    '\x1b[33m',
  magenta:   '\x1b[35m',
  red:       '\x1b[31m',
  blue:      '\x1b[34m',
  bold:      '\x1b[1m',
  reset:     '\x1b[0m',
  dim:       '\x1b[2m',
  bgBlue:    '\x1b[44m',
  bgGreen:   '\x1b[42m',
  bgRed:     '\x1b[41m',
  bgYellow:  '\x1b[43m',
  bgMagenta: '\x1b[45m',
  bgCyan:    '\x1b[46m',
};

// ─────────────────────────────────────────────
//  Environment (fixed)
// ─────────────────────────────────────────────
const ENV_FILE = path.join(__dirname, 'env', 'Lawang-Core.environment.json');

// ─────────────────────────────────────────────
//  Test types
// ─────────────────────────────────────────────
const TEST_TYPES = [
  {
    name:  'Smoke Test',
    file:  'test/smoke.test.js',
    color: C.magenta,
    bg:    C.bgMagenta,
    label: 'SMOKE',
    desc:  '2 VU · 1 menit · sanity check',
  },
  {
    name:  'Load Test',
    file:  'test/load.test.js',
    color: C.blue,
    bg:    C.bgBlue,
    label: 'LOAD',
    desc:  '100 VU · ~14 menit · performa normal',
  },
  {
    name:  'Stress Test',
    file:  'test/stress.test.js',
    color: C.red,
    bg:    C.bgRed,
    label: 'STRESS',
    desc:  'up to 1000 VU · ~14 menit · breaking point',
  },
  {
    name:  'Soak Test',
    file:  'test/soak.test.js',
    color: C.yellow,
    bg:    C.bgYellow,
    label: 'SOAK',
    desc:  '100 VU · 8 jam · stabilitas jangka panjang',
  },
];

// ─────────────────────────────────────────────
//  Readline helper
// ─────────────────────────────────────────────
const rl = readline.createInterface({
  input:  process.stdin,
  output: process.stdout,
});

const ask = (question) =>
  new Promise((resolve) => rl.question(question, (ans) => resolve(ans.trim())));

// ─────────────────────────────────────────────
//  UI helpers
// ─────────────────────────────────────────────
function printHeader() {
  console.log('\n' + '═'.repeat(60));
  console.log(
    `${C.bgBlue}${C.bold}               K6 PERFORMANCE TEST RUNNER              ${C.reset}`
  );
  console.log('═'.repeat(60));
}

function printMenu(title, items, noteBottom = '') {
  console.log(`\n${C.bold}${C.cyan}${title}${C.reset}\n`);
  items.forEach(({ label, color = C.reset, prefix = '' }) => {
    console.log(
      `  ${color}${C.bold}${String(prefix).padStart(2)}${C.reset}  ${C.yellow}┃${C.reset}  ${color}${label}${C.reset}`
    );
  });
  console.log('\n' + '─'.repeat(60));
  if (noteBottom) console.log(`${C.dim}  ${noteBottom}${C.reset}`);
  console.log('─'.repeat(60) + '\n');
}

// ─────────────────────────────────────────────
//  Runner
// ─────────────────────────────────────────────
function runK6(testFile) {
  const testPath = path.join(__dirname, testFile);
  const command  = `k6 run "${testPath}" --env ENV_FILE="${ENV_FILE}"`;

  try {
    execSync(command, { stdio: 'inherit', cwd: __dirname });
  } catch {
    console.error(
      `\n${C.yellow}${C.bold}Test selesai dengan beberapa kegagalan threshold.${C.reset}\n`
    );
  }
}

// ─────────────────────────────────────────────
//  Soak confirmation
// ─────────────────────────────────────────────
async function confirmSoak() {
  console.log(`\n${C.bgYellow}${C.bold}  ⚠  PERHATIAN — SOAK TEST  ${C.reset}`);
  console.log(`${C.yellow}  Test ini akan berjalan selama ±1 jam.${C.reset}`);
  console.log(`${C.yellow}  Pastikan kamu tidak menutup terminal ini.${C.reset}\n`);
  const confirm = await ask(`${C.bold}Lanjutkan? (y/n): ${C.reset}`);
  return confirm.toLowerCase() === 'y';
}

// ─────────────────────────────────────────────
//  Main menu
// ─────────────────────────────────────────────
async function showTestTypeMenu() {
  printHeader();
  printMenu(
    'PILIH JENIS TEST:',
    TEST_TYPES.map((t, i) => ({
      label:  `[${t.label.padEnd(6)}]  ${t.name.padEnd(14)}  ${C.dim}${t.desc}${C.reset}`,
      color:  t.color,
      prefix: i + 1,
    })),
    '0 = Keluar'
  );

  const answer = parseInt(await ask(`${C.bold}Pilih jenis test: ${C.reset}`));

  if (answer === 0) {
    console.log(`\n${C.dim}  Sampai jumpa!${C.reset}\n`);
    rl.close();
    return;
  }

  if (isNaN(answer) || answer < 1 || answer > TEST_TYPES.length) {
    console.log(`\n${C.yellow}Pilihan tidak valid!${C.reset}`);
    rl.close();
    return;
  }

  const selected = TEST_TYPES[answer - 1];

  if (selected.label === 'SOAK') {
    const confirmed = await confirmSoak();
    if (!confirmed) {
      console.log(`\n${C.dim}  Soak test dibatalkan.${C.reset}\n`);
      rl.close();
      return;
    }
  }

  rl.close();

  console.log('\n' + '═'.repeat(60));
  console.log(`${selected.bg}${C.bold}  RUNNING: ${selected.name.padEnd(43)} ${C.reset}`);
  console.log('═'.repeat(60));
  console.log(`${C.dim}  File  : ${selected.file}${C.reset}`);
  console.log(`${C.dim}  Beban : ${selected.desc}${C.reset}`);
  console.log('─'.repeat(60) + '\n');

  runK6(selected.file);

  console.log('\n' + '═'.repeat(60));
  console.log(`${C.bgGreen}${C.bold}  SELESAI: ${selected.name.padEnd(43)} ${C.reset}`);
  console.log('═'.repeat(60) + '\n');
}

// ─────────────────────────────────────────────
//  Entry point
// ─────────────────────────────────────────────
showTestTypeMenu();