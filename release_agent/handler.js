// @ts-check
const axios = require('axios');
const $config = require('./config.js');
const $axios = axios.create({
    baseURL: $config.BASEURL,
    withCredentials: true,
})
exports.TimeDiff = function(date, time) {
    console.log(`${date.replace(/\//g, '-')}T${time}`)
    const now = new Date()
    const timeDiff = new Date(`${date.replace(/\//g, '-')}T${time}`) - now
    return timeDiff
}

exports.bookEvent = function(func, type, date, time, params) {
    switch (type) {
        case 'book':
            const timeDiff = this.TimeDiff(date, time)
            console.log(`timeDiff: ${timeDiff/1000}s`)
            setTimeout(async () => {
                await func(params)
                await $axios.post('/repo/update');
            }, timeDiff)
            break;
        case 'now':
            func()
            break;
    }
}