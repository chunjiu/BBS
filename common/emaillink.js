exports.EmailLink = function (email) {
    var str = email;
    var patt1 = /@/g;
    var mail = (str.split(patt1)[1]);//分割注册的邮箱并取@后面的字符串

    var arr = new Array(2);
    arr[0] = 'mail.';//邮箱前缀,注意有个点
    arr[1] = mail;
 
    var link = arr.join('');
    var patt2 = /[,]/;
    link.replace(patt2,'');//把字符串中的,号去掉
    return link;
}


