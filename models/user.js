var mongoose = require('mongoose');
var moment = require('moment');//时期日期处理库
moment.locale('zh-cn');//加载中文模块

mongoose.Promise = global.Promise;//加入数据库异步操作
mongoose.createConnection('mongodb://127.0.0.1:27017', { server: {poolSize:20} }, function (err) { 
    if (!err) {
        console.log('connected to MongoDB');
    } else { 
        console.log(err);
    }
})

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId

var UserSchema = new Schema({
    username: { type: String },
    password: { type: String },
    email: { type: String },
    active: { type: Boolean, default: false },
    create_at: {type:Date,default:Date.now()},//注册时间

    topic_id: {type:ObjectId},//用户数据、话题数据、回复数据互查ID

    score: { type: Number, default: 0 },
    topic_count: { type: Number, default: 0 },
    collect_topic_count: { type: Number, default: 0 },//被收藏的话题数
})

UserSchema.methods.create_at_ago = function () { 
    var date = moment(this.create_at);
    return date.fromNow();
}
var User = mongoose.model('User', UserSchema);

/*User.prototype.findOne = function (username,callback) {
    User.find(username, callback);
 }*/

exports.addsave = function (name, password, email,active,callback) {
    var user = new User();//实例化User模型
    user.username = name;
    user.password = password;
    user.email = email;
    user.active = active;
    user.save(callback);
}
 
exports.getUserByQuery = function (query, opt, callback) { 
    User.find(query, '', callback);
}
exports.getUserByUserName = function (username, callback) { 
    User.findOne({'username':username},callback);
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
