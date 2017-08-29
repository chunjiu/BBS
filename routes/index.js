var express = require('express');
var router = express.Router();

var crypto = require('crypto');
var utility = require('utility');

var mail = require('../common/mail');//发送邮件模块
var EmailLink = require('../common/emaillink');//登录邮箱链接

var User = require('../models/user');
var Topic = require('../models/topic');
var Reply = require('../models/reply');
var Collect = require('../models/collect');

var config = require('../config');
var authMiddleWare = require('../middlewares/auth');

var EventProxy = require('eventproxy');//异步控制


/* GET home page. */
router.get('/',authMiddleWare.authUser, function (req, res, next) {
  //res.status(403).end();

  var page = parseInt(req.query.page, 10) || 1;
  var tab = req.query.tab || '全部';

  var query = {};
  if (!tab || tab == '全部') {
    query.tab = { $nin: ['招聘'] };//db.col.find(tab:{$nin:['招聘']})
  } else if (tab == '精华') { 
    query.good = true;
  } else{ 
    query.tab = tab;
  }

  var limit = 20;
  var options = {skip:(page-1)*limit,limit:limit,sort:'-top -last_reply_at'};

  Topic.findByQuery(query,options, function (err, topics) {
    if (err) {
      console.log('err是：' + err);
    } else {
      console.log('req.cookies是：' + req.signedCookies[config.auth_cookie_name]);
      console.log('req.session.uer是：' + req.session.user);
      var ReqUser = req.session.user?req.session.user.username:'';
      User.getUserByUserName(ReqUser, function (err, user) {
        if (err) {
          return next(err);
        }
        Topic.findByQuery(query, function (err, topics_count) {
          var pages = Math.ceil((topics_count.length) / limit);
          res.render('index', {
            topic: topics,
            user: user,
            current_user: req.session.user,
            tabs: config.tabs,
            current_page: page,
            tab: tab,
            pages: pages,   
          });
          // res.download('/nodeMy博客/sheng.txt','sheng.txt');用于下载页面
        });
      });
    }
  });
});
//进入单个话题
router.get('/:id/tid', function (req, res, next) {
  var ep = new EventProxy();
  var topic_id = req.params.id;
  Topic.findById(req.params.id, function (err, topics) {
    topics.visit_count += 1;//浏览量
    Reply.getRepliesByQuery({ 'topic_id': topic_id,'deleted':false }, {}, function (err, replies) {
      if (err) {
        return next(err);
      }
      topics.save();
      console.log('res.session.user是：' + req.session.user);
      User.getUserByUserName(topics.username, function (err, user) {
        if (err) {
          console.log('出错');
          return next(err);
        }
        console.log('运行到这里');
        Topic.findByQuery({ 'username': topics.username, 'deleted': false }, { limit: 5 }, function (err, OtherTopics) {//注意：topic.id只有唯一的一个。多个topic里存储了同一个用户名,故用user.getUserByUserName（topic.username）来查找

          Topic.findNoReply_topic({ 'username': topics.username, 'reply_count': 0, 'deleted': false }, { limit: 5 }, function (err, noreplytopic) {
            if (err) {
              console.log('无人回复的话题查找错误');
              return next(err);
            }
            Collect.getCollectByTopicId(topic_id, function (err, collect) {
              if (err) {
                return next(err);
              }
              res.render('topic/index', {
                topic: topics,
                reply: replies,
                user: user,
                current_user: req.session.user,
                othertopics: OtherTopics,
                noreplytopic: noreplytopic,
                is_collect: collect
                //errors:errors
              });
              //console.log('查看话题的作者是：' + OtherTopics);
            });
          });
        });
      })
    })
  });
});

//收藏该话题
router.post('/topic/collect', function (req, res, next) {
  console.log('进入collect');
  var topic_id = req.body.topic_id;
  console.log(topic_id);
  Topic.findById(topic_id, function (err, topic) {
    if (err) {
      return next(err);
    }
    if (!topic) {
    }
    Collect.newAndSave(topic.username, topic_id, function (err) {
      if (err) {
        return next(err);
      }
      res.json({ status: 'success' });
    })
    User.getUserByUserName(topic.username, function (err, user) {
      if (err) {
        return next(err);
      }
      if (!user) {
        console.log('收藏路由里根据topic.user查不到该用户');
        return next(err);
      }
      user.collect_topic_count += 1;
      user.save();
    })
    topic.collect_count += 1;
    topic.save();
  });
})

