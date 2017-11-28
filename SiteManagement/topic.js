
var User = require('../models/user');
var Topic = require('../models/topic');
var Reply = require('../models/reply');
var Collect = require('../models/collect');
var Car = require('../models/car');
var Reply_comment = require('../models/reply_comment');

var config = require('../config');

//发布话题页面
exports.create = function (req, res, next) {
    res.render('topic/edit', {
        tabs: config.tabs,
        action: '',
        current_user: req.session.user ? req.session.user.username : '',
    });
};

//保存话题
exports.saveTopic = function (req, res, next) {
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
        Topic.newAndSave(title, tab, carBrand, carModel, content, req.session.user.username, user.avatars, function (err, topic) {
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
};

//修改话题
exports.edit = function (req, res, next) {
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
};

//修改话题保存
exports.editSave = function (req, res, next) {
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
};

//删除话题
exports.remove = function (req, res, next) {
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
}

//进入单个话题
exports.oneTopic = function (req, res, next) {

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
};

//进入该话题用户主页
exports.user = function (req, res, next) {
    var user_name = req.params.username;
    console.log('进入用户主页');
    User.getUserByUserName(user_name, function (err, user) {
        if (err) {
            console.log('出错');
            return next(err);
        }
        var query = { 'username': user_name,'deleted':false };
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
                var queryTopic = { '_id': { '$in': reply_topic_id },'deleted':false }
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
};

//收藏该话题
exports.collect = function (req, res, next) {
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
}

//取消收藏该话题
exports.de_collect = function (req, res, next) {
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
};

//加精该话题
exports.good = function (req, res, next) {
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
            res.render('notify/notify', { error: msg, referer: referer });
        });

    })
};


//置顶该话题
exports.top = function (req, res, next) {
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
};

//回复并保存某个评论
exports.reply_oneReply = function (req, res, next) {
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

};

//保存回复
exports.reply = function (req, res, next) {
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

};

//删除回复
exports.removeReply = function (req, res, next) {
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
};

//回复点赞
exports.nice = function (req, res, next) {
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
};

/* 进入话题页 */
exports.index = function (req, res, next) {
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
        query.tab = { $nin: ['申诉', '招聘'] };//db.col.find(tab:{$nin:['招聘','招聘']})
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
                            ChooseModel: false
                        });

                    })
                });
            });
        }
    });
};

//话题查找（模糊查询）
exports.search = function (req, res, next) {
    console.log('进入模糊查找');
    let title = req.body.title;
    console.log('title是：' + title)
    if (title == '') {
        title = '机'
    }
    let query = {};
    query.title = new RegExp(title, 'i');//模糊查询
    query.deleted = false;
    Topic.findByQuery(query, '', function (err, topic) {
        if (err) {
            console.log('查找出错');
            return next(err);
        }
        if (!topic) {
            console.log('没有找到话题');
            return next();
        }
        console.log('模糊查找到的Topic是：' + topic);
        res.send({
            topic: topic,
        })
    })
}