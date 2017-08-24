var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var CollectSchema = new Schema({
    username: { type: String },
    topic_id: { type: ObjectId },
    create_at: {type:Date,default:Date()}
});

var Collect = mongoose.model('Collect', CollectSchema);

exports.newAndSave = function (username, topic_id,callback) {
    var collect = new Collect();
    collect.username = username;
    collect.topic_id = topic_id;
    collect.save(callback);
}

exports.getCollectByTopicId = function (topic_id, callback) {
    Collect.findOne({ 'topic_id': topic_id }, callback)
};

exports.remove = function (topic_id, username,callback) {
    Collect.remove({ 'topic_id': topic_id, 'username': username }, callback)
};