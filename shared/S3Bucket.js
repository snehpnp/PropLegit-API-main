const AWS = require('aws-sdk');

const { AazonS3Bucket } = require('../config/db');

const s3 = new AWS.S3({
    accessKeyId: AazonS3Bucket.ACCESSKEYID,
    secretAccessKey: AazonS3Bucket.SECRETACCESSKEY
})

const Bucket_name = AazonS3Bucket.BUCKETNAME;

var DocumentTypeSwitch = (FilePathID, DocumentType) => {
    DocumentType = DocumentType ? DocumentType.toString() : null;
    switch (DocumentType) {
        case '1':
            return `${FilePathID}/Documents/Property`;
        case '2':
            return `${FilePathID}/Documents/Rent`;
        case '3':
            return `${FilePathID}/Documents/Tax`;
        case '7':
        case '8':
        case '9':
        case '10':
        case '11':
        case '12':
        case '13':
        case '14':
        case '15':
        case '16':
            return `${FilePathID}/Documents/Loan`;
        case '17':
            return `${FilePathID}/Documents/Loan/PVR`;
        case '19':
            return `${FilePathID}/Documents/Legal`;
        case '20':
            return `Trust/Trust_ID_${FilePathID}/Meeting`;
        case '21':
            return `Trust/Trust_ID_${FilePathID}/Fund`;
        case '22':
            return `Trust/Trust_ID_${FilePathID}/Audit`;
        case '23':
            return `Trust/Trust_ID_${FilePathID}/Exemption`;
        case '24':
            return `Trust/Trust_ID_${FilePathID}/IT_Return`;
        default:
            return `${FilePathID}/PhotoVideos`;
    }

}

var UploadFile = (file, FilePathID, DocumentType, FileName, Subdirectory = null) => {

    return new Promise((resolve, reject) => {

        var path = DocumentTypeSwitch(FilePathID, DocumentType)

        if (!path) {
            return reject('Invalid DocumentType')
        }

        if (Subdirectory) {
            path += `/${Subdirectory.trim()}`
        }

        const params = {
            Bucket: Bucket_name,
            Key: `${path}/${FileName}`,
            ACL: 'public-read',
            Body: file.buffer
        }

        s3.upload(params, (error, data) => {
            if (error) {
                reject(error)
            }

            resolve(data)
        })
    })

}

var checkFile = (FilePathID, DocumentType, FileName, Subdirectory = null) => {

    return new Promise((resolve, reject) => {

        var path = DocumentTypeSwitch(FilePathID, DocumentType)

        if (!path) {
            return reject('Invalid DocumentType')
        }

        if (Subdirectory) {
            path += `/${Subdirectory.trim()}`
        }

        const params = {
            Bucket: Bucket_name,
            Key: `${path}/${FileName}`
        }

        s3.headObject(params, (error, data) => {

            if (error) {
                if (error.code === 'NotFound') {
                    resolve(error)
                }
                reject(error)
            }

            resolve(data)
        })
    })


}

var checkFileByFileNameOnly = (FileName) => {

    return new Promise((resolve, reject) => {

        const params = {
            Bucket: Bucket_name,
            Key: `${FileName}`
        }

        s3.headObject(params, (error, data) => {
            if (error) {
                if (error.code === 'NotFound') {
                    resolve(error)
                }
                reject(error)
            }

            resolve(data)
        })

    })


}

var UploadFileByFileNameOnly = (file, FileName) => {

    return new Promise((resolve, reject) => {

        const params = {
            Bucket: Bucket_name,
            Key: `${FileName}`,
            ACL: 'public-read',
            Body: file.buffer
        }

        s3.upload(params, (error, data) => {
            if (error) {
                reject(error)
            }

            resolve(data)
        })
    })


}

var GetFileObject = (objKey) => {

    return new Promise((resolve, reject) => {

        const params = {
            Bucket: Bucket_name,
            Key: objKey
        }

        s3.getObject(params, (error, data) => {
            if (error) {
                reject(error)
            }

            resolve(data)
        })
    });
}

module.exports = {
    UploadFile, checkFile, checkFileByFileNameOnly, UploadFileByFileNameOnly, GetFileObject
}