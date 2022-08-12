var { Pool } = require('../config/db');
var SqlString = require('sqlstring');

var executeQuery = (sqlquery) => {
    var promise = new Promise((resolve, reject) => {

        Pool.connect().then(pool => {
            return pool.query(sqlquery)
        }).then(result => {
            resolve(result)
        }).catch(err => {
            reject(err)
        })

    });

    return promise;
}

var runStoredProcedure = (proc, sqlParams) => {
    var promise = new Promise((resolve, reject) => {

        Pool.connect().then(pool => {
            const req = pool.request();
            sqlParams.forEach(function (param) {
                req.input(param.name, param.type, param.value);
            });
            req.execute(proc, (err, recordset) => {

                if (err) {
                    reject(err);
                }
                resolve(recordset)
            });
        }).catch(err => {
            reject(err)
        })

    });

    return promise;
}

var runStoredProcedureTblinput = (proc, sqlParams) => {
    var promise = new Promise((resolve, reject) => {

        Pool.connect().then(pool => {
            const req = pool.request();
            sqlParams.forEach(function (param) {
                req.input(param.name, param.value);
            });
            req.execute(proc, (err, recordset) => {

                if (err) {
                    reject(err);
                }
                resolve(recordset)
            });
        }).catch(err => {
            reject(err)
        })

    });

    return promise;
}

var UpdateQuery = (TableName, model, conditionValue, conditionName) => {

    var promise = new Promise((resolve, reject) => {

        if (Object.keys(model).length === 0) {
            reject('Request has empty body');
        } else {

            var MsSqlQuery = SqlString.format(`UPDATE ${TableName} SET `);

            Object.keys(model).forEach(element => {
                MsSqlQuery += SqlString.format(` ${element} = ? ,`, [model[element]]);
            });

            MsSqlQuery = MsSqlQuery.substring(0, MsSqlQuery.length - 2);
            MsSqlQuery += SqlString.format(` where ${conditionName} = ? ;`, [conditionValue]);

            resolve(MsSqlQuery);
        }

    });

    return promise;

}

var runStoredProcedureOutput = (proc, sqlParams, sqlParamsOutput) => {
    var promise = new Promise((resolve, reject) => {

        Pool.connect().then(pool => {
            const req = pool.request();
            sqlParams.forEach(function (param) {
                req.input(param.name, param.type, param.value);
            });
            sqlParamsOutput.forEach(function (param) {
                req.output(param.name, param.type, param.value);
            });
            req.execute(proc, (err, recordset) => {

                if (err) {
                    reject(err);
                }
                resolve(recordset)
            });
        }).catch(err => {
            reject(err)
        })

    });

    return promise;
}

module.exports = {
    executeQuery, runStoredProcedure, UpdateQuery, runStoredProcedureTblinput, runStoredProcedureOutput
};
