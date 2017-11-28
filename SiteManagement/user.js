
var path = require('path');
var fs = require('fs');

var utility = require('utility');

var User = require('../models/user');
var config = require('../config');
var authMiddleWare = require('../middlewares/auth');
var mail = require('../common/mail');//发送邮件模块
var EmailLink = require('../common/emaillink');//生成登录邮箱链接


//注册页面
exports.signup = function (req, res) {
    res.render('sign/signup', { title: '注册', current_user: req.session.user ? req.session.user.username : '' });
}

/*文件上传
  router.post('/upload', function (req, res, next) {
   
   //var fields = [{ name: 'up', maxCount: 1 }, {name:'up1',maxCount:8}];
   //var upload = multer.fields(fields);多个input上传
  
    
   //var upload = multer.array('up', 5) 一个input 上传多个
   var username = req.session.user ? req.session.user.username : ''; 
   var upload = multer.single('up');
  
   upload(req, res, function (err) {
     if (err) {
       return console.log(err);
     }
     User.getUserByUserName(username, function (err, user) {
       if (err) { 
         return next(err);
       }
       if (!user) { 
         console.log('没有用户');
       }
       var newpath = req.file.path;
       console.log('原路径是：'+req.file.path);
       newpath = newpath.slice(6);//引入路径时要去掉public,因为中间件已经默认加入了public
       console.log('新路径是'+newpath);
       user.avatars = newpath;
       user.save(function (err) {
         res.redirect('/');
        });
     })
     //console.log('上传文件的全路径是：' + req.file.path)
  
   });
  })
  */
//头像裁剪上传
exports.upload = function (req, res, next) {
    console.log('进入upload');
    var username = req.session.user ? req.session.user.username : '';
    var img = req.body.imgURL.slice(22);//去掉base64的前22位字符
    var imgBuffer = Buffer.from(img, 'base64');//转化为bufer字符

    console.log('imgBuffer是否是一个对象：' + Buffer.isBuffer(imgBuffer));

    /**
     *写入文件时必须要有public,路径+文件名
     * @param 另：直接以用户名存储则会替换该用户所有之前的头像
     */
    var imgPath = 'public/uploads/' + username + '.jpg';
    fs.writeFile(imgPath, imgBuffer, function (err) {//写入文件
        if (err) {
            throw err;
        }
        User.getUserByUserName(username, function (err, user) {
            if (err) {
                throw err;
            }
            user.avatars = imgPath.slice(6);//去掉public
            console.log('user.avatars是：' + user.avatars);
            user.save(function (err) {
                if (err) {
                    console.log('保存出错');
                }
                res.send({
                    success: true,
                });
            });
        });
        console.log('the file has been saved');
    })
};

//注册提交
exports.sign = function (req, res) {

    var username = req.body.username;
    var password = req.body.password;
    var email = req.body.email;

    //注册并发送邮件
    User.getUserByQuery({
        '$or': [
            { 'username': username },
            { 'email': email }
        ]
    }, {}, function (err, docs) {
        if (err) {
            console.log('出错');
            return next(err);
        }
        if (docs.length > 1) {
            req.flash('error', '用户名或邮箱已存在')
            console.log('docs是' + docs);
            res.redirect('/signup');//注意，这里不要用'/sign/signup',redirect与get\post差不多
            //return;
        } else {
            console.log('邮箱是：' + email);
            var link = EmailLink.EmailLink(email);
            console.log(link);
            User.addsave(username, password, email, true, function (err, user) {
                if (!err) {
                    user.save(function (err) {
                        res.render('notify/notify', { success: '注册成功', link: link });
                    });
                    // req.flash('info', '注册成功，只差邮箱验证了');
                    console.log('邮箱是：' + email);
                    mail.sendActiveMail(email, utility.md5(email + 'abcde邮箱验证'), username)//注册成功则发送邮件

                } else {
                    res.redirect('/signup');
                    console.log('保存不成功');
                    console.log('保存不成功的原因是：' + err)
                }
            });
        }
    })
}

