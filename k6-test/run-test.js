import { execSync } from 'child_process';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

import beforeScenario from '../helper/before-scenario/beforeScenario-k6.js';
import afterScenario from '../helper/after-scenario/afterScenario-k6.js';
import restartService from '../helper/services/restartServerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);


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

const SKIP_SCENARIO_MENU = true;

const ENV_FILE = path.join(__dirname, 'env', 'Lawang-Core.environment.json');

const TEST_SCENARIO = [
  {
    name:  'HTTP PREFORK',
    color: C.blue,
    bg:    C.bgBlue,
    before: async () => {
      await afterScenario.disableHttps();
      await beforeScenario.enablePrefork();
      await restartService();
    },
    after: async () => {
      await beforeScenario.enableHttps();
      await afterScenario.disablePrefork();
      await restartService();
    },
  },
  {
    name:  'HTTP NON PREFORK',
    color: C.cyan,
    bg:    C.bgCyan,
    before: async () => {
      await afterScenario.disableHttps();
      await afterScenario.disablePrefork();
      await restartService();
    },
    after: async () => {
      await beforeScenario.enableHttps();
      await restartService();
    },
  },
  {
    name:  'HTTPS PREFORK',
    color: C.magenta,
    bg:    C.bgMagenta,
    before: async () => {
      await beforeScenario.enableHttps();
      await afterScenario.disableHttp2();
      await beforeScenario.enablePrefork();
      await restartService();
    },
    after: async () => {
      await afterScenario.disablePrefork();
      await restartService();
    },
  },
  {
    name:  'HTTPS NON PREFORK',
    color: C.green,
    bg:    C.bgGreen,
    before: async () => {
      await beforeScenario.enableHttps();
      await beforeScenario.enableHttp2();
      await afterScenario.disablePrefork();
      await restartService();
    },
    after: async () => {},
  },
];

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
    desc:  '100 VU · 14 menit · performa normal',
  },
  {
    name:  'Stress Test',
    file:  'test/stress.test.js',
    color: C.red,
    bg:    C.bgRed,
    label: 'STRESS',
    desc:  'up to 1000 VU · 14 menit · breaking point',
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


const rl = readline.createInterface({
  input:  process.stdin,
  output: process.stdout,
});

const ask = (question) =>
  new Promise((resolve) => rl.question(question, (ans) => resolve(ans.trim())));


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


function runK6(testFile) {
  const command = `k6 run "${testFile}" --env ENV_FILE="${ENV_FILE}"`;
  try {
    execSync(command, { stdio: 'inherit', cwd: __dirname });
  } catch {
    console.error(
      `\n${C.yellow}${C.bold}Test selesai dengan beberapa kegagalan threshold.${C.reset}\n`
    );
  }
}

async function runDirect(testType) {
  console.log('\n' + '═'.repeat(60));
  console.log(`${testType.bg}${C.bold}  RUNNING: ${testType.name.padEnd(43)} ${C.reset}`);
  console.log('═'.repeat(60));
  console.log(`${C.dim}  File  : ${testType.file}${C.reset}`);
  console.log(`${C.dim}  Beban : ${testType.desc}${C.reset}`);
  console.log('─'.repeat(60) + '\n');

  runK6(testType.file);

  console.log('\n' + '═'.repeat(60));
  console.log(`${C.bgGreen}${C.bold}  SELESAI: ${testType.name.padEnd(43)} ${C.reset}`);
  console.log('═'.repeat(60) + '\n');
}

async function runWithScenario(scenario, testType) {
  // BEFORE
  console.log(`\n${C.cyan}${C.bold}[SETUP] Menjalankan before scenario "${scenario.name}"...${C.reset}`);
  try {
    await scenario.before();
    console.log(`${C.green}${C.bold}[SETUP] Selesai.${C.reset}\n`);
  } catch (err) {
    console.error(`\n${C.red}${C.bold}[SETUP] GAGAL — test dibatalkan.${C.reset}`);
    console.error(`${C.red}${err.message}${C.reset}\n`);
    console.log(err);
    return;
  }

  // RUN
  console.log('\n' + '═'.repeat(60));
  console.log(`${testType.bg}${C.bold}  RUNNING: ${testType.name.padEnd(43)} ${C.reset}`);
  console.log('═'.repeat(60));
  console.log(`${C.dim}  Scenario : ${scenario.name}${C.reset}`);
  console.log(`${C.dim}  File     : ${testType.file}${C.reset}`);
  console.log(`${C.dim}  Beban    : ${testType.desc}${C.reset}`);
  console.log('─'.repeat(60) + '\n');

  runK6(testType.file);

  // AFTER
  console.log(`\n${C.cyan}${C.bold}[TEARDOWN] Menjalankan after scenario "${scenario.name}"...${C.reset}`);
  try {
    await scenario.after();
    console.log(`${C.green}${C.bold}[TEARDOWN] Selesai.${C.reset}\n`);
  } catch (err) {
    console.error(`\n${C.red}${C.bold}[TEARDOWN] GAGAL.${C.reset}`);
    console.error(`${C.red}${err.message}${C.reset}\n`);
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`${C.bgGreen}${C.bold}  SELESAI: ${testType.name.padEnd(43)} ${C.reset}`);
  console.log('═'.repeat(60) + '\n');
}


async function confirmSoak() {
  console.log(`\n${C.bgYellow}${C.bold}  ⚠  PERHATIAN — SOAK TEST  ${C.reset}`);
  console.log(`${C.yellow}  Test ini akan berjalan selama ±1 jam.${C.reset}`);
  console.log(`${C.yellow}  Pastikan kamu tidak menutup terminal ini.${C.reset}\n`);
  const confirm = await ask(`${C.bold}Lanjutkan? (y/n): ${C.reset}`);
  return confirm.toLowerCase() === 'y';
}

async function showScenarioMenu() {
  printHeader();
  printMenu(
    'PILIH TEST SCENARIO:',
    TEST_SCENARIO.map((s, i) => ({
      label:  s.name,
      color:  s.color,
      prefix: i + 1,
    })),
    '0 = Keluar'
  );

  const answer = parseInt(await ask(`${C.bold}Pilih scenario: ${C.reset}`));

  if (answer === 0) {
    console.log(`\n${C.dim}  Sampai jumpa!${C.reset}\n`);
    rl.close();
    return;
  }

  if (isNaN(answer) || answer < 1 || answer > TEST_SCENARIO.length) {
    console.log(`\n${C.yellow}Pilihan tidak valid!${C.reset}`);
    rl.close();
    return;
  }

  showTestTypeMenu(TEST_SCENARIO[answer - 1]);
}

async function showTestTypeMenu(selectedScenario = null) {
  printHeader();
  if (selectedScenario) {
    console.log(
      `\n${C.dim}  Scenario: ${selectedScenario.color}${C.bold}${selectedScenario.name}${C.reset}\n`
    );
  }
  printMenu(
    'PILIH JENIS TEST:',
    TEST_TYPES.map((t, i) => ({
      label:  `[${t.label.padEnd(6)}]  ${t.name.padEnd(14)}  ${C.dim}${t.desc}${C.reset}`,
      color:  t.color,
      prefix: i + 1,
    })),
    SKIP_SCENARIO_MENU ? '0 = Keluar' : '0 = Kembali ke pilih scenario'
  );

  const answer = parseInt(await ask(`${C.bold}Pilih jenis test: ${C.reset}`));

  if (answer === 0) {
    if (SKIP_SCENARIO_MENU) {
      console.log(`\n${C.dim}  Sampai jumpa!${C.reset}\n`);
      rl.close();
      return;
    }
    return showScenarioMenu();
  }

  if (isNaN(answer) || answer < 1 || answer > TEST_TYPES.length) {
    console.log(`\n${C.yellow}Pilihan tidak valid!${C.reset}`);
    rl.close();
    return;
  }

  const selectedType = TEST_TYPES[answer - 1];

  if (selectedType.label === 'SOAK') {
    const confirmed = await confirmSoak();
    if (!confirmed) {
      console.log(`\n${C.dim}  Soak test dibatalkan.${C.reset}\n`);
      rl.close();
      return;
    }
  }

  rl.close();

  if (SKIP_SCENARIO_MENU) {
    await runDirect(selectedType);
  } else {
    await runWithScenario(selectedScenario, selectedType);
  }
}


if (SKIP_SCENARIO_MENU) {
  showTestTypeMenu();
} else {
  showScenarioMenu();
}