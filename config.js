var config = {
    tabs: [['分享'],['问答'],['申诉']],

    db_host: '127.0.0.1',
    db_port: 6379,
    db_password: '',
    db_db: 0,
    
    session_secret:'wenser7',
    auth_cookie_name: 'wenser7',

    admins: { wenser7: true },//管理员帐户

    mongodb:'mongodb://127.0.0.1:27017/NEW2'
    
}

module.exports = config;