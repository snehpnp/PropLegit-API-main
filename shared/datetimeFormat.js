const moment = require('moment');

const CurrentDateTime = require('./CurrentDateTime')

var MssqldatetimeFormat = (date, strformate) => {
    return moment(date, 'YYYY - MM - DDTHH: mm: ss').local().format(strformate)

}

var CurrentdatetimeFormat = (date, strformate) => {

    return moment(date, 'YYYY-MM-DD HH:mm').local().format(strformate)
}

module.exports = {
    MssqldatetimeFormat,
    CurrentdatetimeFormat
}