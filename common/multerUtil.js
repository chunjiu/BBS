var multer = require('multer');//文件上传模块

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null,'public/uploads');
    },
    filename: function (req, file, cb) {
        cb(null,file.fieldname+'-'+Date.now()+".jpg")
     }
    
});

var upload = multer({
    storage: storage,
});

module.exports = upload;