var ResponseModel = require('../Model/ResponseModel');
var modelBuilder = require('../helpers/modelBuilder');



module.exports = (req, res) => {

    return new Promise((resolve, reject) => {

        var { userid } = { ...req.headers }


        if (userid) {
            resolve(userid);
        } else {

        }
    })

}