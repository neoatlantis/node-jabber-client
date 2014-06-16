module.exports = function(jid){
    return new XMPPClient(jid);
};

function XMPPClient(jid){
    $.node.events.EventEmitter.call(this);
    var self = this;

    var jid = new $.node.xmpp.JID(jid).bare().toString();
    var _autoReconnect = false,
        _password = false,
        _initPresence = true,
        _client = null;

    var queue = {send: [], recv: []};

    function _status(v){
        /* see <https://github.com/astro/node-xmpp/blob/master/lib/xmpp/client.js> */
        var res = 'PREAUTH';
        if(_client)
            res = {
                0: 'PREAUTH',
                1: 'AUTH',
                2: 'AUTHED',
                3: 'BIND',
                4: 'SESSION',
                5: 'ONLINE',
            }[_client.state];

        if(v == undefined)
            return res;
        else
            return res == v || _client.state == v;
    };

    this.report = function(){
        return {
            'jid': jid,
            'client': {
                'status': _status(),
                'password': Boolean(_password),
            },
            'queue': {
                'send': queue.send.length,
                'receive': queue.recv.length,
            },
            'roster': self.roster(),
        };
    };

    this.loggedIn = function(){
        if(_client) return _client.state >= 2;
        return false;
    };

    this.logout = function(){
        if(!self.loggedIn()) return true;
        _client.end();
        _autoReconnect = false;
        return true;
    };

    this.kill = function(){
        /*
         * Forced Restart Sequence
         *
         * This will destory the client, and try to login.
         */
        try{
            if(_client){
                _client.connection.socket.destroy();
                _client = null;
                if(_autoReconnect) self.login(_password);
            };
        } finally {
        };
    };

    this.login = function(password, presence){
        if(_status() > 0) return false;

        if(!password)
            password = _password;
        else
            _password = password;
        if(!password) return false;

        _autoReconnect = true;
        if(presence != undefined)
            _initPresence = presence; //TODO validate 'presence', must contain valid 'chat' and 'words' item.
        else
            _initPresence = true;

        _client = new $.node.xmpp.Client({jid: jid, password: password});

        _client.on('online', self.handlers.onOnline);
        _client.on('stanza', self.handlers.onStanza);
        _client.on('error', self.handlers.onError);
        _client.on('close', self.handlers.onClose);

        _client.connection.socket.setTimeout(
            10000,
            self.handlers.onTimeout
        );

        self.watchdog.wake();
        self.autoPinger();

        return true;
    };

    this.send = function(jid, content){
        /*
         * Send an Element
         * if not login, this will be put into queue.
         */
        if(content == undefined) return false;
        console.log('Sending to [' + jid + ']: ' + content);
        var element = 
            new $.node.xmpp.Element(
                'message',
                {
                    to: jid,
                    type: 'chat'
                }
            )
                .c('body')
                .t(content)
        ;
        if(self.loggedIn())
            _clientSend(element);
        else
            queue.send.push(element);
        return true;
    };

    this.receive = function(){
        // Get receive queue
        if(!self.loggedIn()) return false;
        return queue.recv.shift();
    };

    this.roster = function(){
        return self.rosterManager.all();
    };

    this.ping = function(jid){
        var stanzaID = '';
        if(!self.loggedIn()) return false;

        if(jid == undefined){
            jid = _client.jid.domain;
            stanzaID = 'c2s1';
        } else {
            stanzaID = 'e2e1';
        }

        var stanza = new $.node.xmpp.Element(
            'iq',
            {
                from: _client.jid,
                to: jid,
                type: 'get',
                id: stanzaID,
            }
        )
            .c('ping')
            .attr('xmlns', 'urn:xmpp:ping')
            .root()
        ;

        _clientSend(stanza);
        return true;
    };

    this.autoPinger = function(){
        /*
         * Once called, will use setTimeout to generate PING every 20 sec.
         */
        self.ping();// to Server

        if(_client)
            setTimeout(self.autoPinger, 20000);
    };

    this.sendPresence = function(show, words){
        if(!self.loggedIn()) return false;
        if(show == undefined) show = 'chat';
        if(words == undefined) words = 'Commsystem Testing...';

        _clientSend(
            new $.node.xmpp
                .Element('presence', { })
                .c('show')
                .t(show)
                .up()
                .c('status')
                .t(words)
        );

        console.log('Presence sent.');
    };

    this.handlers = {

        onOnline: function(){
            self.emit('online');
            /* Request Roster. */
            _clientSend(
                new $.node.xmpp.Element(
                    'iq', {
                        from: _client.jid,
                        type: 'get',
                        id: 'roster_1',
                    }
                )
                    .c('query')
                    .attr('xmlns', 'jabber:iq:roster')
                    .root()
            );

            /* Purge send queue. */
            while(queue.send.length > 0)
                _clientSend(queue.send.shift());
        },

        onStanza: function(stanza){
            // we don't care what it is, it just signals it is alive.
            self.watchdog.feed();

            stanza = stanza.root();
            $.o(stanza.toString()).yellow().log();

            /*
             * Use self.xmppParser to parse stanza.
             * Here is the router.
             */
            if(
                stanza.is('message') &&
                stanza.attrs.type !== 'error'
            )
                self.xmppParser.message(stanza);

            if(stanza.is('iq')){
                try{
                    var queryStanza = stanza.getChild('query');
                    if(queryStanza){
                        if(queryStanza.attrs.xmlns == 'jabber:iq:roster'){
                            self.xmppParser.roster(queryStanza);
                            /* send presence if not done that. */
                            if(_initPresence){
                                if(true === _initPresence)
                                    self.sendPresence();
                                else
                                    self.sendPresence(
                                        _initPresence.chat,
                                        _initPresence.words
                                    );
                                _initPresence = false;
                            }
                        }
                    }
                } catch (e){
                }
            }
            /* end of router */

        },

        onError: function(e){
            $.o(e.toString()).red().error(e);
            if(_status('AUTH')){
                // failure to login.
                if(e.toString().indexOf('auth') >= 0){
                    // Login failure.
                    _password = false;
                    _autoReconnect = false;
                }
                // Attach self destory sequence.
                self.kill();
            }
        },

        onTimeout: function(e){
            console.log('Timeout received.');
        },

        onClose: function(e){
            console.log('Close received.');
        },

    }; // handlers: ...

    this.watchdog = {

        _lastTime: 0,
        patience: 30000,

        wake: function(){
            self.watchdog.feed();
            self.watchdog.hungry();
        },

        feed: function(){
            self.watchdog._lastTime = new Date().getTime();
        },

        hungry: function(){
            var nowtime = new Date().getTime();
            if(nowtime - self.watchdog._lastTime > self.watchdog.patience)
                if(self.loggedIn()){
                    self.kill();
                    console.log('Watchdog shutdown client!');
                }

            if(_client)
                setTimeout(self.watchdog.hungry, 1000);
        },

    }

    this.xmppParser = {

        message: function(stanza){
            var body = stanza.getChild('body');
            if(body != undefined){
                var newMessage = {
                    'content': body.children.join(''),
                    'from': stanza.attrs.from,
                };
                console.log(newMessage);
                queue.recv.push(newMessage);
            }
        },

        roster: function(stanza){
            /* giftiger Fussabdruck wegen historisches Grundes hier! */
            var list = {};
            var recorded = 0;
            try{
                var items = stanza.getChildren('item');
                for(var i=0; i<items.length; i++){
                    /* constructs new item */
                    var newitem = {
                        jid: items[i].attrs['jid'] || false,
                        subscription: items[i].attrs['subscription'] || false,
                    };
                    if(!newitem.jid) continue;
                    newitem.name = items[i].attrs['name'] || false;
                    
                    /* determine group name */
                    var groupName = 'default';
                    var groupChild = items[i].getChild('group');
                    if(groupChild)
                        groupName = groupChild.children.join('');

                    /* save to list */
                    if(list[groupName] == undefined){
                        list[groupName] = {};
                        list[groupName][newitem.jid] = newitem;
                    } else
                        list[groupName][newitem.jid] = newitem;

                    recorded += 1;
                }
            } catch(e){
                console.error(e.toString());
            }

            if(recorded > 0){
                console.log(recorded + ' items in roster received.');
                self.rosterManager.register(list);
            } else {
                console.log('No roster items found.');
            }
        },

    };

    this.rosterManager = {
        
        _roster: {},

        register: function(list){
            self.rosterManager._roster = list;
            // TODO more proceeding
        },

        presence: function(){
            
        },

        all: function(){
            return self.rosterManager._roster;
        },

    };

    _clientSend = function(e){
        $.o(e.root().toString()).cyan().log();
        _client.send(e);
    };

    return this;
};
$.node.util.inherits(XMPPClient, $.node.events.EventEmitter);
