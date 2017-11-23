var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var flash = require('connect-flash');
var session = require('express-session');

var RedisStore = require('connect-redis')(session);
var mongoose = require('mongoose');

var site = require('./routes/site');
var users = require('./routes/users');

var config = require('./config');
var auth = require('./middlewares/auth');

var ueditor = require("ueditor");

var easyMonitor = require('easy-monitor');//内存泄漏检查



var app = express();
//app.set('port',(process.env.PORT||80));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views/dist')));//增加一静态文件服务，用于webpack

mongoose.connect(config.mongodb);

//设置会话
app.use(cookieParser(config.session_secret));//使用签名
//使用redis存储session
app.use(session({
  secret: config.session_secret,
  store: new RedisStore({
    //url: config.db_db,
    port: config.db_host,
    host: config.db_host,
    db: config.db_db,
    pass:config.db_password,
  }),
	/*Key: 'es5eiqm6akdb',
	cookie: {
		maxAge: 1000 * 60 * 60 * 24 * 30
	},*/
  resave: false,
  saveUninitialized: true
}));
//app.usr(routes);
app.use(flash());
app.use(function (req, res, next) {
  res.locals.errors = req.flash('error');
  res.locals.infos = req.flash('info');
  next();
});

//文本编辑器

app.use("/ueditor/ue", ueditor(path.join(__dirname, 'public'), function(req, res, next) {
  var imgDir = '/img/ueditor/' //默认上传地址为图片
  var ActionType = req.query.action;
    if (ActionType === 'uploadimage' || ActionType === 'uploadfile' || ActionType === 'uploadvideo') {
        var file_url = imgDir;//默认上传地址为图片
        /*其他上传格式的地址*/
        if (ActionType === 'uploadfile') {
            file_url = '/file/ueditor/'; //附件保存地址
        }
        if (ActionType === 'uploadvideo') {
            file_url = '/video/ueditor/'; //视频保存地址
        }
        res.ue_up(file_url); //你只要输入要保存的地址 。保存操作交给ueditor来做
        res.setHeader('Content-Type', 'text/html');
    }
  //客户端发起图片列表请求
  else if (ActionType === 'listimage'){
    
    res.ue_list(imgDir);  // 客户端会列出 dir_url 目录下的所有图片
  }
  // 客户端发起其它请求
  else {
    res.setHeader('Content-Type', 'application/json');
    res.redirect('/ueditor/ueditor.config.json')
  }
}));

app.use(auth.authUser);
app.use('/', site);
app.use('/users', users);




// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.listen(443, function () { 
  console.log('服务器已在443端口运行');
});
app.listen(80, function () {//上线要改成80
  console.log('服务器已在300端口运行');
})

module.exports = app;
