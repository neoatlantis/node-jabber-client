var COMMON = {};

COMMON.hex = {};
COMMON.hex.encode = function(str){
    var charCode = '', ret = '';
    for(var i=0; i<str.length; i++){
        charCode = str.charCodeAt(i).toString(16);
        if(charCode.length < 2)
            ret += '0' + charCode;
        else
            ret += charCode;
    };
    return ret;
};

COMMON.random4 = function() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
};
COMMON.uuid = (function() {
  /* https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript */
  return function() {
    return 
        COMMON.random4() + COMMON.random4() 
        + '-'
        + COMMON.random4()
        + '-'
        + COMMON.random4()
        + '-'
        + COMMON.random4() 
        + '-'
        + COMMON.random4() + COMMON.random4() + COMMON.random4()
  };
})();
COMMON.pageIdentifier = 
    COMMON.random4()
    + COMMON.random4()
    + COMMON.random4()
    + COMMON.random4()
;

/* querystring parsing, using NodeJS's version of implementation */
COMMON.parseQuerystring = function(qs){
    var sep = '&', eq = '=';
    var obj = {};

    var regexp = /\+/g;
    qs = qs.trim().split(sep);

    var len = qs.length;
    var decode = decodeURIComponent;

    for (var i = 0; i < len; ++i) {
        var x = qs[i].replace(regexp, '%20'),
            idx = x.indexOf(eq),
            kstr, vstr, k, v;

        if (idx >= 0) {
            kstr = x.substr(0, idx);
            vstr = x.substr(idx + 1);
        } else {
            kstr = x;
            vstr = '';
        };

        try {
            k = decode(kstr);
            v = decode(vstr);
        } catch (e) {
            k = QueryString.unescape(kstr, true);
            v = QueryString.unescape(vstr, true);
        }

        if(!Object.prototype.hasOwnProperty.call(obj, k)){
            obj[k] = v;
        } else if($.isArray(obj[k])){
            obj[k].push(v);
        } else {
            obj[k] = [obj[k], v];
        };
    };
    return obj;
};
