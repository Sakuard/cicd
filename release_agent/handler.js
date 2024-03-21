// @ts-check
exports.TimeDiff = function(date, time) {
    console.log(`${date.replace(/\//g, '-')}T${time}`)
    const now = new Date()
    const timeDiff = new Date(`${date.replace(/\//g, '-')}T${time}`) - now
    // console.log(`diff\nsec: ${timeDiff/1000}\nmin: ${(timeDiff/1000/60).toFixed(2)}\nhour: ${(timeDiff/1000/60/60).toFixed(2)}`)
    // setTimeout(() => {
    //     console.log(`exec`)
    // }, timeDiff)
    return timeDiff
}

exports.bookEvent = function(func, type, date, time, params) {
    switch (type) {
        case 'book':
            const timeDiff = this.TimeDiff(date, time)
            console.log(`timeDiff: `,timeDiff)
            setTimeout(() => {
                func(params)
            }, timeDiff)
            break;
        case 'now':
            func()
            break;
    }
}