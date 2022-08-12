var fs = require('fs');
const { Toggle } = require('../config/db.js');

var APIcallLog = (headers, body, type, params, query) => {

        if (Toggle.CallLogMode === true) {

                const d = new Date();
                const today = `${d.getFullYear()}_${(d.getMonth() + 1)}_${d.getDay()}`;

                var textData = `****************************************\n\n=> Date : ${new Date()}\n=> Request Type : ${type}\n=> Request Header : ${JSON.stringify(headers)}\n=> Request Body : ${JSON.stringify(body)}\n=> Params : ${JSON.stringify(params)}\n=> Query Params: ${JSON.stringify(query)}\n\n****************************************\n\n`;

                fs.appendFileSync(`./API Call Log/APICallLog_${today}.txt`, textData);
        }
}

module.exports = APIcallLog;