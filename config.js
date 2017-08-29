var config = {
    tabs: [['分享'],['问答'],['招聘']],

    db_host: '127.0.0.1',
    db_port: 27017,
    db_password: '',
    db_db: 'mongodb://127.0.0.1:27017/UserSession',
    
    session_secret:'wenser7',
    auth_cookie_name: 'wenser7',

    admins: { wenser7: true },//管理员帐户
    
}

module.exports = config;