var bcrypt = require('bcryptjs');
var moment = require('moment');
var http = require('http');

moment.locale('zh-cn'); // 使用中文

// 格式化时间
exports.formatDate = function (date, friendly) {
  date = moment(date);

  if (friendly) {
    return date.fromNow();
  } else {
    return date.format('YYYY-MM-DD HH:mm');
  }
};

// 获取当天的开始时刻的时间截（当地时间）
exports.GetStartOfTheDay = function (date) {
  var theDate = new Date();
  theDate.setTime(date*1000);

  theDate.setHours(0); theDate.setMinutes(0); theDate.setSeconds(0); theDate.setMilliseconds(0);

  return Math.floor(theDate.getTime()/1000);
};

// 获取当天的开始时刻的时间截（当地时间）
exports.GetStartOfNextDay = function (date, days) {
  if(!days || days <= 0){
    days = 1;
  }

  var theDate = new Date();
  theDate.setTime(date*1000);

  theDate.setHours(0); theDate.setMinutes(0); theDate.setSeconds(0); theDate.setMilliseconds(0);

  var theStartTimeStamp = Math.floor(theDate.getTime()/1000);

  var theResTimeStamp;
  theResTimeStamp = parseInt(theStartTimeStamp) + parseInt(days*24*3600);

  return theResTimeStamp;
};

// 获取当月的开始时刻的时间截（当地时间）
exports.GetStartOfTheMonth = function (date, addMonth) {
  if(!addMonth){
    addMonth = 0;
  }

  var theDate = new Date();
  theDate.setTime(date*1000);

  theDate.setHours(0); theDate.setMinutes(0); theDate.setSeconds(0); theDate.setMilliseconds(0);
  theDate.setDate(1);

  var theMonth = parseInt(theDate.getMonth()) + addMonth;
  var theYear = theDate.getFullYear();
  if(theMonth >= 12){
    for(; theMonth >= 12;){theMonth -= 12;theYear++;}
  } else if(theMonth < 0){
    for(; theMonth < 0;){theMonth += 12;theYear--;}
  }

  theDate.setMonth(theMonth);
  theDate.setFullYear(theYear);

  return Math.floor(theDate.getTime()/1000);
};

exports.validateId = function (str) {
  return (/^[a-zA-Z0-9\-_]+$/i).test(str);
};

exports.bhash = function (str, callback) {
  bcrypt.hash(str, 10, callback);
};

exports.bcompare = function (str, hash, callback) {
  bcrypt.compare(str, hash, callback);
};

exports.IPToolsAton = function aton(ip){
  // convert ip address to number
  var a = ip.split('.');
  var buf = new Buffer(4);
  for(var i = 0; i < 4; i++){
    buf.writeUInt8(a[i], i);
  }
  return buf.readUInt32BE(0);
};

exports.IPToolsNtoa = function ntoa(num){
  // convert number to ip address;
  var buf = new Buffer(4);
  buf.writeUInt32BE(num, 0);

  var a = [];
  for(var i = 0; i < 4; i++){
    a[i] = buf.readUInt8(i);
  }

  return a.join('.');
};

exports.getRealIP = function (req) {
  var xForward = req.headers['x-forwarded-for'];
  if (!xForward) {
    return 'header_error';
  }
  xForward = xForward.replace(" ", "");
  xForward = xForward.split(',');
  var clientIP = xForward[xForward.length -1 ];
  return clientIP;
};

exports.checkAddress = function(address, level) {
  var dist = require('./../public/libs/AAPcdPicker/data/distric');
  var addr = address.split('-');

  if (['province', 'city', 'dist'].indexOf(level) === -1 ) {
    return 'err_level';
  }

  var addrProvince = addr[0];
  var addrCity = addr[1];
  var addrDist = addr[2];

  if (level === 'province' && !addrProvince) {
    return 'err_address';
  } else if (level === 'city' && !addrCity) {
    return 'err_address';
  } else if (level === 'dist' && !addrDist) {
    return 'err_address';
  }

  var found = 'not_found';
  var foundProvince = false;
  var foundCity = false;
  var foundDist = false;

  var i;
  var j;
  var k;

  for (i = 0; i < dist.length; i++) {
    if (dist[i].name === addrProvince) {
      foundProvince = true;
      if (level === 'province'){
        break;
      }
      for (j = 0; j < dist[i].city.length; j++) {
        if (dist[i].city[j].name === addrCity) {
          foundCity = true;
          if (level === 'city') {
            break;
          }
          for (k = 0; k < dist[i].city[j].area.length; k++) {
            if (dist[i].city[j].area[k] === addrDist) {
              foundDist = true;
              if (level === 'dist') {
                break;
              }
            }
          }
        }
      }
    }
  }
  if (level === 'province' && foundProvince) {
    found = 'found';
  } else if (level === 'city' && foundCity) {
    found = 'found';
  } else if (level === 'dist' && foundDist) {
    found = 'found';
  }
  return found;
};

exports.hideSomeInfo = function (str) {
  var result = "";
  var firstPart = Math.round(str.length / 3);
  if (firstPart === 0) {
    firstPart = 1;
  }
  var lastPart = Math.round(str.length * 2 / 3);
  if (lastPart === 1) {
    lastPart = 2;
  }
  var midLength = str.length - firstPart - (str.length - lastPart);
  if (midLength < 1) {
    midLength = 1;
  } else if (midLength > 4) {
    midLength = 4;
  }

  result = str.substr(0, firstPart) + "*".repeat(midLength) + str.substr(lastPart, str.length);
  return result;
};


exports.checkPhone = function (mobile) {
  var myreg = /^(((13[0-9]{1})|(15[0-9]{1})|(17[0-9]{1})|(18[0-9]{1}))+\d{8})$/;
  if (myreg.test(mobile)) {
    return true;
  } else {
    return false;
  }
};


exports.request = function(hostName, port, path, method, data, headers, callback) {
  var dataType = typeof data;

  var rawData = null;
  if (dataType == 'function') {
    headers = callback;
    callback   = data;
    rawData = null;
  } else if (dataType == 'object') {
    rawData = JSON.stringify(data);
  } else {
    rawData = data;
  }

  console.log("data = " + rawData);

  var options = {
    hostname : hostName,
    port   : port,
    path   : path,
    method  : method,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8'
    }
  };

  headers && (options.headers = headers);

  var req = http.request(options, function(res) {
    var receives = [];

    if (res.statusCode !== 200) {
      callback && callback(null);
      return
    }

    res.on('data', function(chunk) {
      receives.push(chunk)
    });

    res.on('end', function() {
      var resData = Buffer.concat(receives).toString();
      try {
        resData = JSON.parse(resData)
      } catch (e) { }

      callback && callback(resData);
    })
  });

  req.on('error', function(e) {
    callback && callback(null);
  });

  rawData && req.write(rawData);

  req.end();
};
