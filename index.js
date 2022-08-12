const path = require('path');
const express = require('express');
var cors = require('cors');
var requestIp = require('request-ip');
var bodyParser = require('body-parser');
const middleware = require('./middleware');


const publicDirectoryPath = path.join(__dirname, './public');

const app = express();

app.use(requestIp.mw({ attributeName: 'myCustomAttributeName' }))
app.use(middleware);
app.use(express.static(publicDirectoryPath));
app.use(cors());
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));
app.use(bodyParser.json());

app.use(require('./APPRoutes'));

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log('Server is up on port ' + port);
});