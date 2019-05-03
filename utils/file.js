const fs = require('fs');

const deleteFile = (filePath) => {
    fs.unlink(filePath, err => {
        if(err) {
            return next(new Error('File operation failed'));
        }
    })
}

exports.deleteFile = deleteFile;