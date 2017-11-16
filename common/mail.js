var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'qq',
    auth: {
        user: '1253305432@qq.com',
        pass: 'fvtkusbzumdvhghg'//开通邮箱的smtp服务时的授权码
    }
});
exports.sendActiveMail = function (who,token,username) {

    mailOptions = {
        from:'1253305432@qq.com',
        to:who,//可以填写多个以逗号隔开
        subject: 'nodeclub注册激活邮件',
        html: '<p>您好</p>' +
        '<p>我们收到您在福运临的注册信息,请点击下面的链接来激活账户</p>' +
         '<a href  =" '+'http://www.wangdong123.com' + '/active_account?key=' + token + '&username=' + username+'">激活链接</a>'//要注意用双引号包裹里面的容，因为要使用变量
    }
    transporter.sendMail(mailOptions, function (err, info) { 
        if (err) { 
            console.log('错误'+err);
            return;
        }
        console.log('发送成功');
    });
} 