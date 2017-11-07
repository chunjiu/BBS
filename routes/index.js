var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');

var crypto = require('crypto');
var utility = require('utility');

var mail = require('../common/mail');//发送邮件模块
var EmailLink = require('../common/emaillink');//生成登录邮箱链接
var multer = require('../common/multerUtil');//文件上传模块

var User = require('../models/user');
var Topic = require('../models/topic');
var Reply = require('../models/reply');
var Collect = require('../models/collect');
var Reply_comment = require('../models/reply_comment');
var Car = require('../models/car');
var MaintenaceCase = require('../models/maintenanceCase');

var config = require('../config');
var authMiddleWare = require('../middlewares/auth');

var EventProxy = require('eventproxy');//异步控制




//接口
router.get('/api', function (req, res, next) {
  //res.status(403).end();

  var page = parseInt(req.query.page, 10) || 1;
  var tab = req.query.tab || '全部';
  var limit = parseInt(req.query.limit, 10) || 1;

  var query = {};
  if (!tab || tab == '全部') {
    query.tab = { $nin: ['招聘']['申诉'] };//db.col.find(tab:{$nin:['招聘']})
  } else if (tab == '精华') {
    query.good = true;
  } else {
    query.tab = tab;
  }

  var limit = limit;
  var options = { skip: (page - 1) * limit, limit: limit, sort: '-top -last_reply_at' };

  Topic.findByQuery(query, options, function (err, topics) {
    if (err) {
      console.log('err是：' + err);
    } else {
      console.log('req.cookies是：' + req.signedCookies[config.auth_cookie_name]);
      console.log('req.session.uer是：' + req.session.user);
      var ReqUser = req.session.user ? req.session.user.username : '';
      User.getUserByUserName(ReqUser, function (err, user) {
        if (err) {
          return next(err);
        }
        Topic.findByQuery(query, function (err, topics_count) {
          var pages = Math.ceil((topics_count.length) / limit);

          var data = {
            topic: topics,
            user: user,
            current_user: req.session.user,
            tabs: config.tabs,
            current_page: page,
            tab: tab,
            pages: pages,
          };
          res.json(data);
          // res.download('/nodeMy博客/sheng.txt','sheng.txt');用于下载页面
        });
      });
    }
  });
});
//接口结束

/*汽车年份查找测试*/
router.post('/chekYear', function (req, res, next) { 
  console.log('进入查询');

  let year = req.body.year;
  let model = req.body.model;
  console.log(year);
  console.log(model);
  Car.getCarByYear(year, model, function (err, car) {
    if (err) { 
      console.log('出错');
      return next();
    }
    if (!car) { 
      console.log('没有找到车');
    }
    console.log('car是：'+car)
   })
}) 

router.post('/set/admin', function (req, res, next) { 
  let title = req.body.title;
  let admin = req.body.admin;
  let yn = req.body.yn;


});


/*get information page*/

router.get('/information', function (req, res, next) {
  var carBrand = req.query.carBrand ||'奥迪';
  var carModel = req.query.carModel||'奥迪A6';

  console.log('carBrand是：' + carBrand);
  var query = {};
  if (carBrand) { 
    query.carBrand = carBrand;
  }
  Car.getCarByQuery('', '', function (err, car) { 
    if (err) { 
      console.log('出错');
      return next(err);
    }
    Car.getCarByQuery(query,'' ,function (err, car_Brand) { 
      if (err) {
        console.log('出错');
        return next(err);
      }
      if (!car) {
        console.log('没有找到车');
        return next(err);
      }
      console.log('car是:' + car);
      

      res.render('Document', {
        current_user: req.session.user ? req.session.user : '',
        car: car,
        car_Brand:car_Brand,
        carModelURL:carModel,
        ChooseModel: true,
      })
    })

  })
  
})

