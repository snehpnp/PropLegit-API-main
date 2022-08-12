var AlphaGenerator = () => {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var charactersLength = characters.length;
    for (var i = 0; i < 1; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
var SmallAlphaGenerator = () => {
    var result = '';
    var characters = 'abcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    for (var i = 0; i < 3; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
var NumberGenetaror = () => {
    var result = '';
    var characters = '1234567890';
    var charactersLength = characters.length;
    for (var i = 0; i < 2; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

module.exports.PasswordGenerator = () => {
    return new Promise(async(resolve, reject) => {
        try {
            var result = ''
            result += await AlphaGenerator();
            result += await SmallAlphaGenerator();
            result += await '@' + NumberGenetaror();
            resolve(result)
        } catch (error) {
            reject(error);
        }
    })
}