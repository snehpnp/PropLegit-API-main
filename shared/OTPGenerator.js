var otpGenerator = require('otp-generator');

var OTPGenerator = () => {

    var OTPArray = [];

    return new Promise((resolve, reject) => {

        OTPArray.push(otpGenerator.generate(6, { specialChars: false, digits : true, alphabets : false, upperCase : false}));
        OTPArray.push(otpGenerator.generate(6, { specialChars: false, digits : true, alphabets : false, upperCase : false}));
        resolve(OTPArray);
    })
}

module.exports = OTPGenerator;