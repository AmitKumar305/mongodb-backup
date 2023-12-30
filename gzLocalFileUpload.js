// Backup of mongodb database in form of a single file.
// This will create a folder of mongodb database which will contain a single .gz file of all the collections.
// Upload this .gz file to AWS S3.

require('dotenv').config();
const exec = require("child_process").exec;
const path = require("path");
const fs = require("fs");
const zlib = require('zlib');
const AWS = require('aws-sdk');

AWS.config.update({
    secretAccessKey: process.env.SECRET_KEY,
    accessKeyId: process.env.ACCESS_KEY,
    region: 'ap-south-1',
    signatureVersion : 'v4'
});

const s3 = new AWS.S3({signatureVersion: 'v4'});

function init() {

    const backupDirPath = path.join(__dirname, "database-backup.gz");
    
    const MONGODB_URI = process.env.MONGODB_URI;
    
    const DATABASE_NAME = 'test';
    let compressedStream;
    
    let cmd = `mongodump --uri=${MONGODB_URI} --archive=${backupDirPath} -d ${DATABASE_NAME} --gzip`;
    
    exec(cmd, (error, stdout, stderr) => {
        console.log(error, stdout, stderr);
        const fileStream = fs.createReadStream(backupDirPath);
    
        const gzip = zlib.createGzip();
    
        compressedStream = fileStream.pipe(gzip);
    
        uploadToS3();
    });
    
    
    function uploadToS3() {
        console.log(compressedStream);
        let params = {
            Bucket: process.env.BUCKET_NAME,
            Key: 'data.gz',
            Body: compressedStream,
            ContentEncoding: 'gzip',
        };
        s3.upload(params, (err, result) => {    
            if(err) {
                console.log("Error", err);
            } else {
                console.log("S3 Response",result);
                fs.unlinkSync(backupDirPath);
            }
        })
    }
}

module.exports = init;


// This will create a single file named as backupFile.gz (as provided).
// This single file is used to retrieve/restore the complete database.
// Now, after upload to s3, delete this file.


//  ------------------------- Mongorestore command ---------------------------

/*

--> For restoring the database with same name from which it is backed up ie. 
    The database name from which backup is taken is test, so, it also creates a test named database wile restoring.

Syntax for restoreCommand: `mongorestore --uri=${MONGODB_URI} --archive=<pathToGzFile> --gzip`
Eg: `mongorestore --uri=${MONGODB_URI} --archive=./data.gz --gzip`


---> For restoring the database with different name from which it is backed up ie. 
    The database name from which backup is taken is test, but it will create a new database namely amit.

Syntax for restoreCommand: `mongorestore --uri=${MONGODB_URI} --archive=<pathToGzFile> --gzip --nsFrom='test.*' --nsTo='amit.*'`
Eg: `mongorestore --uri=${MONGODB_URI} --archive=\./data.gz --gzip --nsFrom='test.*' --nsTo='amit.*'`

*/

// exec(restoreCommand, (error, stdout, stderr) => {
//     console.log([restoreCommand, error, backupDirPath]);
