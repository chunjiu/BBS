
var express = require('express');

var config = require('../config');
var User = require('../models/user'); 


var mongoose = require('mongoose');
var UserModel = mongoose.model('User');//直接用User数据库模版
 
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

    
    var auth_token = req.signedCookies[config.auth_cookie_name];//对应的user.id
    if (!auth_token||auth_token=='') { 
        console.log('auth的cookie没有签名');
        return next();
    }
   
    var auth = auth_token.split('$$');//将字符串数组按$$分割
    var user_id = auth[0];//去掉了$$
    User.getUserById(user_id, function (err, user) {
        if (err) { 
            return next(err);
        }
        if (!user || typeof (user) === 'undefined') {
           return next();
        }else { 
            console.log('进入authuer');
            console.log('auth的req:'+req.session.user);
            return res.locals.current_user = req.session.user = user.username;//全局seeion用户，全局本地用户
        }
       
    });
   return next();
}
 

exports.userRequired = function (req,res,next) {
    console.log('在auth.j中sessionuser是：'+req.session.user);
    if (!req.session.user) {
        console.log('未登录');
        return res.render('notify/notify',{error:'您还未登录，请先登录',link:''});
    } else {
        console.log('属已登录奖态');
        next();
    }    
 }