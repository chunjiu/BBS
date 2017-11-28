var express = require('express');
var router = express.Router();

var car = require('../SiteManagement/CarBrand');
var user = require('../SiteManagement/user');
var topic = require('../SiteManagement/topic');
var index = require('../SiteManagement/index');
var auth = require('../middlewares/auth');


router.get('/signup',user.signup);//注册页面
router.post('/sign',user.sign);//注册提交
router.get('/active_account',user.activeAccount);//邮箱验证
router.post('/upload',user.upload);//头像裁剪上传
router.get('/signin',user.signin);//登录页面
router.post('/login',user.login);//登录
router.get('/setting', user.set);//账号设置
router.get('/singout',user.singout);//账号退出
router.get('/admin/setting',auth.SuperRequired,user.setting)//设置用户权限页
router.post('/admin/addAdmin', user.addAdmin)//设置用户为管理员

router.get('/carbrand',auth.AdminRequired, car.carbrand);//添加汽车品牌页面
router.post('/carbrand/add',car.carbrandAdd);//添加汽车品牌
router.post('/upload/trademark', car.uploadTrademark);//添加汽车品牌商标
router.post('/upload/modelImg',car.uploadModelImg)//上传车型图片
router.get('/carBrand/edit', car.carBrandEdit);//车型删除、修改
router.post('/carBrand/remove', car.carBrandRemove);//汽车品牌删除

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

router.get('/create',auth.userRequired,topic.create);//发布话题页面
router.post('/topic/create',topic.saveTopic);//话题保存
router.get('/topic/:id/edit',topic.edit);//话题修改
router.post('/topic/:id/edit',topic.editSave);//修改话题保存
router.get('/topic/:id/remove',topic.remove);//删除话题
router.get('/:id/tid',topic.oneTopic);//进入单个话题
router.post('/topic/collect',topic.collect);//收藏该话题
router.post('/topic/de_collect',topic.de_collect);//取消收藏该话题
router.get('/topic/:id/good',topic.good);//加精该话题
router.get('/topic/:id/top', topic.top);//置顶该话题
router.post('/:id/reply',topic.reply);//保存回复
router.post('/:id/:reply_id/comment',topic.reply_oneReply);//回复并保存某个评论
router.post('/reply/:reply_id/delete',topic.removeReply);//删除回复
router.post('/reply/nice',topic.nice);//回复点赞
router.get('/user/:username',topic.user);//进入该话题用户主页
router.get('/case',topic.index);//进入话题页
router.post('/topic/search',topic.search);//话题查找（模糊查找）

router.get('/',index.index);//进入首页
router.get('/information', index.information);//进入首页资料页面
router.get('/MaintenanceCase', index.MaintenanceCase);//进入首页案例页面
router.get('/backStage',index.backStage);//进入后台操作页面
router.get('/job',car.job)//求贤纳才页面



module.exports = router;