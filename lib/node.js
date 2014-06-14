module.exports = new (function(){
    var desired = {
        'http': 'http',
//        'https',
        'util': 'util',
        'os': 'os',
        'path': 'path',
        'fs': 'fs',
        'url': 'url',
        'crypto': 'crypto',
        'zlib': 'zlib',
        'buffer': 'buffer',
        'events': 'events',
        'querystring': 'querystring',
        'child_process': 'childProcess',
        'stream': 'stream',
        'readline': 'readline',

        /* dependencies */
        'async': 'async',
        'node-xmpp-bosh': 'bosh',
        'node-salsa20': 'salsa20',
    };

    for(var i in desired){
        this[desired[i]] = require(i);
    };

    return this;
})();