//取消收藏该话题
router.post('/topic/de_collect', function (req, res, next) {
  console.log('进入de_collect');
  var topic_id = req.body.topic_id;
  Topic.findById(topic_id, function (err, topic) {
    if (err) {
      return next(err);
    }
    if (!topic) {
      res.json({ status: 'failed' });
    }
    Collect.remove(topic_id, topic.username, function (err, removeResult) {
      if (err) {
        return next(err);
      }
      res.json({ status: 'success' });
      User.getUserByUserName(topic.username, function (err, user) {
        if (err) {
          return next(err);
        }
        if (!user) {
          console.log('取消收藏路由里找不到该用户');
          console.log('user是：' + user);
        }
        user.collect_topic_count -= 1;
        user.save();
      })
      topic.collect_count -= 1;
      topic.save();
    });
  });
});

//加精该话题
router.get('/topic/:id/good', function (req, res, next) { 
  var topic_id = req.params.id;
  Topic.findById(topic_id, function (err, topic) {
    if (err) { 
      return next(err);
    }
    if (!topic) { 
      return next(err);
      console.log('该话题不存在');
    }
    topic.good = !topic.good;
    topic.save(function (err) { 
      if (err) { 
        return next(err);
      }
      var msg = topic.good ? '该话题加精华成功' : '该话题精华已被取消';
      res.render('notify/notify', {error:msg});
    });

   })
});

//置顶该话题
router.get('/topic/:id/top', function (req, res, next) { 
  var topic_id = req.params.id;
  Topic.findById(topic_id, function (err, topic) { 
    if (err) { 
      return next(err);
    }
    if (!topic) { 
      return next(err);
    }
    topic.top = !topic.top;
    topic.good = true;
    topic.save(function (err) { 
      if (err) { 
        return next(err);
      }
      var msg = topic.top ? '该话题置顶成功' : '该话题已被取消置顶';
      res.render('notify/notify', {error:msg});      
    });
  })
});

//进入该话题用户主页
router.get('/user/:username', function (req, res, next) {

});

//保存回复
router.post('/:id/reply', function (req, res, next) {
  console.log('进入reply');
  var content = req.body.r_content;
  var topic_id = req.params.id;
  console.log('content是' + content);

  if (content ==='') { //这里其实用ajax更好，整个回复都用ajax
    return res.render('notify/notify', {
      error:'回复内容不能为空'
    });
  }
  Topic.findById(topic_id, function (err, topic) {
    if (err) {
      return next(err);
    }
    topic.last_reply_at = new Date();
    topic.reply_count += 1;//话题回复数+1
    topic.save();
    Reply.newAndSave(content, topic_id, req.session.user, function (err, reply) {//这里记住要返回reply,方便调用reply.id进行网页自动定位
      if (err) {
        return next(err);
      }
      console.log('保存成功');

      //Topic.updateLastReply(topic_id);
      res.redirect('/' + topic_id + '/tid/'+'#'+reply.id);//#是网页刷新后定位到#后面新保存reply.id的地址
    });
  });

});

//删除回复
router.post('/reply/:reply_id/delete', function (req, res, next) {
  var reply_id = req.params.reply_id;
  console.log('删除回复里的reply_id'+reply_id);
  Reply.getRepliesByid(reply_id, function (err, reply) {
    if (err) { 
      
      return next(err);
    }
    reply.deleted = true;
    reply.save();
    Topic.findById(reply.topic_id, function (err, topic) {
      if (err) { 
        console.log('出错2');
        return next(err);
      }
      topic.reply_count -= 1;
      topic.save(function () { 
        res.json({status:'success'})
      });
    });
   });
 });

