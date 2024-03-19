const CronJob = require('cron').CronJob;
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs-extra');
const express = require('express');
const app = express();

const $config = require('./config.js');

const ignore = ['.git'];  // 這裡填入你要忽略的資料夾名稱

const port = $config.PORT;
const syncLink = $config.SYNCLINK;

const syncFiles = async (src, dest) => {
  if (ignore.includes(path.basename(src))) {
    // console.log(`Ignoring folder ${src}`);
    return;
  }

  await fs.ensureDir(dest);
  const entries = await fs.readdir(src, { withFileTypes: true });
  const destEntries = await fs.readdir(dest, { withFileTypes: true });

  /** For Delete */
  // const srcFilenames = entries.map(entry => entry.name);
  // const destFilenames = destEntries.map(entry => entry.name);
  // for (const destEntry of destFilenames) {
  //   if (!srcFilenames.includes(destEntry)) {
  //     await fs.remove(path.join(dest, destEntry));
  //     console.log(`Deleted from backup folder, path: ${path.join(dest, destEntry)}`);
  //   }
  // }
  let modified = false;
  try {
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
  
      if (entry.isDirectory()) {
        await syncFiles(srcPath, destPath);
      } else {
        const [srcStat, destStat] = await Promise.all([fs.stat(srcPath), fs.stat(destPath).catch(() => {})]);
  
        if (!destStat || srcStat.mtime > destStat.mtime) {
          await fs.copy(srcPath, destPath);
          // console.log(`Copied to backup folder, path: ${srcPath}`);
          modified = true;
        }
      }
    }
  } catch(err) {

  }
};


const run = async () => {
  let now = new Date();
  let localTimeStr = now.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });

  console.log(`start filesync: ${localTimeStr}`);
  // await syncFiles(sourceDir, destinationDir);
  for (let link of syncLink) {
    await syncFiles(link.sourceDir, link.destDir);
  }

  now = new Date();
  localTimeStr = now.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
  console.log(`Task finished at: ${localTimeStr}`);
};

const fileSyncZ = new CronJob({
  // cronTime: '30 12,17 * * 1-5',
  cronTime: '0 35 0,12 * * 1-5',
  onTick: function() {
    run();
  },
  timeZone: 'Asia/Taipei'
});

fileSyncZ.start();
const now = new Date();
const localTimeStr = now.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
console.log(`fileSyncZ started at: ${localTimeStr}`);

// run();

app.post('/repo/update', (req, res) => {
  // fetchCheck(gitRepos);
  console.log(`exec update`)
  res.send('OK');
  run();
})
app.listen(port, () => {
  console.log(`Start CI/CD server ...`);
});