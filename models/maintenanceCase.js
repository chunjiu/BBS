const mongoose = require('mongoose');
var moment = require('moment');//时期日期处理库
moment.locale('zh-cn');//加载中文模块


const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const CaseSchema = new Schema({
    tab:String,
    username: String,
    title: String,
    carBrand: String,
    carModel: String,

    mileage: Number,//行驶里程
    FaultPhenomenon: String,//故障现象
    FaultConfirmation: String,//故障确认
    FaultCheck: String,//故障检查
    faultAnalysis: String,//故障分析
    TroubleShooting: String,//故障排除
    attention:String,//注意事项
    
    PhenomenonImg:String,//故障现象图片
    ConfirmationImg: String,//故障确认图片
    CheckImg: String,//故障检查图片
    AanlysisImg: String,//故障分析图片
    ShootingImg: String,//故障排除图片

    visit_count: { type: Number, default: 0 },//浏览次数
    delete: {type:Boolean,default:false},
    
    creat_at: { type: Date, default: Date.now() },
    updated_at: { type: Date, default: Date.now()},
})

CaseSchema.methods.create_at_ago = function () {
    var date = moment(this.create_at);
    return date.fromNow();
}
CaseSchema.methods.updated_at_ago = function () {
    var date = moment(this.updated_at);
    return date.fromNow();
}

const CaseTopic = mongoose.model('CaseTopic', CaseSchema);

exports.newAddSave = function (title,callback) { 
    let caseTopic = new CaseTopic();
    caseTopic.title = title;
    caseTopic.save(function (err) {
        callback(err,caseTopic)
    })

}

exports.getCaseTopicByTitle = function (title, callback) { 
    CaseTopic.findOne({ 'title': title }, callback);
}
exports.getCaseTopicByQuery = function (query,opt, callback) { 
    CaseTopic.find(query, {},opt,callback)
}
exports.getCaseTopicById = function (id, callback) { 
    CaseTopic.findById({'_id':id},callback)
}