//回复点赞
router.post('/reply/nice', function (req, res, next) {
  console.log('进入nice');
  var reply_id = req.body.reply_id;
  var user = req.session.user;
  console.log('user是：' + user);
  Reply.getRepliesByid(reply_id, function (err, reply) {
    if (err) {
      console.log('出错1');
      return next(err);
    }
    if (reply.username === user) {
      res.send({
        success: false,
        message: '呵呵，不可以自己给自己点赞。'
      });
      return;
    }
    reply.ups = reply.ups || [];
    var upInDex = reply.ups.indexOf(user);
    if (upInDex === -1) {
      console.log('进入up');
      reply.ups.push(user);
      UpOrDowun = 'up';
    } else {
      console.log('点赞的USER:' + reply.ups.indexOf(user));
      reply.ups.splice(upInDex, 1);
      UpOrDowun = 'down';
    }
    reply.save(function (err) {
      if (err) {
        return next(err);
      }
      res.send({
        success: true,
        UpOrDowun: UpOrDowun
      });
    })
  });
});

//注册页面
router.get('/signup', function (req, res) {
  res.render('sign/signup', { title: '注册', current_user: req.session.user });
})
router.get('/test', function (req, res) {
  res.render('sign/test', {});
})
//注册提交
router.post('/sign', function (req, res) {
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
    if ((docs.length) >= 1) {
      req.flash('error', '用户名或邮箱已存在')
      console.log('docs是' + docs);
      res.redirect('/signup');//注意，这里不要用'/sign/signup',redirect与get\post差不多
      //return;
    } else {
      var link = EmailLink.EmailLink(email);
      console.log(link);
      User.addsave(username, password, email, false, function (err) {
        if (!err) {
         // req.flash('info', '注册成功，只差邮箱验证了');
          console.log('邮箱是：' + email);
          mail.sendActiveMail(email, utility.md5(email + 'abcde邮箱验证'), username)//注册成功则发送邮件
          res.render('notify/notify', {success:'注册成功',link:link});
        } else {
          res.redirect('/signup');
          console.log('保存不成功');
          console.log('保存不成功的原因是：' + err)
        }
      });
    }
  })
})

//邮箱验证
router.get('/active_account', function (req, res, next) {
  //res.render('index',{title:'express'});
  var key = req.query.key;
  var username = req.query.username;
  User.getUserByUserName(username, function (err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      console.log('username是：' + username);
      return next(err);
    }
    if (!user || utility.md5(user.email + 'abcde邮箱验证') !== key) {
      console.log('key是：' + key);
      return res.render('notify/notify', { error: '信息有误，账号无法登录',link:'' });
    }
    if (user.active) {
      return res.render('notify/notify', { success: '账号已经是激活状态',link:'' });
    }
    user.active = true;
    user.save(function (err) {
      if (err) {
        return next(err);
      }
      res.render('notify/notify', { success: '账号已经激活，请登录',link:'' });

    })
  })
})

//登录界面
router.get('/signin', function (req, res) {
  res.render('sign/signin', { current_user: req.session.user });
})
//登录
router.post('/login', function (req, res, next) {
  var username = req.body.inputusername;
  var password = req.body.inputpassword;
  console.log('username是：' + username);
  if (!username || !password) {
    /* req.flash('error', '信息不完整');
     res.redirect('/signin');*/
    return res.render('sign/signin', { errors: '信息不完整', current_user: req.session.user });//可以不用req.flash且好于用req.flash
  }
  var getUser;
  if (username.indexOf('@') !== -1) {
    getUser = User.getUserByMail;//将涵数赋给getUser变量
  } else {
    getUser = User.getUserByUserName;
  }
  getUser(username, function (err, user) {
    if (err) {
      console.log('出错1');
      return next(err);
    }
    if (!user) {
      console.log('出错2');
      return res.render('sign/signin', { errors: '用户名或密码错误', current_user: req.session.username })
    }
    if (password != user.password) { 
      console.log('出错3');
      return res.render('sign/signin', { errors: '用户名或密码错误', current_user: req.session.username })
    }
    if (!user.active) {
      console.log('出错4');
      mail.sendActiveMail(user.email, utility.md5(user.email + 'abcde邮箱验证'), user.username);
      return res.render('sign/signin', { errors: '此账号还没有被激活激活链接已发送到' + user.email + '邮箱,请查收' });
    }
    console.log('user是' + user);
    authMiddleWare.gen_seesion(user, res);//登录信息保存进cookies,用数据库
    //req.session.user = user;//将session保存在内存中，则不需要auth里面的auth中间件了
    console.log('登录成功');
    console.log('user.id是：' + user.id);
    res.redirect('/');
  })

})

