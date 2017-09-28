var mongoose = require('mongoose'); 
var moment = require('moment');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;//要用ObjectId属性必须先定义

var ReplySchema = new Schema({
    content: { type: String },
    author_id: { type: ObjectId },
    reply_id: { type: ObjectId },
    reply_avatars: { type: String },//回复用户头像
    
    create_at: { type: Date, default: Date.now() },
    upate_at: { type: Date, default: Date.now() },
    content_is_html: { type: Boolean },
    ups: {type:Array},
    deleted: { type: Boolean, default: false },
    
    topic_id: { type: ObjectId },//方便查找回复的话题
    username: { type: String },//方便查找用户的回复

    reply_comment_count: {type:Number,default:0}//回复单个评论的数量
});

ReplySchema.methods.create_at_ago = function () {//给ReplySchema数据库添加create_at_ago方法
    var data = moment(this.create_at);
    return data.fromNow();
}

var Reply = mongoose.model('Reply', ReplySchema);

exports.newAndSave = function (content, topic_id,username,reply_avatars,callback) {
    var reply = new Reply();
    reply.content = content;
    reply.username = username;
    reply.topic_id = topic_id;
    reply.reply_avatars = reply_avatars;


    reply.save(function (err) {
        callback(err,reply);//保存并返回reply数据，方便路由调用reply.id，让评论提交刷新后定位到评论的地方
     });
}


exports.getRepliesByQuery = function (query,opt, callback) {
    Reply.find(query, {},opt,callback);
}

exports.getRepliesByid = function (id,callback) {
    Reply.findById({'_id':id},callback);
}

exports.getRepliesByUsername = function (username, callback) {
    Reply.find({'username':username},callback)
 }