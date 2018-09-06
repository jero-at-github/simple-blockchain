/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);

let self = module.exports;

// Add data to levelDB with key/value pair
self.addLevelDBData = function(key, value) {

    return new Promise((resolve, reject) => {
        db.put(key, JSON.stringify(value), function (err) {
            
            if (err) {
                reject('Block ' + key + ' submission failed' + err);
            }
            else {
                resolve();
            }
        })
    });        
}

// Get data from levelDB with key
self.getLevelDBDataValue = function (key) {

    return new Promise((resolve, reject) => {
        db.get(key, function (err, value) {

            if (err) {                
                reject("Block with height " + key + " not found");
            }
            else {
                resolve(JSON.parse(value));                
            }
        })
    });         
}

// Get data from levelDB with key
self.getLevelDBDataValueByAttribute = function (attributes, value) {

    return new Promise((resolve, reject) => {
        
        let blocks = [];

        db.createReadStream()
            .on('data', function (data) {

                let attributeValue = JSON.parse(data.value);
                attributes.split(".").forEach(attribute => {
                    attributeValue = attributeValue[attribute];
                });

                if (attributeValue == value) {
                    blocks.push(JSON.parse(data.value));
                }                
            })
            .on('error', function (err) {
                reject('Unable to read data stream!' + err);
            })
            .on('close', function () {
                resolve(blocks);
            });
    }); 
}

// Add data to levelDB with value
self.addDataToLevelDB = function (value) {

    return new Promise((resolve, reject) => {

        let i = 0;

        db.createReadStream()
            .on('data', function (data) {
                i++;
            })
            .on('error', function (err) {
                reject('Unable to read data stream!' + err);                                
            })
            .on('close', function () {
                console.log('Inserted block with key:' + i);
                value.height = i;
                self.addLevelDBData(i, value).then( () => {
                    resolve();
                });                
            });
    });            
}

// Get all data from levelDB
self.getAllLevelDBData = function () {

    return new Promise((resolve, reject) => {

        let dbData = [];

        db.createValueStream()
            .on('data', function (value) {
                dbData.push(JSON.parse(value));
            })
            .on('error', function (err) {
                reject('Unable to read data stream!' + err);
            })
            .on('close', function () {
                resolve(dbData);
            });
    });
}

// Get length from levelDB data
self.getLevelDBDataLength = function () {
    
    return new Promise((resolve, reject) => {

        let length = 0;

        db.createKeyStream()
            .on('data', function (key) {
                length ++;
            })
            .on('error', function (err) {
                reject('Unable to read data stream!' + err);
            })
            .on('close', function () {
                resolve(length - 1);
            });
    });
}

// Clean the data in levelDB
self.resetLevelDB = function () {

    return new Promise((resolve, reject) => {

        let keys = [];

        db.createKeyStream()
            .on('data', function (key) {
                keys.push({ type: 'del', key: key });
            })
            .on('error', function (err) {
                reject('Unable to read data stream!' + err);
            })
            .on('close', function () {

                db.batch(keys, function (err) {

                    if (err) {
                        reject('Ooops!' + err);
                    }
                    else {
                        console.log('DB reseted!')
                        resolve();
                    }
                });
            });
    });
}


