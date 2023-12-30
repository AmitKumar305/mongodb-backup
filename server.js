const { CronJob } = require('cron');
require('dotenv').config();
const mongoExportFileUpload = require('./mongoExportFileUpload');
// const gzBufferUpload = require('./gzBufferUpload');


new CronJob('*/1 * * * *', () => {
    // gzBufferUpload();
	// console.log('Mongo GZ File Upload');
    mongoExportFileUpload();
	console.log('Mongo Export File Upload ......');
	console.log(process.env.BUCKET_NAME);
}, null, true, 'America/Los_Angeles');
