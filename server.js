const { CronJob } = require('cron');
require('dotenv').config({ path: '/home/ubuntu/.env' });
const mongoExportFileUpload = require('./mongoExportFileUpload');
const gzBufferUpload = require('./gzBufferUpload');


new CronJob('*/1 * * * *', () => {
    gzBufferUpload();
	console.log('Mongo GZ File Upload');
    mongoExportFileUpload();
	console.log('Mongo Export File Upload ......');
}, null, true, 'America/Los_Angeles');
