module.exports = function(jid, pwd){
    return new XMPPClient(jid, pwd);
};

module.exports = function XMPPClient(jid, pwd){
    var self = this;

    var jid = new $.node.xmpp.JID(jid).bare().toString();


    this._autoReconnect = false;
    this._password = false;
    this._initPresence = true;
    this.client = null;
    this.queue = new x.storage.queue();

    this.status = function(v){
        /* see <https://github.com/astro/node-xmpp/blob/master/lib/xmpp/client.js> */
        var res = 'PREAUTH';
        if(self.client)
            res = {
                0: 'PREAUTH',
                1: 'AUTH',
                2: 'AUTHED',
                3: 'BIND',
                4: 'SESSION',
                5: 'ONLINE',
            }[self.client.state];

        if(v == undefined)
            return res;
        else
            return res == v || self.client.state == v;
    };

    this.report = function(){
        var password = false;
        if(self.password) password = true;

        return {
            'jid': jid,
            'client': {
                'status': self.clientStatus(),
                'password': password,
            },
            'queue': {
                'send': self.queue.countSend(),
                'receive': self.queue.countReceive(),
            },
            'roster': self.roster(),
        };
    };

    this.loggedIn = function(){
        if(self.client)
            return self.client.state >= 2;
        return false;
    };

    this.logout = function(){
        if(!self.loggedIn()) return;
        self.client.end();
        self._autoReconnect = false;
    };

    this.kill = function(){
        /*
         * Forced Restart Sequence
         *
         * This will destory the client, and try to login.
         */
        try{
            if(self.client){
                self.client.connection.socket.destroy();
                delete self.client;

                if(self._autoReconnect){
                    self.login(self._password);
                }
            }
        } finally {
        }
    };

    this.login = function(password, presence){
        if(self.clientStatus() > 0) return false;
        if(password == undefined) password = self._password;
        if(!password) return false;

        self._autoReconnect = true;
        self._password = password;
        if(presence != undefined)
            self._initPresence = presence; //TODO validate 'presence', must contain valid 'chat' and 'words' item.
        else
            self._initPresence = true;

        self.client =
            new x.communication_modules.xmpp.Client({
                jid: jid,
                password: password,
            })
        ;

        self.client.on('online', self.handlers.onOnline);
        self.client.on('stanza', self.handlers.onStanza);
        self.client.on('error', self.handlers.onError);
        self.client.on('close', self.handlers.onClose);

        self.client.connection.socket.setTimeout(
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
        x.log.notice('Sending to [' + jid + ']: ' + content);
        var element = 
            new x.communication_modules.xmpp.Element(
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
            self.client.send(element);
        else
            self.queue.send(element);
        return true;
    };

    this.receive = function(){
        // Get receive queue
        if(!self.loggedIn()) return false;
        return self.queue.receive();
    };

    this.roster = function(){
        return self.rosterManager.all();
    };

    this.ping = function(jid){
        var stanzaID = '';
        if(!self.loggedIn()) return false;

        if(jid == undefined){
            jid = self.client.jid.bare();
            stanzaID = 'c2s1';
        } else {
            stanzaID = 'e2e1';
        }

        var stanza = new x.communication_modules.xmpp.Element(
            'iq',
            {
                from: self.client.jid,
                to: jid,
                type: 'get',
                id: stanzaID,
            }
        )
            .c('ping')
            .attr('xmlns', 'urn:xmpp:ping')
            .root()
        ;

        x.log.debug(stanza.toString());

        self.client.send(stanza);

        return true;
    };

    this.autoPinger = function(){
        /*
         * Once called, will use setTimeout to generate PING every 20 sec.
         */
        self.ping();// to Server

        if(self.client)
            setTimeout(self.autoPinger, 20000);
    };

    this.sendPresence = function(show, words){
        if(!self.loggedIn()) return false;
        if(show == undefined) show = 'chat';
        if(words == undefined) words = 'A probe of my orichalcum system.';

        self.client
            .send(
                new x.communication_modules.xmpp
                    .Element('presence', { })
                    .c('show')
                    .t(show)
                    .up()
                    .c('status')
                    .t(words)
            )
        ;

        x.log.notice('Presence sent.');
    };

    this.handlers = {

        onOnline: function(){
            /* Request Roster. */
            self.client
                .send(
                    new x.communication_modules.xmpp.Element(
                        'iq', {
                            from: self.client.jid,
                            type: 'get',
                            id: 'roster_1',
                        }
                    )
                        .c('query')
                        .attr('xmlns', 'jabber:iq:roster')
                        .root()
                )
            ;

            /* Purge send queue. */
            while(self.queue.countSend() > 0)
                self.client.send(self.queue.send());
        },

        onStanza: function(stanza){
            self.watchdog.feed();
            stanza = stanza.root();
            x.log.notice(stanza.toString());

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
                            if(self._initPresence){
                                if(true === self._initPresence)
                                    self.sendPresence();
                                else
                                    self.sendPresence(
                                        self._initPresence.chat,
                                        self._initPresence.words
                                    );
                                self._initPresence = false;
                            }
                        }
                    }
                } catch (e){
                }
            }
            /* end of router */

        },

        onError: function(e){
            x.log.notice(e);
            if(self.clientStatus('AUTH')){
                // failure to login.
                if(e.toString().indexOf('auth') >= 0){
                    // Login failure.
                    self._password = false;
                    self._autoReconnect = false;
                }
                // Attach self destory sequence.
                self.kill();
            }
        },

        onTimeout: function(e){
//                self.kill();
//                x.log.notice('Detected timeout. Self destroyed.');
            x.log.notice('Timeout received.');
        },

        onClose: function(e){
            x.log.notice('Close received.');
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
                    x.log.notice('Watchdog shutdown client!');
                }

            if(self.client)
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
                x.log.notice(newMessage);
                self.queue.receive(newMessage);
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
                        jid:
                            x.object.getter(
                                items[i].attrs,
                                'jid'
                            ),
                        subscription:
                            x.object.getter(
                                items[i].attrs,
                                'subscription',
                                'to'
                            ),
                    };
                    if(!newitem.jid) continue;
                    newitem.name =
                        x.object.getter(
                            items[i].attrs,
                            'name'
                        );
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
                x.log.error(e.toString());
            }

            if(recorded > 0){
                x.log.notice(recorded + ' items in roster received.');
                self.rosterManager.register(list);
            } else {
                x.log.notice('No roster items found.');
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

    return this;
};
