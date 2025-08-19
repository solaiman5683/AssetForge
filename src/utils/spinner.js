const frames = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
export function createSpinner(text = "") {
  let i = 0, timer;
  return {
    start() {
      if (timer) return;
      timer = setInterval(() => {
        process.stdout.write(`\r${frames[i = (i+1)%frames.length]} ${text}`);
      }, 80);
    },
    stop(msg = "") {
      if (timer) {
        clearInterval(timer);
        timer = null;
        process.stdout.write(`\r✔ ${text} ${msg}\n`);
      }
    },
    fail(msg = "") {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      process.stdout.write(`\r✖ ${text} ${msg}\n`);
    }
  };
}