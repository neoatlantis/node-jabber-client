var dirPath = $.tools.resolve('config');
var dirRes = $.node.fs.readdirSync(dirPath);

var filename, content, lines, beginRead, data, dataParsed;
var result = {};
for(var i in dirRes){
    filename = dirRes[i];
    if('README.md' == filename) continue;
    try{
        content = $.node.fs.readFileSync($.tools.resolve('config', filename));
        lines = content.toString('utf-8').trim().split('\n');
        data = '', beginRead = false;
        for(var j in lines){
            if(!beginRead && '#' == lines[j].slice(0, 1)) continue;
            beginRead = true;
            data += '\n' + lines[j];
        };
    } catch(e){
        continue;
    };

    try{
        dataParsed = JSON.parse(data);
    } catch(e){
        dataParsed = data;
    };
    result[dirRes[i]] = dataParsed;
};

module.exports = new (function(conf){
    return function(i){
        if(conf[i]) return conf[i]; // XXX may need to clone this object for security
        return null;
    };
})(result);