/*get MaintenaceCase page*/
router.get('/MaintenanceCase', function (req, res, next) { 
  var ReqUser = req.session.user ? req.session.user.username : '';
  var tab = req.query.tab;
  var carModel = req.query.carModel;

  Car.getCarByQuery('', function (err, car) { 
    if (err) {
      console.log('出错');
      return next(err);
    } 
    let query = {};

    query.tab = tab || '';
    if (query.tab == '') { 
      query.tab = { $in: [['机电维修案例'],['电子维修案例']] };
    }
    if (carModel) { 
      query.carModel = carModel;
    }
    query.delete = false;
  
    MaintenaceCase.getCaseTopicByQuery(query, '', function (err, caseTopic) { 
      if (err) { 
        console.log('出错');
        return next(err);
      }
      if (!caseTopic) { 
        console.log('没有找到维修案例');
        return;
      }
      console.log('caseTopic是：'+caseTopic);
      res.render('MaintenanceCase', {
        current_user: req.session.user ? req.session.user: '',
        car: car,
        caseTopic:caseTopic,
        ChooseModel: true,
        carModelURL:carModel
      })
    })
  })
})


//get home page

router.get('/', function (req, res, next) {
  console.log('进入主页');
  var ReqUser = req.session.user ? req.session.user.username : '';
  console.log('reqUser是：' + ReqUser);
  res.render('index', {
    current_user: req.session.user,
  });
});

/*get backStage page*/
router.get('/backStage', function (req, res, next) { 
  var ReqUser = req.session.user ? req.session.user.username : '';
  res.render('siteBg/backStage', {
    current_user:ReqUser,
  });
})

/* GET case page. */
router.get('/case', function (req, res, next) {
  //res.status(403).end();
  console.log('进入首页');

  var page = parseInt(req.query.page, 10) || 1;
  var tab = req.query.tab || '全部';
  var carModel = req.query.carModel;
  console.log('carModel是：' + carModel);

  var query = {};
  
  if (carModel) { 
    query.carModel = carModel;
  }
  
  if (!tab || tab == '全部') {
    query.tab = { $nin: ['申诉','招聘'] };//db.col.find(tab:{$nin:['招聘','招聘']})
  } else if (tab == '精华') {
    query.good = true;
  } else {
    query.tab = tab;
  }

  query.deleted = false;

   // query.carModel = carModel;
  console.log('query是：' + query.tab)

  var limit = 20;
  var options = { skip: (page - 1) * limit, limit: limit, sort: '-top -last_reply_at' };

  Topic.findByQuery(query, options, function (err, topics) {
    console.log('运行到这里');
    if (err) {
      console.log('err是：' + err);
    }
    else {
      console.log('req.cookies是：' + req.signedCookies[config.auth_cookie_name]);
      console.log('req.session.uer是：' + req.session.user);
      var ReqUser = req.session.user ? req.session.user.username : '';
      console.log('ReqUser是：' + ReqUser);
      User.getUserByUserName(ReqUser, function (err, user) {
        if (err) {
          return next(err);
        }
        Topic.findByQuery(query, function (err, topics_count) {
          if (err) {
          }
          Car.getCarByQuery({}, function (err, car) {
            if (err) {
              return next(err)
            }
            if (!car) {
              console.log('没有找到车');
            }
            //console.log('car是：' + car.length)

            var pages = Math.ceil((topics_count.length) / limit);
            console.log('运行到这里2');

            res.render('case/index', {
              topic: topics,
              user: user,
              current_user: req.session.user,
              tabs: config.tabs,
              current_page: page,
              tab: tab,
              pages: pages,
              car: car,
              carModelURL: carModel,
              ChooseModel:false
            });

          })
        });
      });
    }
  });
});

