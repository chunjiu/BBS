const path = require('path');

module.exports = {
    entry: 'e:/BBS/views/webpack/index.js',
    output: {
        filename: 'bundle.js',    
        path: path.join(__dirname, 'dist'),
    }
};