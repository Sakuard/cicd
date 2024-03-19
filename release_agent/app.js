// @ts-check
const cron = require('cron').CronJob;
const $git = require('simple-git');
const { exec } = require('child_process');
const axios = require('axios');
const express = require('express');
const app = express();

const $fn = require('./syslog.js');
const $config = require('./config.js');

const $axios = axios.create({
    baseURL: $config.BASEURL,
    withCredentials: true,
})

let gitRepos = $config.GITREPOS;

const fetchCheck = async (gitRepos) => {
    let logParams = {
        func: 'fetchCheck()',
        location: 'app.js'
    };
    $fn.sysLogs(logParams);

    // 透過 Promise.all 並行處理所有 git 儲存庫的 fetch
    const fetchPromises = gitRepos.map(repo => {
        return new Promise(async (resolve, reject) => {
            try {
                console.log(`REPO: ${repo.name}`);
                const git = $git(repo.dir);

                await git.fetch();
                const diff = await git.diffSummary([`origin/${repo.br}`]);
                if (diff.files.find(file => file.file === 'package.json')) {
                    await git.pull();
                    console.log(`[${repo.name}] - Pulling & install ...`);
                    exec('npm install', { cwd: repo.dir} , (err, stdout, stderr) => {
                        if (err) {
                            logParams.type = 'error';
                            logParams.msg = err;
                            $fn.sysLogs(logParams);
                            reject(err);
                            return;
                        }
                        resolve('OK'); // Add an empty argument to resolve()
                        // $axios.post('/repo/update')
                    })
                } else if (diff.files.length > 0) {
                    console.log(`[${repo.name}] - Pulling ...`);
                    await git.pull();
                    resolve('OK'); // Add an empty argument to resolve()
                    // $axios.post('/repo/update')
                } else {
                    console.log(`[${repo.name}] - No update.`);
                    resolve('OK'); // Add an empty argument to resolve()
                }
            } catch (err) {
                logParams.type = 'error';
                logParams.msg = err;
                $fn.sysLogs(logParams);
                reject(err);
            }
        });
    });

    // 使用Promise.all等待所有Repo的fetch操作完成
    try {
        await Promise.all(fetchPromises);
    } catch (err) {
        logParams.type = 'error';
        logParams.msg = err;
        $fn.sysLogs(logParams);
    }
};

const gitFetch = cron.from({
    cronTime: '0 */30 * * * *',
    onTick: async () => {
        await fetchCheck(gitRepos); // 在每次 cron 觸發時檢查 git 儲存庫更新
    },
    start: true,
    timeZone: 'Asia/Taipei'
});
/** /repo/update */
app.post('/repo/release', async (req, res) => {
    res.send('OK');
    console.log(`[START] - release ...`);
    await fetchCheck(gitRepos);
    console.log(`[START] - update ...`);
    $axios.post('/repo/update');
})
app.listen($config.PORT, () => {
    console.log(`CI/CD Server is on PORT:${$config.PORT} ...`)
})
