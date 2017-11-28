var Car = require('../models/car');
var MaintenaceCase = require('../models/maintenanceCase');
var Topic = require('../models/topic');


//get home page
exports.index = function (req, res, next) {
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
};

/*get information page*/
exports.information = function (req, res, next) {
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

}

/*get MaintenaceCase page*/
exports.MaintenanceCase = function (req, res, next) {
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
}

/*get backStage page*/
exports.backStage = function (req, res, next) {
  var ReqUser = req.session.user ? req.session.user.username : '';
  res.render('siteBg/backStage', {
    current_user: ReqUser,
  });
}

