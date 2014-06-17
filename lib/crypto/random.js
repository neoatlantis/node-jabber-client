/*
 * a blocking random bytes generator
 */

module.exports = new (function(){
    var self = this;
    
    this.bytes = function(count){
        return randomBytes(count);
    };

    return this;
})();

//////////////////////////// RANDOM BYTES GENERATOR //////////////////////////

var static0 = new $.node.buffer.Buffer(JSON.stringify(process.env), 'binary');

function randomBytes(length){
    var pool = [];
    
    /* Collect Random Seeds */
    
    // from NodeJS library `crypto`.
    pool.push($.node.crypto.randomBytes(length));

    // from `process.hrtime`.
    var hrtimeCollected = [];
    for(var i=0; i<=length * 8; i++) 
        hrtimeCollected.push(process.hrtime());
    pool.push(new $.node.buffer.Buffer(hrtimeCollected.join('')));

    // from date and time
    pool.push(new $.node.buffer.Buffer(new Date()));

    // from `process.env` environment variables
    pool.push(static0);


    /* Get a password somehow */
    var passwordBuffer = $.node.crypto.randomBytes(64);
    
    return $.crypto.hash.PBKDF2(
        passwordBuffer,
        new $.node.buffer.Buffer.concat(pool),
        16, // should be randomly enough. We aren't deriving encrypting key.
        length
    );
};
