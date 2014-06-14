#!/usr/local/bin/node
/*
 * start this file using:
 *      node node-jabber-client.js
 * or using `supervisor`;
 *      supervisor node-jabber-client.js
 */
require('./lib');

var port = process.argv[2] || 7777,
    boshPort = 5280,
    xmppBoshServer = $.node.bosh.start_bosh({
        port: boshPort,
    });

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

    if('/bosh' == pathname) 
        return new _proxy(
            request,
            response, 
            {
                host: '0.0.0.0',
                port: boshPort,
                path: '/http-bind/',
                method: 'POST'
            }
        );
    if('/xmpp' == pathname) return new _processXMPP(request, response);

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

        // special:
        //  when ends with `.javascript`, will execute at server
        if(filename.endsWith('.javascript'))
            return $.jsas(request, response)(require(filename));
        
     
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

function _proxy(req, res, options){
    req.on('data', function(chunk) {
        var proxy_req = $.node.http.request(options, function(proxy_res) {
            proxy_res.on('data', function(proxy_data) {
                //console.log('xmpp response: ' + proxy_data.toString());
                res.end(proxy_data.toString());
            });
        });

        //console.log('xmpp request: ' + chunk.toString());
        proxy_req.end(chunk.toString());
    });
};

//////////////////////////////////////////////////////////////////////////////

function _processXMPP(req, res){
    var self = this;

    var get = $.node.querystring.parse($.node.url.parse(req.url).query);
    
    try{
        var jid = new $.node.xmpp.JID(get.jid),
            bareJID = jid.bare().toString();
    } catch(e){
        res.writeHead(400);
        res.end('invalid jid: ' + get.jid);
        return;
    };

    var action = get.action || 'show';
    if([
        'show',
        'login', 
    ].indexOf(action) < 0){ 
        res.writeHead(400);
        res.end('invalid action: ' + action);
    };

    var output = {
        jid: bareJID,
    };

    switch(action){
        case 'show':
        default:
            
            break;
    };

    res.writeHead(200);
    res.end(JSON.stringify(output));
    return this;
};
