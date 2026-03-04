import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Pengganti __dirname di ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const magenta = '\x1b[35m';
const red = '\x1b[31m';
const blue = '\x1b[34m';
const bold = '\x1b[1m';
const reset = '\x1b[0m';
const dim = '\x1b[2m';
const bgBlue = '\x1b[44m';
const bgGreen = '\x1b[42m';
const bgRed = '\x1b[41m';
const bgYellow = '\x1b[43m';
const bgMagenta = '\x1b[45m';
const bgCyan = '\x1b[46m';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const collections = [
  {
    name: 'Test Normal Flow',
    file: 'Test API Lawang.postman_collection.json',
    color: green,
    bg: bgGreen,
  },
  {
    name: 'Test Blacklist IP',
    file: 'Test Blacklist IP.postman_collection.json',
    color: red,
    bg: bgRed,
  },
  {
    name: 'Test Security Header',
    file: 'Test Security Header.postman_collection.json',
    color: blue,
    bg: bgYellow,
  },
  {
    name: 'Test CORS',
    file: 'Test CORS.postman_collection.json',
    color: magenta,
    bg: bgMagenta,
  },
];

const environments = [
  {
    name: 'Local',
    file: 'Local.postman_environment.json',
    color: green,
    bg: bgGreen,
    label: 'LOCAL',
  },
  {
    name: 'Dev',
    file: 'Lawang-Core.postman_environment.json',
    color: cyan,
    bg: bgCyan,
    label: 'DEV',
  },
];

const collectionsDir = path.join(__dirname, 'collections');
const envDir = path.join(__dirname, 'env');

function printHeader() {
  console.log('\n' + '═'.repeat(60));
  console.log(
    `${bgBlue}${bold}              NEWMAN API TEST RUNNER               ${reset}`
  );
  console.log('═'.repeat(60));
}

function printEnvMenu() {
  console.log(`\n${bold}${cyan}PILIH ENVIRONMENT:${reset}\n`);

  environments.forEach((env, index) => {
    const num = `${env.color}${bold}${index + 1}${reset}`;
    console.log(
      `  ${num}  ${yellow}┃${reset}  ${env.color}${bold}[${env.label}]${reset}  ${env.name}`
    );
  });

  console.log('\n' + '─'.repeat(60));
  console.log(
    `${dim}  Pilih environment variable sebelum melanjutkan testing${reset}`
  );
  console.log('─'.repeat(60) + '\n');
}

function printCollectionMenu(envName, envColor) {
  console.log(`\n${dim}  Environment: ${envColor}${bold}${envName}${reset}\n`);
  console.log(`${bold}${cyan}COLLECTIONS:${reset}\n`);

  collections.forEach((col, index) => {
    const num = `${col.color}${bold}${index + 1}${reset}`;
    console.log(
      `  ${num}  ${yellow}┃${reset}  ${col.color}${col.name}${reset}`
    );
  });

  console.log('\n' + '─'.repeat(60));
  console.log(`${dim}  0 = Kembali ke pilih environment${reset}`);
  console.log('─'.repeat(60) + '\n');
}

function printFolderMenu(folders, collectionName, colBg, envName, envColor) {
  console.log('\n' + '═'.repeat(60));
  console.log(`${colBg}${bold}  ${collectionName.padEnd(50)} ${reset}`);
  console.log('═'.repeat(60));
  console.log(`${dim}  Environment: ${envColor}${bold}${envName}${reset}\n`);
  console.log(`${bold}${cyan}PILIH FOLDER:${reset}\n`);

  folders.forEach((folder, index) => {
    const num = `${green}${bold}${String(index + 1).padStart(2)}${reset}`;
    const displayName =
      folder.length > 40 ? folder.substring(0, 37) + '...' : folder;
    console.log(`  ${num}  ${green}┃${reset}  ${displayName}`);
  });

  console.log(
    `\n  ${magenta}${bold}${String(folders.length + 1).padStart(2)}${reset}  ${yellow}┃${reset}  ${magenta}${bold}JALANKAN SEMUA${reset}`
  );
  console.log('\n' + '─'.repeat(60));
  console.log(`${dim}  0 = Kembali ke daftar collection${reset}`);
  console.log('─'.repeat(60) + '\n');
}

