
var express = require('express');

var config = require('../config');
var User = require('../models/user');


 
function gen_seesion (user, res) {
    var auth_token = user.id + '$$';
    var opts = {
        path: '/',
        maxAge: 1000 * 60 * 60 * 5,//5个小时也可以设置1000 * 60 * 60 * 24 * 30 （30天）
        signed: true,
        httpOnly: true

    };
    res.cookie(config.auth_cookie_name, auth_token,opts);//参数为字符串或JSON数据
}
exports.gen_seesion = gen_seesion;

exports.authUser = function (req, res, next) {
    console.log('进入auth');
    var auth_token = req.signedCookies[config.auth_cookie_name];//对应的user.id
    if (!auth_token||auth_token=='') { 
        console.log('auth的cookie没有签名');
        return next();
    }
    console.log('auth是：' + auth_token);
    
    var auth = auth_token.split('$$');//将字符串数组按$$分割
    var user_id = auth[0];//去掉了$$
    User.getUserById(user_id, function (err, user) {
        if (err) { 
            return next(err);
        }
        console.log('auth里的usr:'+user);
        if (!user) {
            return next();
        } else {
            if (req.session) {//退出登录时清除了cookie，req.session便是“undefined”了
                console.log('session是：'+req.session);
                res.locals.current_user = req.session.user = JSON.parse(JSON.stringify(user));//转化为JSON对象，因为JSON对象可以随意添加属性，并能被渲染
                if (config.admins.hasOwnProperty(user.username)) {
                    req.session.user.is_admin = true;
                    console.log('admin是' + req.session.user.is_admin);
                }
            } 
            return;
        }
       
    });
   return next();
}
 

exports.userRequired = function (req,res,next) {
    console.log('在auth.j中sessionuser是：'+req.session.user);
    if (!req.session.user) {
        console.log('未登录');
        var msg ='<p>您还未登录，<span>请先<a href="/signin" style="color:red">登录</a></span></p>'
        return res.render('notify/notify',{error:msg,link:''});
    } else {
        console.log('属已登录奖态');
        next();
    }    
 }