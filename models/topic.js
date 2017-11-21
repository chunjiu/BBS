var mongoose = require('mongoose');
var moment = require('moment');//时期日期处理库
moment.locale('zh-cn');//加载中文模块

/*mongoose.connect('mongodb://127.0.0.1:27017/NodeBlog', function (err) { 
    if (!err) {
        console.log('connected to MongoDB');
    } else { 
        console.log(err);
    }
})
*/
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var TopicSchema = new Schema({

    title: { type: String },
    tab: { type: String },//话题模块
    carBrand: { type: String },//汽车品牌
    carModel: {type:String},//品牌型号
    content: { type: String },
    reply_count: { type: Number, default: 0 },//回复数
    last_reply: { type: ObjectId },
    last_reply_at: { type: Date, default: Date.now() },//最后一次回复

    topic_avatars: {type:String},
    last_reply_user_avatars: {type:String},
    
    username: { type: String },//方便查找用户的所有话题
    visit_count: { type: Number, default: 0 },//浏览次数
    create_at: { type: Date, default: Date.now()},
    collect_count: { type: Number, default: 0 },//话题被收藏数
    
    updated_at: { type: Date, default: Date.now()},//最近的更新时间
    deleted: { type: Boolean, default: false },

    good: { type: Boolean, default: false },//精华贴
    top: {type:Boolean,default:false},//置顶贴
    
});

TopicSchema.methods.create_at_ago = function () {//methods添加方法必须在mongoose.model之前，前台页面调用须用<%=topic.create_at_ago()%>,topic为查询数据库的结果集合
    var date = moment(this.create_at);
    return date.fromNow();
}
TopicSchema.methods.last_reply_at_ago = function () { 
    var date = moment(this.last_reply_at);
    return date.fromNow();
}

var Topic = mongoose.model('Topic', TopicSchema);

exports.newAndSave = function (title,tab,carBrand,carModel,content,username,topic_avatars,callback) {
    var topic = new Topic();
    topic.title = title;
    topic.tab = tab;
    topic.carBrand = carBrand;
    topic.carModel = carModel;    
    topic.content = content;
    topic.username = username;
    topic.topic_avatars = topic_avatars;
    topic.save(function (err) { 
        callback(err, topic);
    });
}
 
exports.findTopics = function (title, callback) { 
    Topic.find({'deleted':false}, callback);
}
exports.findById = function (id, callback) {
    Topic.findById({'_id':id},callback)
}

exports.findByUserName = function (username, callback) { 
    Topic.find({ 'username': username },callback);
}

exports.findByQuery = function (query, opt, callback) {
    Topic.find(query, {}, opt, callback);
}

exports.findNoReply_topic = function (query, opt, callback) {//查找无人回复的话题
    Topic.find(query, {},opt,callback)
}
 
//模糊查找
exports.FuzzySearchByTitle = function (title) {
    var reg = new RegExp(title, 'i');
    console.log('模糊查找',reg)
    Topic.find({ "title": reg},callback)
 } 