// @ts-check
const cron = require('cron').CronJob;
const $git = require('simple-git');
const { exec } = require('child_process');
const axios = require('axios');
const express = require('express');
const app = express();
app.use(express.json());

const $fn = require('./syslog.js');
const $config = require('./config.js');
const $handler = require('./handler.js');

const $axios = axios.create({
    baseURL: $config.BASEURL,
    withCredentials: true,
})

let gitRepos = $config.GITREPOS;
let svnRepos = $config.SVNREPOS;

const gitFetchCheck = async (gitRepos) => {
    let logParams = {
        func: 'gitFetchCheck()',
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
                    // console.log(`[${repo.name}] - Pulling update ...`);
                    logParams.type = 'process';
                    logParams.msg = `[${repo.name}] - Pulling update ...`
                    $fn.sysLogs(logParams);
                    await git.pull();
                    resolve('OK'); // Add an empty argument to resolve()
                    // $axios.post('/repo/update')
                } else {
                    // console.log(`[${repo.name}] - No update.`);
                    logParams.type = 'process';
                    logParams.msg = `[${repo.name}] - No update.`
                    $fn.sysLogs(logParams);
                    resolve('OK'); // Add an empty argument to resolve()
                }
            } catch (err) {
                logParams.func = 'gitFetchCheck()/$git()'
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
const svnFetchCheck = async (svnRepos) => {
    let logParams = {
        func: 'svnFetchCheck()',
        location: 'app.js'
    };
    $fn.sysLogs(logParams);
    for (const repo of svnRepos) {
        try {
            exec(`svn update ${repo.dir}`, async (err, stdout, stderr) => {
                if (err) {
                    logParams.func = 'svnFetchCheck()/exec()'
                    logParams.type = 'error';
                    logParams.msg = err;
                    $fn.sysLogs(logParams);
                    return;
                }
                if (/Updated to revision/.test(stdout)) {
                    console.log(`[${repo.name}] - Updated.`);
                    // $axios.post('/repo/update')
                } else {
                    console.log(`[${repo.name}] - No update.`);
                }
            })
        } catch (err) {
            logParams.type = 'error';
            logParams.msg = err;
            $fn.sysLogs(logParams);
        
        }
    }
}

const gitFetch = cron.from({
    cronTime: '0 0 */12 * * *',
    onTick: async () => {
        await gitFetchCheck(gitRepos); // 在每次 cron 觸發時檢查 git 儲存庫更新
        // await svnFetchCheck(svnRepos); // 在每次 cron 觸發時檢查 svn 儲存庫更新
    },
    start: true,
    timeZone: 'Asia/Taipei'
});
/** /repo/update */
app.post('/repo/release', async (req, res) => {
    res.send('OK');
    console.log(`[START] - git release ...`);
    await gitFetchCheck(gitRepos);
    // console.log(`[START] - svn release ...`)
    // await svnFetchCheck(svnRepos);
    console.log(`[START] - git update ...`);
    $axios.post('/repo/update');
});
async function releaseBot (param) {
    // console.log(`param: `,param);
    if (!param) {
        console.log(`[START] - git release ...`);
        gitFetchCheck(gitRepos);
        $axios.post('/repo/update');
    }
    if (param && (typeof param) === 'object') {
        let releaseRepos = []
        for (const repo of param) {
            gitRepos.find(r => {
                if (r.name === repo.toLowerCase()) {
                    // console.log(`repo: `,r)
                    releaseRepos.push(r);
                }
            })
        }
        await gitFetchCheck(releaseRepos);
    }
    if (param && (typeof param)==='string') {
        gitRepos.find(async (repo) => {
            if (repo.name === param.toLowerCase()) {
                // console.log(`repo: `,repo)
                await gitFetchCheck([repo]);
            }
        })
    }
}
app.post('/repo/booking/release', async (req, res) => {
    // console.log(`req: `,req.body);
    // $handler.TimeDiff('', req.body.date, req.body.time);
    $handler.bookEvent(releaseBot, req.body.type, req.body.date, req.body.time, req.body.params);
    res.send('OK');
})
app.listen($config.PORT, () => {
    // console.log(`CI/CD Server is on PORT:${$config.PORT} ...`)
    let logParams = {
        func: `CI/CD Server is on PORT:${$config.PORT}`,
        location: 'app.js',
    };
    $fn.sysLogs(logParams);
})
