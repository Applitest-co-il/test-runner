const axios = require('axios');
const fs = require('fs');

async function downloadFile(url, fileName) {
    const fileLocalPath = `${process.cwd()}/downloads/${fileName}`;
    const existLocalApp = fs.existsSync(fileLocalPath);
    if (existLocalApp) {
        console.log(`App ${fileLocalPath} already downloaded`);
        return fileLocalPath;
    }

    const downloadResponse = await axios({
        url: url,
        method: 'GET',
        responseType: 'stream'
    });

    const writer = fs.createWriteStream(fileLocalPath);
    downloadResponse.data.pipe(writer);

    const promise = new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
    return promise
        .then(() => {
            console.log(`File downloaded successfully ${fileLocalPath}`);
            return fileLocalPath;
        })
        .catch((error) => {
            console.error(`Error downloading file ${url}: ${error}`);
            return null;
        });
}

module.exports = { downloadFile };
