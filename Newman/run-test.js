import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import beforeScenario from '../helper/before-scenario/beforeScenario-newman.js';
import afterScenario from '../helper/after-scenario/afterScenario-newman.js';
import restartService from '../helper/services/restartServerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const C = {
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
};

process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '';
if (!process.env.NODE_OPTIONS.includes('--no-deprecation')) {
  process.env.NODE_OPTIONS += ' --no-deprecation';
}


//Environment

const ENVIRONMENTS = [
  {
    name: 'Local',
    file: 'Local.postman_environment.json',
    color: C.green,
    label: 'LOCAL',
  },
  {
    name: 'Dev',
    file: 'Lawang-Core.postman_environment.json',
    color: C.cyan,
    label: 'DEV',
  },
];


//collections

const COLLECTIONS = [
  {
    name: 'Test Normal Flow',
    file: 'Lawang - Normal Flow.postman_collection.json',
    color: C.green,
    bg: C.bgGreen,
    before: async () => {},
    after: async () => {},
  },
  {
    name: 'Test Blacklist IP',
    file: 'Test Blacklist IP.postman_collection.json',
    color: C.red,
    bg: C.bgRed,
    before: async () => {
      await beforeScenario.setIpBlock();
      await restartService();
    },
    after: async () => {
      await afterScenario.removeIpFromBlackList();
      await restartService();
    },
  },
  {
    name: 'Test Security Header',
    file: 'Test Security Header.postman_collection.json',
    color: C.blue,
    bg: C.bgYellow,
    before: async () => {
      await beforeScenario.setSecurityHeaderOn();
      await restartService();
    },
    after: async () => {
      await afterScenario.setSecurityHeaderOff();
      await restartService();
    },
  },
  {
    name: 'Test CORS',
    file: 'Test CORS.postman_collection.json',
    color: C.magenta,
    bg: C.bgMagenta,
    before: async () => {
      await beforeScenario.setCorsOn();
      await restartService();
    },
    after: async () => {
      await afterScenario.setCorsOff();
      await restartService();
    },
  },
];


const DIR = {
  collections: path.join(__dirname, 'collections'),
  env: path.join(__dirname, 'env'),
};


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question) =>
  new Promise((resolve) => rl.question(question, (ans) => resolve(ans.trim())));


function printHeader() {
  console.log('\n' + '═'.repeat(60));
  console.log(
    `${C.bgBlue}${C.bold}              NEWMAN API TEST RUNNER               ${C.reset}`
  );
  console.log('═'.repeat(60));
}

function printMenu(title, items, noteBottom = '') {
  console.log(`\n${C.bold}${C.cyan}${title}${C.reset}\n`);
  items.forEach(({ label, color = C.reset, prefix = '' }) => {
    console.log(
      `  ${color}${C.bold}${prefix}${C.reset}  ${C.yellow}┃${C.reset}  ${color}${label}${C.reset}`
    );
  });
  console.log('\n' + '─'.repeat(60));
  if (noteBottom) console.log(`${C.dim}  ${noteBottom}${C.reset}`);
  console.log('─'.repeat(60) + '\n');
}


function loadCollection(filename) {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(DIR.collections, filename), 'utf8')
    );
  } catch {
    return null;
  }
}

function getFolders(collection) {
  return collection.item.filter((item) => item.item).map((item) => item.name);
}

function runNewman(collectionPath, envPath, folder = null) {
  const base = `npx newman run "${collectionPath}" -e "${envPath}" --insecure`;
  const command = folder ? `${base} --folder "${folder}"` : base;
  try {
    execSync(command, { stdio: 'inherit', cwd: __dirname });
  } catch {
    console.error(`\n${C.yellow}Test selesai dengan beberapa error.${C.reset}`);
  }
}

