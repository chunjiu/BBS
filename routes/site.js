var express = require('express');
var router = express.Router();



var car = require('../SiteManagement/CarBrand');
var user = require('../SiteManagement/user');
var auth = require('../middlewares/auth');

var index = require('./index');


router.use('/', index);
router.get('/carbrand',auth.AdminRequired, car.carbrand);//添加汽车品牌页面
router.post('/carbrand/add',car.carbrandAdd);//添加汽车品牌
router.post('/upload/trademark', car.uploadTrademark);//添加汽车品牌商标
router.get('/getCar',car.getCar);//获取汽车品牌
router.post('/getCarModel', car.getCarModel);//获取汽车车型
router.post('/uploadInformation', car.uploadInformation);//上传汽车维修资料
router.post('/removeInformation', car.removeInformation);//删除资料
router.post('/caseUpload',car.caseUpload);//上传案例
router.post('/caseUpload/img', car.casUploadImg);//上传案例图片

router.get('/caseUploadShow',auth.AdminRequired, car.caseUploadShow);//维修案例编辑页面
router.get('/:caseTopic_id/datails', car.MaintenanceCaseDatails)//单个维修案例详情页
router.get('/MaintenanceCaseDatails/:caseTopic_id/edit', car.caseTopicEdit);//维修案例修改
router.get('/MaintenanceCaseDatails/:caseTopic_id/remove', car.caseTopicRemove)//维修案例删除

router.get('/job',car.job)//求贤纳才页面

router.get('/admin/setting',auth.SuperRequired,user.setting)//设置用户权限页
router.post('/admin/addAdmin', user.addAdmin)//设置用户为管理员




module.exports = router;