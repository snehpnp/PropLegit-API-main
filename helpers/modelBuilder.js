function modelBuilder() {

}

modelBuilder.prototype.buildModel = function(requestBody, dataModel) {
    var model = {};
    Object.keys(dataModel).forEach(function (key) {
        if (hasKey(requestBody, key)) {
            Object.defineProperty(model, key, {
                value: requestBody[key],
                writable: true,
                enumerable: true,
                configurable: true
            });
        }
    });
    return model;
}

function hasKey(collection, key) {
    return Object.keys(collection).indexOf(key) != -1;
}


module.exports = modelBuilder;


// new modelBuilder().buildModel({ status : 200, data:data.recordset[0], message : "data successfully Fetched"}, new ResponseModel())