//进入单个话题
router.get('/:id/tid', function (req, res, next) {
  var ep = new EventProxy();
  var topic_id = req.params.id;
  var current_user = req.session.user ? req.session.user : '';
  console.log("curretn_user是：" + current_user.is_admin);
  Topic.findById(req.params.id, function (err, topics) {
    topics.visit_count += 1;//浏览量
    Reply.getRepliesByQuery({ 'topic_id': req.params.id, 'deleted': false }, {}, function (err, replies) {
      if (err) {
        return next(err);
      }
      if (!replies) {
        console.log('没有找到replies');
      }
      console.log('replies有：' + replies.length);
      User.getUserByUserName(topics.username, function (err, user) {
        if (err) {
          console.log('出错');
          return next(err);
        }
        if (!user) {
          console.log('没有user');
        }
        console.log('user是：' + user);
        Topic.findByQuery({ 'username': topics.username, 'deleted': false }, { limit: 5 }, function (err, OtherTopics) {//注意：topic.id只有唯一的一个。多个topic里存储了同一个用户名,故用user.getUserByUserName（topic.username）来查找
          if (err) {
            return next(err);
          }
          Topic.findNoReply_topic({ 'username': topics.username, 'reply_count': 0, 'deleted': false }, { limit: 5 }, function (err, noreplytopic) {
            if (err) {
              console.log('无人回复的话题查找错误');
              return next(err);
            }
            Collect.getCollectByTopicId(topic_id, function (err, collect) {
              if (err) {
                return next(err);
              }
              topics.save();
              console.log('current是' + req.session.user);
              console.log('replies是' + replies.id);
              Reply_comment.getReplyCommentByTopicID(topic_id, function (err, reply_comment) {
                if (err) {
                  return next(err);
                }
                var reply_comment_user = reply_comment.map(function (replyComment) {
                  console.log('replyComent是：' + replyComment);
                  return replyComment.username;
                })
                console.log('reply_comment_user是：' + reply_comment_user);
                var queryUser = { 'username': { '$in': reply_comment_user } }

                User.getUserByQuery(queryUser, {}, function (err, reply_user) {
                  if (err) {
                    console.log('出错');
                    return next(err);
                  }
                  if (!reply_user) {
                    console.log('没有reply_user');
                  }
                  console.log('reply_comment是：' + reply_comment);
                  res.render('topic/index', {
                    topic: topics,
                    reply: replies,
                    user: user,
                    current_user: current_user,
                    othertopics: OtherTopics,
                    noreplytopic: noreplytopic,
                    is_collect: collect,
                    reply_comment: reply_comment,
                    replyUser: reply_user,//这个不用，以后看看一查多吧
                    //errors:errors
                  });
                  //console.log('查看话题的作者是：' + OtherTopics);  
                  console.log('...............................');
                  console.log('reply_user是：' + reply_user);
                  console.log('................................');
                })
              })
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
      var referer = req.get('referer');
 
      var msg = topic.good ? '该话题加精华成功' : '该话题精华已被取消';
      res.render('notify/notify', { error: msg,referer:referer});
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
      res.render('notify/notify', { error: msg });
    });
  })
});

//进入该话题用户主页
router.get('/user/:username', function (req, res, next) {
  var user_name = req.params.username;
  console.log('进入用户主页');
  User.getUserByUserName(user_name, function (err, user) {
    if (err) {
      console.log('出错');
      return next(err);
    }
    var query = { 'username': user_name };
    var opt = { sort: '-create_at', limit: 5 }
    Topic.findByQuery(query, opt, function (err, topic) {
      if (err) {
        return next(err);
      }
      Reply.getRepliesByUsername(user_name, function (err, reply) {
        if (err) {
          return next(err);
        }
        //查找多个id时,需先将每个id转化为字符串
        var reply_topic_id = reply.map(function (reply) {
          return reply.topic_id
        })
        console.log('reply_topic_id是：' + reply_topic_id);
        var queryTopic = { '_id': { '$in': reply_topic_id } }
        var optTopic = { sort: '-last_reply_at', limit: 5 }
        Topic.findByQuery(queryTopic, optTopic, function (err, replyTopic) {
          if (err) {
            return next(err);
          }
          res.render('user/index', {
            current_user: req.session.user ? req.session.user.username : '',
            user: user,
            topic: topic,
            replyTopic: replyTopic,
          });
        })
      })
    })
  })
});

//保存回复
router.post('/:id/reply', function (req, res, next) {
  console.log('进入reply');
  var content = req.body.r_content;
  var topic_id = req.params.id;
  console.log('content是' + content);

  if (content === '') { //这里其实用ajax更好，整个回复都用ajax
    return res.render('notify/notify', {
      error: '回复内容不能为空'
    });
  }
  Topic.findById(topic_id, function (err, topic) {
    if (err) {
      return next(err);
    }
    User.getUserByUserName(req.session.user.username, function (err, user) {
      if (err) {
        return next(err);
      }
      topic.last_reply_at = new Date();
      topic.last_reply_user_avatars = user.avatars;
      topic.reply_count += 1;//话题回复数+1
      topic.save();
      Reply.newAndSave(content, topic_id, req.session.user.username, user.avatars, function (err, reply) {//这里记住要返回reply,方便调用reply.id进行网页自动定位
        if (err) {
          return next(err);
        }
        console.log('保存成功');

        //Topic.updateLastReply(topic_id);
        console.log('avtars是：' + reply.reply_avatars);
        res.redirect('/' + topic_id + '/tid/' + '#' + reply.id);//#是网页刷新后定位到#后面新保存reply.id的地址
      });

    })
  });

});

//回复并保存某个评论
router.post('/:id/:reply_id/comment', function (req, res, next) {
  console.log('进入reply/comment');
  var content = req.body.r_content;
  var topic_id = req.params.id;
  var reply_id = req.params.reply_id;
  var replyuser = req.session.user ? req.session.user.username : '';
  console.log('replyuser是：' + replyuser);
  console.log('content是' + content);

  if (content === '') { //这里其实用ajax更好，整个回复都用ajax
    return res.render('notify/notify', {
      error: '回复内容不能为空'
    });
  }
  Topic.findById(topic_id, function (err, topic) {
    if (err) {
      return next(err);
    }
    User.getUserByUserName(req.session.user.username, function (err, user) {
      if (err) {
        return next(err);
      }
      topic.last_reply_at = new Date();
      topic.last_reply_user_avatars = user.avatars;
      topic.reply_count += 1;//话题回复数+1
      topic.save();
      Reply_comment.newAndSave(content, reply_id, replyuser, user.avatars, topic_id, function (err, reply_comment) {//这里记住要返回reply,方便调用reply.id进行网页自动定位
        if (err) {
          return next(err);
        }
        Reply.getRepliesByid(reply_id, function (err, reply) {
          if (err) {
            return next(err);
          }
          reply.reply_comment_count += 1;
          reply.save();
          console.log('回复的评论的ID是：' + reply_comment.reply_id);
          console.log('保存的回复用户是：' + reply_comment.username);
          console.log('保存成功');
          //Topic.updateLastReply(topic_id);
          res.redirect('/' + topic_id + '/tid/' + '#' + reply.id);//#是网页刷新后定位到#后面新保存reply.id的地址
        })
      });
    })
  });

});

//删除回复
router.post('/reply/:reply_id/delete', function (req, res, next) {
  var reply_id = req.params.reply_id;
  console.log('删除回复里的reply_id' + reply_id);
  var delete_count = req.body.delete_count;
  console.log('delete_count是：' + delete_count);
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
      if (delete_count > 0) {
        topic.reply_count -= delete_count;
      } else {
        topic.reply_count -= 1;
      }
      topic.save(function () {
        res.json({ status: 'success' })
      });
    });
  });
});

//回复点赞
router.post('/reply/nice', function (req, res, next) {
  console.log('进入nice');
  var reply_id = req.body.reply_id;
  var user = req.session.user.username;
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
  res.render('sign/signup', { title: '注册', current_user: req.session.user ? req.session.user.username : '' });
})
router.get('/test', function (req, res) {
  res.render('sign/test', {});
})

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
router.post('/upload', function (req, res, next) {
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
});

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
    if (docs.length > 1) {
      req.flash('error', '用户名或邮箱已存在')
      console.log('docs是' + docs);
      res.redirect('/signup');//注意，这里不要用'/sign/signup',redirect与get\post差不多
      //return;
    } else {
      console.log('邮箱是：' + email);
      var link = EmailLink.EmailLink(email);
      console.log(link);
      User.addsave(username, password, email, false, function (err, user) {
        if (!err) {
          user.save(function (err) {
            res.render('notify/notify', { success: '注册成功', link: link });
          });
          // req.flash('info', '注册成功，只差邮箱验证了');
          console.log('邮箱是：' + email);
          //mail.sendActiveMail(email, utility.md5(email + 'abcde邮箱验证'), username)//注册成功则发送邮件

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
})

//登录界面
router.get('/signin', function (req, res) {
  res.render('sign/signin', { current_user: req.session.user ? req.session.user.username : '', });
})
//登录
router.post('/login', function (req, res, next) {
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
      return res.render('sign/signin', { errors: '此账号还没有被激活激活链接已发送到' + user.email + '邮箱,请查收' });
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

})

//账号设置
router.get('/setting', function (req, res) {
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
});

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
    current_user: req.session.user ? req.session.user.username : '',
  });
});

//保存话题
router.post('/topic/create', function (req, res, next) {
  console.log('进入保存页页');
  var title = req.body.title;
  var tab = req.body.tab;
  var carBrand = req.body.carBrand;
  var carModel = req.body.carModel;
  var content = req.body.r_content;

  if (tab == '申诉') {
    carBrand = '申诉';
    carModel = '申诉';
  }
  if (tab == '招聘') { 
    carBrand = '招聘';
    carModel = '招聘';
  }

  var errors;
  if (title.length < 5 || title.length > 15) {
    errors = '标题需在5到15字符之间';
  } else if (content === '') {
    errors = '内容不可为空';
  } else if (carBrand === '') {
    errors = '汽车品牌不能为空';
  } else if (carModel === '') {
    errors = '汽车型号不能为空'
  }
  if (errors) {
    return res.render('topic/edit', {
      action: '',
      title: title,
      carBrand: carBrand,
      carModel: carModel,
      content: content,
      errors: errors,
      tabs: config.tabs,
      current_user: req.session.user ? req.session.user.username : '',
    });
  }
  User.getUserByUserName(req.session.user.username, function (err, user) { //req.session.user是中间件中的，全局可调用
    if (err) {
      return next(err);
    }
    Topic.newAndSave(title, tab,carBrand,carModel, content, req.session.user.username, user.avatars, function (err, topic) {
      if (err) {
        return next(err);
      }
      user.topic_id = topic.id;
      user.score += 5;
      user.topic_count += 1;
      user.save();
      console.log('保存成功');
      res.redirect('/case');
    });
  });
});


//修改话题
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
      carBrand: topic.carBrand,
      carModel: topic.carModel,
      content: topic.content,
      topic_id: topic.id,
      current_user: req.session.user ? req.session.user.username : '',
      tab: topic.tab,
      topic: topic
    });
  });
});