//邮箱验证
exports.activeAccount = function (req, res, next) {
    //res.render('index',{title:'express'});
    var key = req.query.key;
    var username = req.query.username;
    User.getUserByUserName(username, function (err, user) {
        if (err) {
            return next(err);
        }
        if (!user || utility.md5(user.email + 'abcde邮箱验证') !== key) {
            console.log('key是：' + key);
            return res.render('notify/notify', { error: '信息有误，账号无法登录', link: '' });
        }
        if (user.active) {
            return res.render('notify/notify', { success: '账号已经是激活状态', link: '' });
        }
        user.active = true;
        user.save(function (err) {
            if (err) {
                return next(err);
            }
            res.render('notify/notify', { success: '账号已经激活，请登录', link: '' });

        })
    })
}

//登录界面
exports.signin = function (req, res) {
    res.render('sign/signin', { current_user: req.session.user ? req.session.user.username : '', });
}
//登录
exports.login = function (req, res, next) {
    var ReqUser = req.session.user ? req.session.user.username : '';

    var username = req.body.inputusername;
    var password = req.body.inputpassword;
    console.log('username是：' + username);
    if (!username || !password) {
        /* req.flash('error', '信息不完整');
         res.redirect('/signin');*/
        return res.render('sign/signin', { errors: '信息不完整', current_user: req.session.user ? req.session.user.username : '', });//可以不用req.flash且好于用req.flash
    }
    var getUser;
    if (username.indexOf('@') !== -1) {
        getUser = User.getUserByMail;
    } else {
        getUser = User.getUserByUserName;
    }
    getUser(username, function (err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.render('sign/signin', { errors: '用户名或密码错误', current_user: req.session.user ? req.session.user.username : '', })
        }
        if (password != user.password) {
            return res.render('sign/signin', { errors: '用户名或密码错误', current_user: req.session.user ? req.session.user.username : '', })
        }
        if (!user.active) {
            mail.sendActiveMail(user.email, utility.md5(user.email + 'abcde邮箱验证'), user.username);
            return res.render('sign/signin', { errors: '此账号还没有被激活激活链接已发送到' + user.email + '邮箱,请查收', current_user: ReqUser });
        }
        console.log('user是' + user);
        authMiddleWare.gen_seesion(user, res, function (cb) { //登录信息保存进cookies,用数据库//req.session.user = user;//将session保存在内存中
            if (cb) {
                //authMiddleWare.authUser();
                console.log('登录成功');
                console.log('user.id是：' + user);
                res.redirect('/');
            }

        });

    })

}

//账号设置
exports.set = function (req, res) {
    var current_user = req.session.user ? req.session.user.username : '';
    User.getUserByUserName(current_user, function (err, user) {
        if (err) {
            return next(err);
        }

        res.render('user/setting', {
            current_user: current_user,
            user: user,
        });
    })
};

//账号退出
exports.singout =  function (req, res, next) {
    req.session.destroy();
    res.clearCookie(config.auth_cookie_name, { path: '/' });
    res.redirect('/');
}

//账号设置页
exports.setting = function (req, res, next) {
    let ReqUser = req.session.user ? req.session.user.username : '';
    res.render('siteBG/user', {
        current_user: ReqUser,
    })
}

//设置用户为管理员
exports.addAdmin = function (req, res, next) {
    console.log('进入用户权限设置');
    let user = req.body.user;
    console.log('user是：' + user);
    User.getUserByUserName(user, function (err, user) {
        if (err) {
            console.log('出错');
            return next(err);
        }
        if (!user) {
            console.log('没有找到user');
            return;
        }

        user.attr.admin = true;
        user.save(function (err, user) {
            if (err) {
                console.log('保存出错');
                return next(err);
            } else {
                console.log('保存后的user是：' + user);
                res.send({
                    success: true,
                })
            }
        })

    })
}