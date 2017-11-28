
var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');

var crypto = require('crypto');
var utility = require('utility');

var mail = require('../common/mail');//发送邮件模块
var EmailLink = require('../common/emaillink');//生成登录邮箱链接
var multer = require('../common/multerUtil');//文件上传模块

var User = require('../models/user');
var Topic = require('../models/topic');
var Reply = require('../models/reply');
var Collect = require('../models/collect');
var Reply_comment = require('../models/reply_comment');
var Car = require('../models/car');
var MaintenaceCase = require('../models/maintenanceCase');

var config = require('../config');
var authMiddleWare = require('../middlewares/auth');

var EventProxy = require('eventproxy');//异步控制




//接口
router.get('/api', function (req, res, next) {
  //res.status(403).end();

  var page = parseInt(req.query.page, 10) || 1;
  var tab = req.query.tab || '全部';
  var limit = parseInt(req.query.limit, 10) || 1;

  var query = {};
  if (!tab || tab == '全部') {
    query.tab = { $nin: ['招聘']['申诉'] };//db.col.find(tab:{$nin:['招聘']})
  } else if (tab == '精华') {
    query.good = true;
  } else {
    query.tab = tab;
  }

  var limit = limit;
  var options = { skip: (page - 1) * limit, limit: limit, sort: '-top -last_reply_at' };

  Topic.findByQuery(query, options, function (err, topics) {
    if (err) {
      console.log('err是：' + err);
    } else {
      console.log('req.cookies是：' + req.signedCookies[config.auth_cookie_name]);
      console.log('req.session.uer是：' + req.session.user);
      var ReqUser = req.session.user ? req.session.user.username : '';
      User.getUserByUserName(ReqUser, function (err, user) {
        if (err) {
          return next(err);
        }
        Topic.findByQuery(query, function (err, topics_count) {
          var pages = Math.ceil((topics_count.length) / limit);

          var data = {
            topic: topics,
            user: user,
            current_user: req.session.user,
            tabs: config.tabs,
            current_page: page,
            tab: tab,
            pages: pages,
          };
          res.json(data);
          // res.download('/nodeMy博客/sheng.txt','sheng.txt');用于下载页面
        });
      });
    }
  });
});
//接口结束

/*汽车年份查找测试*/
router.post('/chekYear', function (req, res, next) {
  console.log('进入查询');

  let year = req.body.year;
  let model = req.body.model;
  console.log(year);
  console.log(model);
  Car.getCarByYear(year, model, function (err, car) {
    if (err) {
      console.log('出错');
      return next();
    }
    if (!car) {
      console.log('没有找到车');
    }
    console.log('car是：' + car)
  })
})


/*get information page*/

router.get('/information', function (req, res, next) {
  var ReqUser = req.session.user ? req.session.user : '';

  var carBrand = req.query.carBrand || '奥迪';
  var carModel = req.query.carModel || 'A6L';

  console.log('carBrand是：' + carBrand);
  var query = {};
  if (carBrand) {
    query.carBrand = carBrand;
  }
  Car.getCarByQuery('', '', function (err, car) {
    if (err) {
      console.log('出错');
      return next(err);
    }
    Car.getCarByQuery(query, '', function (err, car_Brand) {
      if (err) {
        console.log('出错');
        return next(err);
      }
      if (!car) {
        console.log('没有找到车');
        return next(err);
      }
      console.log('car是:' + car);

      res.render('Document', {
        current_user: ReqUser,
        car: car,
        car_Brand: car_Brand,
        carModelURL: carModel,
        ChooseModel: true,
      })
    })

  })

})

/*get MaintenaceCase page*/
router.get('/MaintenanceCase', function (req, res, next) {
  var ReqUser = req.session.user ? req.session.user : '';
  var tab = req.query.tab;
  var carModel = req.query.carModel;

  Car.getCarByQuery('', function (err, car) {
    if (err) {
      console.log('出错');
      return next(err);
    }
    let query = {};

    query.tab = tab || '';
    if (query.tab == '') {
      query.tab = { $in: [['机电维修案例'], ['电子维修案例']] };
    }
    if (carModel) {
      query.carModel = carModel;
    }
    query.delete = false;

    MaintenaceCase.getCaseTopicByQuery(query, '', function (err, caseTopic) {
      if (err) {
        console.log('出错');
        return next(err);
      }
      if (!caseTopic) {
        console.log('没有找到维修案例');
        return;
      }
      console.log('caseTopic是：' + caseTopic);
      res.render('MaintenanceCase', {
        current_user: ReqUser,
        car: car,
        caseTopic: caseTopic,
        ChooseModel: true,
        carModelURL: carModel
      })
    })
  })
})


//get home page

router.get('/', function (req, res, next) {
  console.log('进入主页');
  var ReqUser = req.session.user ? req.session.user : '';

  function carCase() {
    return new Promise(function (resolve, reject) {
      var carTopic = { limit: 12, sort: '-creat_at -updated_at' };
      let query = {};
      query.delete = false;
      MaintenaceCase.getCaseTopicByQuery(query, carTopic, function (err, caseTopic) {
        if (err) {
          console.log('出错');
          return next(err);
        } else {
          resolve(caseTopic);
        }
      })
    })
  }
  function carTopic() {
    return new Promise(function (resolve, reject) {
      let query = {'deleted':false};
      var helpOption = { limit: 9, sort: '-create_at -last_reply_at' };
      Topic.findByQuery(query, helpOption, function (err, helpTopic) {
        if (err) {
          console.log('出错');
          return next(err);
        } else { 
          resolve(helpTopic)
        }
      })
    })
  }
  Promise.all([carCase(), carTopic()]).then(values => { 
    res.render('index', {
      current_user: ReqUser,
      caseTopic: values[0],
      topic:values[1],
    });
    
  })

});

/*get backStage page*/
router.get('/backStage', function (req, res, next) {
  var ReqUser = req.session.user ? req.session.user.username : '';
  res.render('siteBg/backStage', {
    current_user: ReqUser,
  });
})

router.get('/affix', function (req, res, next) {
  res.render('Affix', {});
})
router.get('/email', function (req, res, next) {
  var email = 'eee@qq.com';
  var link = EmailLink.EmailLink(email);
  console.log(link);
  res.send(link);
});

router.get('/download', function (req, res, next) {
  console.log('进入');
  console.log(__dirname);
  console.log(__filename);
  console.log(process.cwd());
  console.log(path.resolve('./'));
  res.download('E:/BBS/招聘简章.docx', '下载的文件', function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log('下载成功');
    }
  });
});
module.exports = router;