//更新修改的话题
router.post('/topic/:id/edit', function (req, res, next) {
  var topic_id = req.params.id;
  var title = req.body.title;
  var tab = req.body.tab;
  var carBrand = req.body.carBrand;
  var carModel = req.body.carModel;
  var content = req.body.r_content;
  console.log('tab是：' + tab);

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
        carBrand: carBrand,
        carModel: carModel,
        content: content,
        errors: errors,
        tabs: config.tabs,
        topic_id: topic_id,
        current_user: req.session.user ? req.session.user.username : '',
        tab: tab
      });
    }
    //更新话题
    topic.tab = tab;
    topic.title = title;
    topic.carBrand = carBrand;
    topic.carModel = carModel;
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
      res.redirect('/case');
    });
  });
})



router.get('/affix', function (req, res, next) {
  res.render('Affix', {});
})
router.get('/email', function (req, res, next) {
  var email = 'eee@qq.com';
  var link = EmailLink.EmailLink(email);
  console.log(link);
  res.send(link);
});

router.get('/download', function (req, res, next) {
  console.log('进入');
  console.log(__dirname);
  console.log(__filename);
  console.log(process.cwd());
  console.log(path.resolve('./'));
  res.download('E:/BBS/招聘简章.docx', '下载的文件', function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log('下载成功');
    }
  });
});
module.exports = router;
