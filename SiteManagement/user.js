var User = require('../models/user');

exports.setting = function (req, res, next) { 
    let ReqUser = req.session.user ? req.session.user.username : '';
    res.render('siteBG/user', {
        current_user:ReqUser,
    })
}

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
        let admin = { admin: true };
        user.attr.addToSet(admin);
        user.save(function (err) { 
            if (err) {
                console.log('保存出错');
                return next(err);
            } else { 
                res.send({
                    success: true,
                })
            }
        })

    })
}