/*
 * JSAS: JavaScript At Server
 * ==========================
 *
 * To build a simple javascript framework for generating HTML outputs at the
 * server(NodeJS) using javascript. This module encapsules important toolkits
 * for the processor.
 */

module.exports = function(request, response){
    return function(doer){
        new jsasPacket(request, response, doer);
    };
};

function jsasPacket(request, response, doer){
    var self = this;

    var outputStr = '', outputCode = 400;

    var urlParsed = $.node.url.parse(request.url),
        postChunk = '';

    function _arrayGetter(ary){
        return function(key){
            if(ary[key]) return ary[key];
            return null;
        };
    };

    this.i = {
        get: _arrayGetter($.node.querystring.parse(urlParsed.query)),
        post: _arrayGetter($.node.querystring.parse(postChunk)),
    };
    this.o = {};

    request.on('data', function(c){ postChunk += c; });
    request.on('end', function(c){ if(c) postChunk += c; doer(self); });

    //////////////////////////////////////////////////////////////////////

    this.o.echo = function(text){
        outputStr += text;
    };

    this.o.die = function(text){
        self.o.echo(text);
        self.end();
    };

    this.end = function(){
        delete self.i;
        delete self.o;

        response.end(outputStr);
    };

    return this;
};
