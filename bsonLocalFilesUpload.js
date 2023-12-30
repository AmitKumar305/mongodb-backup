// Backup of mongodb database in form of collections.
// This will create a folder of mongodb database which will contain all the collections of the database.
// Upload this folder to AWS S3 and then, delete it.

const exec = require("child_process").exec;
const path = require("path");
const fs = require("fs");
const AWS = require('aws-sdk');

AWS.config.update({
    secretAccessKey: process.env.SECRET_KEY,
    accessKeyId: process.env.ACCESS_KEY,
    region: 'ap-south-1',
    signatureVersion : 'v4'
});

const s3 = new AWS.S3({signatureVersion: 'v4'});

function init() {

    const backupDirPath = path.join(__dirname, "database-backup");
    
    const MONGODB_URI = process.env.MONGODB_URI;
    
    const DATABASE_NAME = 'test';
    
    let cmd = `mongodump --uri=${MONGODB_URI} --out=${backupDirPath} -d ${DATABASE_NAME}`;
    
    exec(cmd, (error, stdout, stderr) => {
        console.log(error, stdout, stderr);
        uploadToS3();
    });
    
    function uploadToS3() {
    
        const backupFiles = fs.readdirSync(`${backupDirPath}/${DATABASE_NAME}`);
    
        backupFiles.forEach(file => {
            const filePath = path.join(`${backupDirPath}/${DATABASE_NAME}`, file);
    
            const params = {
                Bucket: process.env.BUCKET_NAME,
                Key: `backup/${file}`, // Use the file name as the S3 object key
                Body: fs.createReadStream(filePath),
            };
    
            s3.upload(params, (err, data) => {
                if (err) {
                    console.error(`Error uploading ${file} to S3: ${err}`);
                } else {
                    console.log(`Successfully uploaded ${file} to S3. ETag: ${data.ETag}`);
                    fs.unlinkSync(filePath);
                }
            });
        });
    }
}

module.exports = init;


// This will create two files ( <collectionName.bson> and <collectionName.metadata.json> ) files in the <database-backup> folder.
// The bson file is the important file. It is used to retrieve/restore the collection.
// the <collectionName.bson> file contains the data of collection documents.



//  ------------------------- Mongorestore command ---------------------------

/*
Syntax for restoreCommand: `mongorestore --uri=${MONGODB_URI} --drop <PathToBsonFile`
Eg: `mongorestore --uri=${MONGODB_URI} --drop ./users.bson`
This will restore the file in test database.
*/

// exec(restoreCommand, (error, stdout, stderr) => {
//     console.log([restoreCommand, error, backupDirPath]);