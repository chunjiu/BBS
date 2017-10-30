var fs = require('fs');
//var path = require('path');

var multer = require('../common/multerCar');//文件上传模块
var Car = require('../models/car');
var CaseTopic = require('../models/maintenanceCase');

exports.carbrand = function (req, res, next) {
    res.render('siteBG/CarBrand', {
        current_user: req.session.user ? req.session.user.username : '',
    });
}

//添加汽车品牌
exports.carbrandAdd = function (req, res, next) {
    console.log('进入carbrandAdd');
    var carFisrtWord = req.body.carFisrtWord;
    var carBrand = req.body.carBrand;
    var carModel = req.body.carModel;
    var carYear = req.body.carYear;
    var carAvatars = '';
    Car.getCarByCarBrand(carBrand, function (err, car) {
        if (err) {
            return next(err)
        }
        if (!car) {
            Car.addsave(carFisrtWord, carBrand, carModel, carYear, carAvatars, function (err, car) {
                if (err) {
                    throw (err)
                } else {
                    console.log('汽车品牌添加成功');
                    res.redirect('/carbrand');
                }
            })
        } else {
            // car.carModel.addToSet(carModel,carYear)
            var Year = [{ carModel: carModel, carYear: carYear }];//这里要注意与carmodel的书写顺序
            car.carYear.addToSet(Year);
            car.carModel.addToSet(carModel);
            car.save(function (err) {
                if (err) {
                    return next(err)
                }
                console.log('品牌添加成功');
                res.redirect('/carbrand');
            });
        }
    })
}

//上传汽车品牌商标
exports.uploadTrademark = function (req, res, next) {
    console.log('进入商标上传');

    if (!req.body.baseData) {
        return next();
    }

    var carBrand = req.body.carBrand;
    var img = req.body.baseData.slice(22);//去掉base64的前22位字符
    var imgBuffer = Buffer.from(img, 'base64');//转化为bufer字符
    console.log('品牌是：' + carBrand);

    console.log('imgBuffer是否是一个对象：' + Buffer.isBuffer(imgBuffer));

    /**
     *写入文件时必须要有public,路径+文件名
     * @param 另：直接以用户名存储则会替换该用户所有之前的头像
     */
    var imgPath = 'public/uploads/car/' + carBrand + '.jpg';
    fs.writeFile(imgPath, imgBuffer, function (err) {//写入文件
        if (err) {
            throw err;
        }
        Car.getCarByCarBrand(carBrand, function (err, car) {
            if (err) {
                console.log('没有查找到这个牌');
                throw err;
            }
            if (!car) {
                console.log('没有查到这个品牌')
            }
            console.log('car是' + car)
            car.carAvatars = imgPath.slice(6);//去掉public
            car.save(function (err) {
                if (err) {
                    console.log('保存出错');
                    return next(err);
                }
                res.send({
                    success: true,
                });
                console.log('the file has been saved');
            });
        });
    })
}

//获取所有汽车品牌
exports.getCar = function (req, res, next) {
    console.log('进入获取汽车品牌');
    Car.getCarByQuery({}, function (err, car) {
        if (err) {
            return next(err)
        }
        if (!car) {
            console.log('没有找到车');
        }
        res.send({
            success: true,
            car: car,
        })
    })
}

//获取指定品牌的车型
exports.getCarModel = function (req, res, next) {
    var carBrand = req.body.carBrand;
    Car.getCarByCarBrand(carBrand, function (err, car) {
        if (err) {
            return next(err)
        }
        if (!car) {
            console.log('没有找到car');
        }
        res.send({
            car: car,
        })
    });
}

//维修资料上传

exports.uploadInformation = function (req, res, next) {

    //var fields = [{ name: 'up', maxCount: 1 }, {name:'up1',maxCount:8}];
    //var upload = multer.fields(fields);多个input上传


    //var upload = multer.array('up', 5) 一个input 上传多个
    console.log('进入维修资料上传');
    var upload = multer.single('upInformation');

    var carBrand = req.query.Brand
    var carYear = req.query.Year;
    var carModel = req.query.Model;

    console.log('carModle是：' + carModel);
    console.log('carYear是：' + carYear);


    upload(req, res, function (err) {
        if (err) {
            return console.log(err);
        }
        Car.getCarByCarBrand(carBrand, function (err, car) {
            if (err) {
                return next(err);
            }
            if (!car) {
                console.log('没有找到车');
            }
            console.log('car是：' + car)
            var newpath = req.file.path;
            console.log('原路径是：' + req.file.path);
            console.log('原文件名是：' + req.file.originalname)
            newpath = newpath.slice(6);//引入路径时要去掉public,因为中间件已经默认加入了public
            console.log('新路径是' + newpath);
            var carInformation = { carModel: carModel, carYear: carYear, carInformation: newpath, fileName: req.file.originalname };
            car.carInformation.addToSet(carInformation);
            car.save(function (err) {
                if (err) {
                    console.log('保存出错');
                    return next(err)
                }
                res.redirect('/information');
            });
        })
        //console.log('上传文件的全路径是：' + req.file.path)

    })
}

