var express = require('express');
var router = express.Router();



var car = require('../SiteManagement/CarBrand');

var index = require('./index');


router.use('/', index);
router.get('/carbrand', car.carbrand);//添加汽车品牌页面
router.post('/carbrand/add',car.carbrandAdd);//添加汽车品牌
router.post('/upload/trademark', car.uploadTrademark);//添加汽车品牌商标
router.get('/getCar',car.getCar);//获取汽车品牌
router.post('/getCarModel', car.getCarModel);//获取汽车车型
router.post('/uploadInformation', car.uploadInformation);//上传汽车维修资料
router.post('/removeInformation', car.removeInformation);//删除资料
router.post('/maintenanceCase', car.maintenanceCase);//上传案例
router.post('/maintenanceCase/img',car.maintenanceCaseImg)//上传案例图片
module.exports = router;