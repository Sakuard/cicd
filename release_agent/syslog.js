// @ts-check
console.log(`import syslog.js ...`)
exports.formateTime = (time) => {
    const date = new Date(time);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    // const millisecond = String(date.getMilliseconds()).padStart(3, '0');

    return `[${year}-${month}-${day} ${hour}:${minute}:${second}]`;
    // return `${year}${month}${day} - ${hour}:${minute}:${second}:${millisecond}`;
}

/**
 * 狀態管理
 * @param {string|boolean|number} initState 
 * @returns {[function (state): string|boolean|number, function(string|boolean|number): void]} 
 */
exports.useState = (initState) => {
    if (typeof initState !== 'string' && typeof initState !== 'boolean' && typeof initState !== 'number') {
        throw new TypeError("Type Error: Only [string, boolean, number] is accepted");
    }
    let state = initState;
    let type = typeof initState;
    const getState = () => {
        return state;
    }
    const setState = (newState) => {
        if (type !== typeof newState) {
            throw new TypeError("Type Error: updated type mismatch");
        }
        state = newState;
    }
    return [getState, setState];
}

exports.sysLogs = (info) => {
    const time = logTime();
    const type = info?.type?.toLowerCase();
    if (!info.func && !info.location) {
        (async () => {
            const chalk = await import('chalk');
            console.log(`${chalk.default.bgYellow.bold(' WARN ')} - missing params of 'func' and 'location'\nfunc: exec function name\nlocation: function location`)
        })();
        return;
    }
    if (!info.func) {
        (async () => {
            const chalk = await import('chalk');
            console.log(`${chalk.default.bgYellow.bold(' WARN ')} - missing params of 'func'\nfunc: exec function name`)
        })();
        return;
    }
    if (!info.location) {
        (async () => {
            const chalk = await import('chalk');
            console.log(`${chalk.default.bgYellow.bold(' WARN ')} - missing param of 'location'\nlocation: function location`)
        })();
        return;
    }
    // console.log(`type: `,type);
    (async () => {
        const chalk = await import('chalk');
        switch (type) {
            case 'error':
            case 'err':
                console.log(`${time} ${chalk.default.bgRed.bold(' ERROR ')} - ${info.func} @${info.location}\n${info.msg||''}`);
                break;
            case 'warn':
            case 'warning':
                console.log(`${time} ${chalk.default.bgYellow.bold(' WARN ')} - ${info.func} @${info.location}\n${info.msg||''}`);
                break;
            case 'process':
                console.log(`${time} ${chalk.default.bgBlue.bold(' PROCESS ')} - ${info.func} @${info.location}\n${info.msg||''}`);
                break;
            default:
                console.log(`${time} ${chalk.default.bgGreen.bold(' INFO ')} - ${info.func} @${info.location}`);
                break;
        }
    })();
}
function logTime() {
    const date = new Date(Date.now());
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    // const millisecond = String(date.getMilliseconds()).padStart(3, '0');

    return `[${year}-${month}-${day} ${hour}:${minute}:${second}]`;
}