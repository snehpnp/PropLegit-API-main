const { Toggle } = require('./config/db');
const APIcallLog = require('./Text Log/AddCallLogintoText');

var middleware = (req, res, next) => {

    APIcallLog(req.headers, req.body, req.method, req.params, req.query);
    next();
}

module.exports = middleware;