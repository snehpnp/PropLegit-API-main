

var CurrentDateTime = () => {

    var currentTime = new Date();
    var currentOffset = currentTime.getTimezoneOffset();
    var ISTOffset = 330;

    var d = new Date(currentTime.getTime() + (ISTOffset + currentOffset) * 60000);

    // var d = new Date();

    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes();

}

module.exports = CurrentDateTime;