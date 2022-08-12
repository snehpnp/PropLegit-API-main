var SqlString = require('sqlstring');
const sql = require('mssql');

const { runStoredProcedureOutput } = require('../MsSql/Query');

var Paginning_Serch_Sorting = (spname, option, FilterArray) => {

    return new Promise(async (resolve, reject) => {

        try {

            var SearchWordQuery = '';


            await FilterArray.forEach(ele => {
                const { field, operator, value } = { ...ele }

                SearchWordQuery += SqlString.format(` AND ${getsimbol(field, operator, value)} `);
            })


            var model = await {
                UserID: option.UserID == undefined ? null : option.UserID,
                InPut_PageSize: option.PageSize == undefined ? null : option.PageSize,
                InPut_PageNo: option.PageNo == undefined ? null : option.PageNo,
                Ascending: option.Ascending == undefined ? null : option.Ascending,
                SortBy: option.SortBy == undefined ? null : option.SortBy,
                SearchQuery: SearchWordQuery == undefined ? null : SearchWordQuery
            }

            var inputparams = [];

            await Object.keys(model).forEach(element => {
                inputparams.push({
                    "name": element,
                    "type": sql.NVarChar,
                    "value": model[element] ? model[element] : null
                })
            });

            var Outputmodel = {
                TotalCount: null,
                PageSize: null,
                PageNo: null,
                TotalPage: null
            }

            var outputParams = [];

            await Object.keys(Outputmodel).forEach(element => {
                outputParams.push({
                    "name": element,
                    "type": sql.NVarChar,
                    "value": model[element] ? model[element] : null
                })
            });

            var Result = runStoredProcedureOutput(spname, inputparams, outputParams);

            resolve(Result)

        } catch (err) {
            reject(err);
        }
    });

}

var getsimbol = (field, operator, value) => {
    if (operator == 'eq') return "[" + field + "]" + " = '" + value + "'";
    if (operator == 'neq') return "[" + field + "]" + " !='" + value + "'";
    if (operator == 'contains') return "[" + field + "]" + " LIKE '%" + value + "%'";
    if (operator == 'doesnotcontain') return "[" + field + "]" + " NOT LIKE '%" + value + "%'";
    if (operator == 'startswith') return "[" + field + "]" + " LIKE '" + value + "%'";
    if (operator == 'endswith') return "[" + field + "]" + " LIKE '%" + value + "'";
    if (operator == 'isnull') return "[" + field + "]" + " IS NULL";
    if (operator == 'isnotnull') return "[" + field + "]" + " IS NOT NULL";
    if (operator == 'isempty') return "[" + field + "]" + "= ' '";
    if (operator == 'isnotempty') return "[" + field + "]" + "!= ' '";
    if (operator == 'gte') return "[" + field + "]" + " >= '" + value + "'";
    if (operator == 'eq') return "[" + field + "]" + " = '" + value + "'";
    if (operator == 'neq') return "[" + field + "]" + " != '" + value + "'";
    if (operator == 'gt') return "[" + field + "]" + " > '" + value + "'";
    if (operator == 'lte') return "[" + field + "]" + " <= '" + value + "'";
    if (operator == 'lt') return "[" + field + "]" + " < '" + value + "'";
}

module.exports = Paginning_Serch_Sorting;