// Backup of mongodb database in form of collections.
// Same as second.js
// In this, we are not storing the .gz files of each collection in a folder.
// Directly upload this .gz file on AWS S3.

require('dotenv').config();
const AWS = require('aws-sdk');
const zlib = require('zlib');
const exec = require("child_process").exec;
const { Readable } = require('stream');

AWS.config.update({
    secretAccessKey: process.env.SECRET_KEY,
    accessKeyId: process.env.ACCESS_KEY,
    region: 'ap-south-1',
    signatureVersion : 'v4'
});

const s3 = new AWS.S3({signatureVersion: 'v4'});

const MONGODB_URI = process.env.CONNECTION_STRING;

const DATABASES = [
    'test',
    'aggregation',
]
let compressedStream;

function init() {
    for (const db of DATABASES) {
        const DATABASE_NAME = db;

        let cmd = `mongodump --uri=${MONGODB_URI} --archive --gzip -d ${DATABASE_NAME}`;
        let backupDataBuffer = Buffer.from('');
        
        const mongodumpProcess = exec(cmd, { encoding: 'binary' });
        
        mongodumpProcess.stdout.on("data", (data) => {
            backupDataBuffer = Buffer.concat([backupDataBuffer, Buffer.from(data, 'binary')]);
        });
          
        mongodumpProcess.stderr.on("error", (error) => {
            console.error("Error running mongodump:", error);
        });
        
        mongodumpProcess.on("exit", (code) => {
            if (code === 0) {
                console.log("mongodump process exited successfully");
                const bufferData = Buffer.from(backupDataBuffer);
        
                const gzip = zlib.createGzip();
        
                const bufferStream = Readable.from(bufferData);
        
                compressedStream = bufferStream.pipe(gzip);
                
                uploadToS3(db);
            } else {
                console.error(`mongodump process exited with code ${code}`);
            }
        });
    }
}

function uploadToS3(db) {
    let params = {
        Bucket: process.env.BUCKET_NAME,
        Key: `GZ/${db}.gz`,
        Body: compressedStream,
        ContentEncoding: 'gzip',
    };

    s3.upload(params, (err, result) => {
        if(err) {
            console.log("Error", err);
        } else {
            console.log("S3 Response",result);
        }
    })
}

module.exports = init;



//  ------------------------- Mongorestore command ---------------------------

/*

--> For restoring the database with same name from which it is backed up ie. 
    The database name from which backup is taken is test, so, it also creates a test named database while restoring.

Syntax for restoreCommand: `mongorestore --uri=${MONGODB_URI} --archive=<pathToGzFile> --gzip`
Eg: `mongorestore --uri=${MONGODB_URI} --archive=./data.gz --gzip`


---> For restoring the database with different name from which it is backed up ie. 
    The database name from which backup is taken is test, but it will create a new database namely amit.

Syntax for restoreCommand: `mongorestore --uri=${MONGODB_URI} --archive=<pathToGzFile> --gzip --nsFrom='test.*' --nsTo='amit.*'`
Eg: `mongorestore --uri=${MONGODB_URI} --archive=./data.gz --gzip --nsFrom='test.*' --nsTo='amit.*'`

*/

// exec(restoreCommand, (error, stdout, stderr) => {
//     console.log([restoreCommand, error, backupDirPath]);

