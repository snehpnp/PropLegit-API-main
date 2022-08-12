const bcrypt = require('bcrypt');
const saltRounds = 10;


var GeneratePassword = (password) => {

    return new Promise((resolve, reject) => {

        bcrypt.hash(password, saltRounds, function(err, hash) {
            if(err){
                
                reject(err)
            }
            resolve(hash)
            // Store hash in your password DB.
        });

    })
}

var CheckPassword = (myPlaintextPassword, hash) => {
  

    return new Promise((resolve, reject) => {

        bcrypt.compare(myPlaintextPassword, hash, function(err, result) {
            if(err){
                reject(err)
            }
            resolve(result)
        });

    })
}


module.exports = {
    GeneratePassword, CheckPassword
}