async function runWithScenario(col, folders, folderChoice, envFile, envName) {
  const collectionPath = path.join(DIR.collections, col.file);
  const envPath = path.join(DIR.env, envFile);
  const selectedFolder =
    folderChoice <= folders.length ? folders[folderChoice - 1] : null;

  // 1. BEFORE
  console.log(
    `\n${C.cyan}${C.bold}[SETUP] Menjalankan before scenario untuk "${col.name}"...${C.reset}`
  );
  try {
    await col.before();
    console.log(`${C.green}${C.bold}[SETUP] Selesai.${C.reset}\n`);
  } catch (err) {
    console.error(
      `\n${C.red}${C.bold}[SETUP] GAGAL — test dibatalkan.${C.reset}`
    );
    console.error(`${C.red}${err.message}${C.reset}\n`);
    return;
  }


  console.log('\n' + '═'.repeat(60));
  console.log(`${col.bg}${C.bold}  RUNNING: ${col.name.padEnd(42)} ${C.reset}`);
  console.log('═'.repeat(60));
  console.log(`${C.dim}Environment: ${envName}${C.reset}\n`);
  if (selectedFolder)
    console.log(`${C.bold}Folder: ${selectedFolder}${C.reset}\n`);

  runNewman(collectionPath, envPath, selectedFolder);


  console.log(
    `\n${C.cyan}${C.bold}[TEARDOWN] Menjalankan after scenario untuk "${col.name}"...${C.reset}`
  );
  try {
    await col.after();
    console.log(`${C.green}${C.bold}[TEARDOWN] Selesai.${C.reset}\n`);
  } catch (err) {
    console.error(`\n${C.red}${C.bold}[TEARDOWN] GAGAL.${C.reset}`);
    console.error(`${C.red}${err.message}${C.reset}\n`);
  }

  process.exit(0);
}


async function showEnvMenu() {
  printHeader();
  printMenu(
    'PILIH ENVIRONMENT:',
    ENVIRONMENTS.map((env, i) => ({
      label: `[${env.label}]  ${env.name}`,
      color: env.color,
      prefix: i + 1,
    })),
    'Pilih environment variable sebelum melanjutkan testing'
  );

  const answer = parseInt(await ask(`${C.bold}Pilih environment:${C.reset} `));

  if (isNaN(answer) || answer < 1 || answer > ENVIRONMENTS.length) {
    console.log(`\n${C.yellow}Pilihan tidak valid!${C.reset}`);
    rl.close();
    return;
  }

  showCollectionMenu(ENVIRONMENTS[answer - 1]);
}

async function showCollectionMenu(selectedEnv) {
  printHeader();
  console.log(
    `\n${C.dim}  Environment: ${selectedEnv.color}${C.bold}${selectedEnv.name}${C.reset}\n`
  );
  printMenu(
    'COLLECTIONS:',
    COLLECTIONS.map((col, i) => ({
      label: col.name,
      color: col.color,
      prefix: i + 1,
    })),
    '0 = Kembali ke pilih environment'
  );

  const answer = parseInt(await ask(`${C.bold}Pilih collection:${C.reset} `));

  if (answer === 0) return showEnvMenu();

  if (isNaN(answer) || answer < 1 || answer > COLLECTIONS.length) {
    console.log(`\n${C.yellow}Pilihan tidak valid!${C.reset}`);
    rl.close();
    return;
  }

  const col = COLLECTIONS[answer - 1];
  const collection = loadCollection(col.file);

  if (!collection) {
    console.log(`\n${C.red}Error: Tidak dapat membaca collection.${C.reset}`);
    rl.close();
    return;
  }

  showFolderMenu(col, getFolders(collection), selectedEnv);
}

async function showFolderMenu(col, folders, selectedEnv) {
  printHeader();
  console.log('\n' + '═'.repeat(60));
  console.log(`${col.bg}${C.bold}  ${col.name.padEnd(50)} ${C.reset}`);
  console.log('═'.repeat(60));
  console.log(
    `${C.dim}  Environment: ${selectedEnv.color}${C.bold}${selectedEnv.name}${C.reset}\n`
  );

  printMenu(
    'PILIH FOLDER:',
    [
      ...folders.map((f, i) => ({
        label: f.length > 40 ? f.substring(0, 37) + '...' : f,
        color: C.green,
        prefix: String(i + 1).padStart(2),
      })),
      {
        label: 'JALANKAN SEMUA',
        color: C.magenta,
        prefix: String(folders.length + 1).padStart(2),
      },
    ],
    '0 = Kembali ke daftar collection'
  );

  const answer = parseInt(await ask(`${C.bold}Pilih folder:${C.reset} `));

  if (answer === 0) return showCollectionMenu(selectedEnv);

  if (isNaN(answer) || answer < 1 || answer > folders.length + 1) {
    console.log(`\n${C.yellow}Pilihan tidak valid!${C.reset}`);
    rl.close();
    return;
  }

  rl.close();
  await runWithScenario(
    col,
    folders,
    answer,
    selectedEnv.file,
    selectedEnv.name
  );
}


showEnvMenu();
