var fs = require('fs');
const { Toggle } = require('../config/db.js');

var APIErrorLog = (Query, err, headers, body, message, type, params, query) => {

        if (Toggle.ErrorLogMode === true) {
                var textData = `****************************************\n\n=> Date : ${new Date()}\n=> Request Type : ${type}\n=> Request Header : ${JSON.stringify(headers)}\n=> Query : ${Query}\n=> Error : ${err}\n=> Request Body : ${JSON.stringify(body)}\n=> Message : ${message}\n=> Params : ${JSON.stringify(params)}\n=> Query Params: ${JSON.stringify(query)}\n\n****************************************\n\n`;

                fs.appendFileSync('./APIErrorLog.txt', textData);
        }
}

module.exports = APIErrorLog;