//删除资料
exports.removeInformation = function (req, res, next) {
    console.log('进入资料删除');
    var carBrand = req.body.carBrand;
    var carInformation = req.body.carInformation;
    console.log('carBrand是：' + carBrand);
    console.log('carInformation是：' + carInformation);

    Car.removeInformation(res, carBrand, carInformation, function (err, car) { })

    carInformation = carInformation.replace(/\\/g, '/');
    var newPath = 'e:/BBS/public' + carInformation;//注意字符串间不能有空格

    console.log('newPath是：' + newPath)
    fs.unlink(newPath, function (err) {
        if (err) {
            console.log('文件删除出错');
        } else {
            console.log('文件删除成功')
        }
    })
}

//上传维修案例
exports.maintenanceCase = function (req, res, next) {
    console.log('进入案例上传');
    var carBrand = req.body.carBrand;
    console.log('carBrand是' + carBrand);
    if (carBrand) {
        console.log('进入content保存');
        let title = req.body.title;
        let username = req.body.username;
        let carBrand = req.body.carBrand;
        let carModel = req.body.carModel;
        let mileage = req.body.mileage;
        let FaultPhenomenon = req.body.FaultPhenomenon;
        let FaultConfirmation = req.body.FaultConfirmation;
        let FaultCheck = req.body.FaultCheck;
        let faultAnalysis = req.body.faultAnalysis;
        let TroubleShooting = req.body.TroubleShooting;

        CaseTopic.getCaseTopicByTitle(title, function (err, caseTopic) {
            if (err) {
                console.log('出错');
                return next(err);
            }
            if (!caseTopic) {
                console.log('没有找到caseTopic');
                next();
            }
            caseTopic.username = username;
            caseTopic.carBrand = carBrand;
            caseTopic.carModel = carModel;
            caseTopic.mileage = mileage;
            caseTopic.FaultPhenomenon = FaultPhenomenon;
            caseTopic.FaultConfirmation = FaultConfirmation;
            caseTopic.FaultCheck = FaultCheck;
            caseTopic.faultAnalysis = faultAnalysis;
            caseTopic.TroubleShooting = TroubleShooting;
            console.log('caseTopic是:'+caseTopic);
            caseTopic.save(function (err) {
                if (err) {
                    console.log('保存出错');
                    return next(err)
                } else { 
                    res.redirect('/')
                }
             });
            
        })
    } else {
        console.log('进入title保存');
        let title = req.body.OriginalValue || req.body.val;
        let newTitle = req.body.newTitle;
 
        console.log('title是：' + title);
        console.log('newTitle是：'+newTitle);
        CaseTopic.getCaseTopicByTitle(title, function (err, caseTopic) {
            if (err) {
                console.log('出错');
                return next(err);
            }
            if (!caseTopic) {
                console.log('title不存在');
                CaseTopic.newAddSave(title, function (err, caseTopic) {
                    if (err) {
                        console.log('出错');
                        return next(err)
                    } else {
                        console.log('caseTopic保存成功');
                    }
                })
            } else {
                caseTopic.title = newTitle;
                caseTopic.save(function () { 
                    res.send({
                        success: true
                    })
                });
            }
        })
    }
}


//上传维修案例图片
exports.maintenanceCaseImg = function (req, res, next) {
    console.log('进入维修案例图片上传');

    if (!req.body.baseData) {
        return next();
    }

    var carModel = req.body.carModel;
    var title = req.body.title;
    var faultType = req.body.faultType;

    var img = req.body.baseData.slice(22);//去掉base64的前22位字符
    var imgBuffer = Buffer.from(img, 'base64');//转化为bufer字符

    console.log('车型是：' + carModel);
    console.log('title是：' + title);
    console.log('faultTyep是：' + faultType);

    console.log('imgBuffer是否是一个对象：' + Buffer.isBuffer(imgBuffer));

    /**
     *写入文件时必须要有public,路径+文件名
     * @param 另：直接以用户名存储则会替换该用户所有之前的头像
     */
    var imgPath = 'public/uploads/maintenanceCaseImg/' + carModel + Date.now() + '.jpg';
    fs.writeFile(imgPath, imgBuffer, function (err) {//写入文件
        if (err) {
            throw err;
        }
        CaseTopic.getCaseTopicByTitle(title, function (err, caseTopic) {
            if (err) {
                console.log('出错');
                return next(err);
            }
            if (!caseTopic) {
                console.log('没有找到这个案例');
                return next();
            }
            console.log('进入查找');
            var newPath = imgPath.slice(6);

            switch (faultType) {
                case 'PhenomenonImg':
                    caseTopic.PhenomenonImg = newPath;
                    break;
                case 'ConfirmationImg':
                    caseTopic.ConfirmationImg = newPath;
                    break;
                case 'CheckImg':
                    caseTopic.CheckImg = newPath;
                    break;
                case 'AanlysisImg':
                    caseTopic.AanlysisImg = newPath;
                    break;
                case 'ShootingImg':
                    caseTopic.ShootingImg = newPath;
                    break;
            }
            console.log('caseTopc是:'+CaseTopic);
            caseTopic.save(function (err) {
                if (err) {
                    console.log('保存出错');
                    return next(err);
                } else {
                    console.log('图片保存成功');

                }
            });
        })
    })
}