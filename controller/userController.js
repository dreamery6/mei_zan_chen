var userModel = require('../models/user.js');

exports.saveUserInfo = function (req, res){
    let name = req.body.name;
    let phone = req.body.phone;
    let province = req.body.province;
    let district = req.body.district;
    let city = req.body.city;
    let address = req.body.address;
    let data = {};
    data.code = 10000;
    data.msg = "成功"; 

    if (!name || name.length <= 0 || !city || city.length <= 0  || !district || district.length <= 0  || !province || province.length <= 0) {
        return res.send({code: 10001, msg: '不能为空'});
    }

    var myreg = /^(((13[0-9]{1})|(15[0-9]{1})|(17[0-9]{1})|(18[0-9]{1})|(19[0-9]{1})|(16[0-9]{1}))+\d{8})$/;
    if (!myreg.test(phone)) {
        return res.send({code: 10003, msg: "手机号错误"});
    }

    let userData ={
        name : name,
        phone : phone,
        province : province,
        district : district,
        city : city,
        address : address
    };

    userModel.Add(userData, function(newID){
        if(newID <= 0){
            data.code = 10002;
            data.msg = "保存出错";
        }
        res.send(data);
    });
}