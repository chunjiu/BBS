
var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId


var CarSchema = new Schema({
    carFisrtWord: String,
    carBrand: String,
    carModel: Array,
    carAvatars: String,
    carYear: [Schema.Types.Mixed],
    carModelAvatars: String,//车型图片
    carInformation: [Schema.Types.Mixed],//维修资料
})


var Car = mongoose.model('Car', CarSchema);

/*User.prototype.findOne = function (username,callback) {
    User.find(username, callback);
 }*/



exports.addsave = function (carFisrtWord, carBrand,carYear, carAvatars, callback) {


    var car = new Car();//实例化Car模型
    car.carFisrtWord = carFisrtWord;
    car.carBrand = carBrand;
    car.carYear = {carYear:carYear}//这里要注意书写顺序
    car.carAvatars = carAvatars;

    car.save(function (err) {
        callback(err, car);
    });
}
exports.remove = function (carBrand, callback) { 
    console.log('开始删除品牌');
    Car.remove({carBrand:carBrand},callback)
}

exports.getCarByCarBrand = function (carBrand, callback) {
    Car.findOne({ 'carBrand': carBrand }, callback);
}
exports.getCarByQuery = function (query, opt, callback) {
    Car.find(query, {}, opt, callback)
}
exports.getCarByModel = function (carModel, callback) {
    console.log('根据车型查询资料')
    Car.find({ "carModel": { $all: [carModel]}}, function (err,car) { 
        if (err) {
            console.log('查询出错');
        }
        if (!car) { 
            console.log('没有找到车');
        }
        else { 
            console.log('正常查询');
            console.log('car是：'+car);
        }
    })
 }


exports.removeInformation = function (res,carBrand, carInformation,carYear, callback) { 
    console.log('开始资料路径删除');
    Car.update({ 'carBrand': carBrand }, { $pull: { "carInformation": { "carInformation": carInformation,"carYear":carYear} } }, function (err) { 
        if (err) {
            console.log('查询出错');
            return next(err);
        } else { 
            res.send({
                success: true,
            });
            console.log('资料路径删除成功');
        }
    })
}
exports.updateModel = function (carBrand,carModel) { 
    console.log('删除旧的车型信息');
    Car.update({ 'carBrand': carBrand }, { $pull: { 'carModel': { 'carModel': carModel } } }, function (err) { 
        if (err) {
            console.log('出错');
            return next(err);
        }
        else { 
            console.log('车型删除成功');
        }
    })   
}
/*
exports.getCarByCarBrand = function (query, opt, callback) { 
    User.find(query, '', callback);
}

exports.getUserByMail = function (email, callback) {
    User.findOne({'email':email},callback);
}
exports.getUserById = function (id, callback) {
    User.findById(id,callback)
}
 
exports.getUserByTopicId = function (topicId, callback) {
    User.findOne({'topic_id':topicId},callback);
}
*/