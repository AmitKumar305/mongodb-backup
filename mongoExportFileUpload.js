// Backup of mongodb database in form of collections.
// This will create a folder of mongodb database which will contain all the collections in .json file of the database.
// Upload this folder to AWS S3 and then, delete it.

require('dotenv').config();
const exec = require("child_process").exec;
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const AWS = require('aws-sdk');

AWS.config.update({
    secretAccessKey: process.env.SECRET_KEY,
    accessKeyId: process.env.ACCESS_KEY,
    region: 'ap-south-1',
    signatureVersion : 'v4'
});

const s3 = new AWS.S3({signatureVersion: 'v4'});

const DATABASES = [
    'test',
    'aggregation',
]
let backupDirPath;
let DATABASE;

async function init() {

    for (const db of DATABASES) {
        DATABASE = db;
        backupDirPath = path.join(__dirname, DATABASE);

        try {
            await mongoose.disconnect();
        } catch (error) {
            console.error(`Error closing MongoDB connection: ${error.message}`);
        }
        
        await mongoose.connect(`${process.env.CONNECTION_STRING}/${DATABASE}`, { useNewUrlParser: true, useUnifiedTopology: true });
            try {
                await mongoose.connect(`${process.env.CONNECTION_STRING}/${db}`, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true
                });
                const collections = await mongoose.connection.db.listCollections().toArray();
                const collectionNames = collections.map(collection => collection.name);
        
                const MONGODB_URI = process.env.CONNECTION_STRING;
        
                const uploadPromises = [];
        
                for (const collectionName of collectionNames) {
                    const cmd = `mongoexport --uri=${MONGODB_URI} --db=${DATABASE} --collection=${collectionName} --out=${backupDirPath}/${collectionName}.json`;
        
                    const uploadPromise = new Promise((resolve, reject) => {
                        exec(cmd, (error, stdout, stderr) => {
                        if (error) {
                            console.error(error, stdout, stderr);
                            reject(error);
                        } else {
                            resolve();
                        }
                        });
                    });
                    uploadPromises.push(uploadPromise);
                }
        
                await Promise.all(uploadPromises);
                await uploadToS3();
            } catch (error) {
                console.error(`Error listing collections: ${error.message}`);
            } finally {
                mongoose.connection.close();
            }
    }
}

async function uploadToS3() {
    const backupFiles = fs.readdirSync(backupDirPath);

    const uploadPromises = backupFiles.map(file => {
        const filePath = path.join(backupDirPath, file);

        const params = {
            Bucket: process.env.BUCKET_NAME,
            Key: `json/${DATABASE}/${file}`,
            Body: fs.createReadStream(filePath),
        };

        return new Promise((resolve, reject) => {
            s3.upload(params, (err, data) => {
                if (err) {
                    console.error(`Error uploading ${file} to S3: ${err}`);
                    reject(err);
                } else {
                    console.log(`Successfully uploaded ${file} to S3. ETag: ${data.ETag}`);
                    resolve(filePath);
                }
            });
        });
    });

    try {
        await Promise.all(uploadPromises);
        backupFiles.forEach(file => {
            const filePath = path.join(backupDirPath, file);
            fs.unlinkSync(filePath);
            console.log(`Deleted local file: ${filePath}`);
        });
        fs.rmdirSync(backupDirPath);
    } catch (error) {
        console.error(`Error uploading to S3 or deleting local files: ${error}`);
    }
}

module.exports = init;

// This will generate the json files of all the collections of the database.
// We will put all these json files in a folder named as <databaseName>
// Then, will upload that folder on the S3.


//  ------------------------- Mongorestore command ---------------------------

// To restore the database, simply use mongodb compass Import Json or csv file feature.
