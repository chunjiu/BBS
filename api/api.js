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
        console.log('car是：' + car)
    })
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