function runTest(
  collectionPath,
  choice,
  folders,
  collectionName,
  colBg,
  envFile,
  envName
) {
  console.log('\n' + '═'.repeat(60));
  console.log(
    `${colBg}${bold}  RUNNING: ${collectionName.padEnd(42)} ${reset}`
  );
  console.log('═'.repeat(60) + '\n');

  const envPath = path.join(envDir, envFile);
  let command;

  if (choice === folders.length + 1) {
    command = `npx newman run "${collectionPath}" -e "${envPath}" --insecure`;
  } else {
    const selectedFolder = folders[choice - 1];
    console.log(`${bold}Folder: ${selectedFolder}${reset}`);
    command = `npx newman run "${collectionPath}" -e "${envPath}" --folder "${selectedFolder}" --insecure`;
  }

  console.log(`${dim}Environment: ${envName}${reset}\n`);

  try {
    execSync(command, { stdio: 'inherit', cwd: __dirname });
  } catch (error) {
    console.error(`\n${yellow}Test selesai dengan beberapa error.${reset}`);
  }
}

function loadCollection(filename) {
  try {
    const filePath = path.join(collectionsDir, filename);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return null;
  }
}

function showEnvMenu() {
  printHeader();
  printEnvMenu();

  rl.question(`${bold}Pilih environment:${reset} `, (answer) => {
    const choice = parseInt(answer.trim());

    if (isNaN(choice) || choice < 1 || choice > environments.length) {
      console.log(`\n${yellow}Pilihan tidak valid!${reset}`);
      rl.close();
      return;
    }

    const selectedEnv = environments[choice - 1];
    showCollectionMenu(selectedEnv);
  });
}

function showCollectionMenu(selectedEnv) {
  printHeader();
  printCollectionMenu(selectedEnv.name, selectedEnv.color);

  rl.question(`${bold}Pilih collection:${reset} `, (answer) => {
    const choice = parseInt(answer.trim());

    if (choice === 0) {
      showEnvMenu();
      return;
    }

    if (isNaN(choice) || choice < 1 || choice > collections.length) {
      console.log(`\n${yellow}Pilihan tidak valid!${reset}`);
      rl.close();
      return;
    }

    const col = collections[choice - 1];
    const collection = loadCollection(col.file);

    if (!collection) {
      console.log(`\n${red}Error: Tidak dapat membaca collection.${reset}`);
      rl.close();
      return;
    }

    const folders = collection.item
      .filter((item) => item.item)
      .map((item) => item.name);
    showFolderMenu(folders, col.name, col.color, col.bg, col.file, selectedEnv);
  });
}

function showFolderMenu(
  folders,
  collectionName,
  colColor,
  colBg,
  collectionFile,
  selectedEnv
) {
  printHeader();
  printFolderMenu(
    folders,
    collectionName,
    colColor,
    colBg,
    selectedEnv.name,
    selectedEnv.color
  );

  rl.question(`${bold}Pilih folder:${reset} `, (answer) => {
    const choice = parseInt(answer.trim());

    if (choice === 0) {
      showCollectionMenu(selectedEnv);
      return;
    }

    if (isNaN(choice) || choice < 1 || choice > folders.length + 1) {
      console.log(`\n${yellow}Pilihan tidak valid!${reset}`);
      rl.close();
      return;
    }

    const collectionPath = path.join(collectionsDir, collectionFile);
    runTest(
      collectionPath,
      choice,
      folders,
      collectionName,
      colBg,
      selectedEnv.file,
      selectedEnv.name
    );
    rl.close();
  });
}

showEnvMenu();
