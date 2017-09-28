var mongoose = require('mongoose'); 
var moment = require('moment');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;//要用ObjectId属性必须先定义

var ReplyCommentSchema = new Schema({
    content: { type: String },
    reply_id: { type: ObjectId },//方便通过replyId查找
    topic_id: { type: ObjectId },
    username: {type:String},
    create_at: { type: Date, default: Date.now() },
    avatars: {type:String},

});

ReplyCommentSchema.methods.create_at_ago = function () {//给ReplySchema数据库添加create_at_ago方法
    var data = moment(this.create_at);
    return data.fromNow();
}

var Reply_comment = mongoose.model('Reply_comment', ReplyCommentSchema);

exports.newAndSave = function (content,reply_id,username,avatars,topic_id,callback) {
    var reply_comment = new Reply_comment()
    reply_comment.content = content;
    reply_comment.reply_id = reply_id;
    reply_comment.username = username;
    reply_comment.avatars = avatars;
    reply_comment.topic_id = topic_id;

    reply_comment.save(function (err) {
        callback(err,reply_comment);//保存并返回reply数据，方便路由调用reply.id，让评论提交刷新后定位到评论的地方
     });
}

exports.getReplyCommentByTopicID = function (topic_id, callback) {
    Reply_comment.find({'topic_id':topic_id},callback)
 }
exports.getRepliesByid = function (id,callback) {
    Reply_comment.findById({'_id':id},callback);
}