//账号退出
router.get('/singout', function (req, res, next) {
  req.session.destroy();
  res.clearCookie(config.auth_cookie_name, { path: '/' });
  res.redirect('/');
})

//发布话题页面
router.get('/create', authMiddleWare.userRequired, function (req, res, next) {
  res.render('topic/edit', {
    tabs: config.tabs,
    action: '',
    current_user: req.session.user,
  });
});

//保存话题页面
router.post('/topic/create', function (req, res, next) {
  var title = req.body.title;
  var tab = req.body.tab;
  var content = req.body.t_content;

  var errors;
  if (title.length < 5) {
    errors = '标题字数少于5个字符';
  } else if (content === '') {
    errors = '内容不可为空';
  }
  if (errors) {
    return res.render('topic/edit', {
      action: '',
      title: title,
      content: content,
      errors: errors,
      tabs: config.tabs,
      current_user:req.session.user
    });
  }
  Topic.newAndSave(title, tab, content, req.session.user, function (err, topic) {
    if (err) {
      return next(err);
    }
    console.log('保存成功');
    User.getUserByUserName(req.session.user, function (err, user) { //req.session.user是中间件中的，全局可调用
      if (err) {
        return next(err);
      }
      user.topic_id = topic.id;
      user.score += 5;
      user.topic_count += 1;
      user.save();

      res.redirect('/');
    })
  })
});

//修改话题页面
router.get('/topic/:id/edit', function (req, res, next) {
  var topic_id = req.params.id;
  Topic.findById(topic_id, function (err, topic) {
    if (err) {
      return next(err);
    }
    if (!topic) {
      console.log('此话题不存在或已被删除');
      return;
    }
    res.render('topic/edit', {
      action: 'edit',
      tabs: config.tabs,
      title: topic.title,
      content: topic.content,
      topic_id: topic.id,
      current_user: req.session.user,
      tab: topic.tab,
      topic:topic
    });
  });
});

//更新修改的话题
router.post('/topic/:id/edit', function (req, res, next) {
  var topic_id = req.params.id;
  var title = req.body.title;
  var tab = req.body.tab;
  var content = req.body.t_content;
  console.log('tab是：'+tab);

  Topic.findById(topic_id, function (err, topic) {
    if (err) {
      return next(err);
    }
    if (!topic) {
      console.log('此话题不存在或已被删除');
      return;
    }
    //检查修改后的话题是否符合规范
    var errors;
    if (title.length < 5) {
      errors = '标题字数少于5个字符';
    } else if (content === '') {
      errors = '内容不可为空';
    }
    if (errors) {
      return res.render('topic/edit', {
        action: 'edit',
        title: title,
        content: content,
        errors: errors,
        tabs: config.tabs,
        topic_id: topic_id,
        current_user: req.session.user,
        tab:tab
      });
    }
    //更新话题
    topic.tab = tab;
    topic.title = title;
    topic.content = content;
    topic.updated_at = new Date();
    topic.save(function (err) {
      res.redirect('/' + topic_id + '/tid');
    });
  })
});

//删除话题
router.get('/topic/:id/remove', function (req, res, next) {
  var topic_id = req.params.id;
  Topic.findById(topic_id, function (err, topic) {
    if (err) {
      return next(err);
    }
    if (!topic) {
      console.log('话题不存在或已被删除');
      return;
    }
    User.getUserByUserName(topic.username, function (err, user) {
      if (err) {
        return next(err);
      }
      if (!user) {
        console.log('用户不存在');
        return next(err);
      }
      user.score -= 5;
      user.topic_count -= 1;
      user.save();
    });
    console.log('topic是' + topic);
    topic.deleted = true;
    topic.save(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect('/');
    });
  });
})

router.get('/email', function (req,res,next) { 
  var email = 'eee@qq.com';
  var link = EmailLink.EmailLink(email);
  console.log(link);
  res.send(link);
});
module.exports = router;
