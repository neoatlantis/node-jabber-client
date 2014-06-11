#!/usr/local/bin/node
/*
 * start this file using:
 *      node node-jabber-client.js
 * or using `supervisor`;
 *      supervisor node-jabber-client.js
 */
require('./lib');

var port = process.argv[2] || 10086;

function mimeType(filename){
    var map = {
        '.js': 'application/x-javascript',
        '.css': 'text/css',
        '.html': 'text/html',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.ttf': 'application/x-font-ttf',
    };
    for(var endung in map)
        if(filename.endsWith(endung)) return map[endung];
    return 'text/plain';
};
 
$.node.http.createServer(function(request, response) {
    var pathname = $.node.url.parse(request.url).pathname,
        uri = '.' + pathname,
        filename = $.tools.resolve('web', uri),
        header = function(){return {
            'Date': new Date().toGMTString(),
            'Content-Type': 'text/plain',
        };};

    if('/~' == pathname) return new _process(request, response);

    // static file server
    
    console.log('Accessing:', filename);
    
    $.node.fs.exists(filename, function(exists) {
        if(!exists) {
            response.writeHead(404, header());
            response.write("404 Not Found\n");
            response.end();
            return;
        };
     
        if($.node.fs.statSync(filename).isDirectory())
            filename = $.tools.resolve('web', uri, 'index.html');
     
        $.node.fs.readFile(filename, "binary", function(err, file){
            var gotHeader = header();
            if(err) {
                response.writeHead(500, gotHeader);
                response.write(err + "\n");
                response.end();
                return;
            };
            gotHeader['Content-Type'] = mimeType(filename);
            response.writeHead(200, gotHeader);
            response.write(file, "binary");
            response.end();
        });
    });
}).listen(parseInt(port, 10));

//////////////////////////////////////////////////////////////////////////////

function _process(req, res){
};
