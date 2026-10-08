export default function spinner(text) {
  if (!process.stdout.isTTY) {
    console.log(text);
    return {
      success: (msg) => console.log(`[OK] ${msg}`),
      fail: (msg) => console.log(`[FAIL] ${msg}`),
    };
  }
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const interval = setInterval(() => {
    process.stdout.write(
      `\r\x1b[36m${frames[i++ % frames.length]}\x1b[0m ${text}`
    );
  }, 80);
  return {
    success: (msg) => {
      clearInterval(interval);
      process.stdout.write(`\r✅ \x1b[32m${msg}\x1b[0m\n`);
    },
    fail: (msg) => {
      clearInterval(interval);
      process.stdout.write(`\r❌ \x1b[31m${msg}\x1b[0m\n`);
    },
  };
}
