var xmppClient = function(){
    return new _xmppClientLogin();
};

//////////////////////////////////////////////////////////////////////////////

function _xmppClientLogin(){
    var self = this;
    var dialog = WM.register('登录XMPP', $('<div>'), {
        width: 450,
        height: 230,
        dialogClass: 'no-close',
    });

    var target = $(dialog._dialogSelector).empty();
    var form = $('<form>', {role: 'form'})
        .addClass('form-horizontal')
        .appendTo(target);

    // add JID input
    $('<div>').addClass('form-group')
        .append($('<label>').addClass('col-sm-4 control-label')
            .text('XMPP用户名')
            .attr('for', 'xmpp-jid-' + dialog.uuid)
        )
        .append($('<div>').addClass('col-sm-8').append(
            $('<input>', {
                type: 'text',
                id: 'xmpp-jid-' + dialog.uuid,
                placeholder: 'name@domain.com',
                name: 'xmpp-jid-' + dialog.uuid
            })
                .addClass('form-control')
        ))
        .appendTo(form)
    ;
    
    // add password input
    $('<div>').addClass('form-group')
        .append($('<label>').addClass('col-sm-4 control-label')
            .text('XMPP密码')
            .attr('for', 'xmpp-password-' + dialog.uuid)
        )
        .append($('<div>').addClass('col-sm-8').append(
            $('<input>', {
                type: 'password',
                id: 'xmpp-password-' + dialog.uuid,
                placeholder: '密码',
                name: 'xmpp-password-' + dialog.uuid
            })
                .addClass('form-control')
        ))
        .appendTo(form)
    ;

    dialog.buttons([
        {
            text: '登录',
            click: function(){
                var jid = $('#xmpp-jid-' + dialog.uuid).val(),
                    pwd = $('#xmpp-password-' + dialog.uuid).val();
                $.ajax({
                    url: '/xmpp',
                    type: 'get',
                    data: {
                        jid: jid,
                        password: pwd,
                        action: 'login',
                    },
                    dataType: 'json',
                })
                    .done(function(json){
                        if(true == json.result)
                            return new _xmppClientMain(jid);
                        $.notify('登录失败。', 'danger');
                    })
                    .always(dialog.unload)
                ;
            },
        },
        {
            text: '取消',
            click: dialog.unload,
        }
    ]);

    dialog.show();
    return this;
};

//////////////////////////////////////////////////////////////////////////////

function _xmppClientMain(jid){
    var self = this;
    var func = {}, died = false;

    var dialog = WM.register(jid, $('<div>'), {
        minWidth: 240,
        minHeight: 400,
        width: 241,
        height: 401,
    });

    // add status changer
    var dlgHeadRow = $('<div>').addClass('btn-group'),
        dlgStatusChangerButton = $('<button>', {
            type: 'button',
            'data-toggle': 'dropdown',
        })
            .addClass('btn btn-default btn-xs dropdown-toggle')
            .text('当前状态')
            .append($('<span>', {name: 'online-status'})
                .addClass('label label-default')
                .text('离线')
            )
            .append($('<span>').addClass('caret'))
            .appendTo(dlgHeadRow)
    ;
    var dlgStatusChangerMenu = $('<ul>', {role: 'menu'})
        .addClass('dropdown-menu')
        .appendTo(dlgHeadRow)
    ;
    dlgHeadRow.appendTo(dialog._dialogSelector);

    // add status changer menu
    var i = function(desc, doer){
        dlgStatusChangerMenu.append($('<li>')
            .append($('<a>', {href: '#'})
                .text(desc)
                .click(func.logout)
            )
        );
    };
    i('在线');
    i('离线');


    // add exit button
    dlgHeadRow.append($('<button>', {type: 'button'})
        .addClass('btn btn-default btn-xs')
        .text('退出')
        .click(function(){func.logout();})
    );


    
    // add list
    var dlgContactDiv = $('<div>')
        .css('overflow-y', 'scroll')
        .css('overflow-x', 'hidden')
        .css('height', '80%')
        .css('width', '100%')
        .appendTo(dialog._dialogSelector)
    ;
    var dlgContactList = $('<div>', {name: "buddy-list"})
        .addClass('list-group')
        .appendTo(dlgContactDiv)
    ;

    dlgContactDiv.appendTo(dialog._dialogSelector);


    ///////////////////////// Refreshing Functions //////////////////////
    func.logout = function(){
        $.ajax({
            url: '/xmpp',
            type: 'get',
            data: {
                jid: jid,
                action: 'logout',
            },
        })
            .always(dialog.unload)
        ;
        died = true;
    };

    func.setOnlineStatus = function(v){
        var statusDisplay = $(dialog._dialogSelector).find('[name="online-status"]');
        var map = {
            'PREAUTH': ['label-default', '离线'],
            'AUTH': ['label-warning', '登录中'],
            'AUTHED': ['label-info', '已登录'],
            'BIND': ['label-info', '初始化'],
            'SESSION': ['label-primary', '初始化'],
            'ONLINE': ['label-success', '已登录'],
        };
        statusDisplay.removeClass('label-default label-warning label-info label-primary label-success');
        statusDisplay.addClass(map[v][0]).text(map[v][1]);
    };

    func.setBuddyList = function(v){
        // group name -> jid ->
        if(false === v) return; // not retrived, but may not empty.
        var list = $(dialog._dialogSelector).find('[name="buddy-list"]');
        // remove the no longer existing entry and insert new entries
        var jids = [];
        for(var groupName in v){
            for(var j in v[groupName]){
                jids.push(j);
                if(list.find('[data-jid="' + j + '"]').length > 0) continue;
                list.append($('<a>', {href: '#'}).addClass('list-group-item')
                    .text(j)
                    .attr('data-jid', j)
                    .click((function(localJID, buddyJID){
                        return function(){
                            _xmppChatDialogGenerate(localJID, buddyJID);
                        };
                    })(jid, j))
                );
            };
        };
        list.find("[data-jid]").each(function(){
            if(jids.indexOf($(this).attr('data-jid')) < 0) $(this).remove();
        });
    };


    /* get new updates and refresh */
    function _refreshStatus(json){
        var client = json.client || {},
            roster = json.roster || false;

        func.setOnlineStatus(client.status || 'PREAUTH');
        func.setBuddyList(roster);
    };
    
    var _ajaxCall = function(){
        $.ajax({
            url: '/xmpp',
            data: {
                jid: jid,
                action: 'show',
            },
            dataType: 'json',
        })
            .done(_refreshStatus)
            .always(function(){
                if(!died) setTimeout(_ajaxCall, 2000);
            })
        ;
    };
    _ajaxCall();


    return this;
};

//////////////////////////////////////////////////////////////////////////////

var _xmppChatDialogs = {}; // for elimating repeated dialogs
function _xmppChatDialog(localJID, buddyJID){
    // the dialog class
    var self = this, func = {};
        
    var dialog = WM.register('与 ' + buddyJID + ' 聊天', $('<div>'), {
        minWidth: 500,
        minHeight: 400,
        width: 501,
        height: 401,
        buttons: [
            {text: '关闭', click: function(){self.unload();}},
            {text: '发送', click: function(){self.sendMessage();}},
        ]
    });

    var dialogHistory = $('<div>').appendTo(dialog._dialogSelector)
        .attr('name', 'history')
        .attr('overflow-x', 'hidden')
        .attr('overflow-y', 'scroll')
        .css({
            position: 'absolute',
            top: '3px',
            bottom: '22%',
            padding: '2px',
            left: '1px',
            right: '1px',
            width: '98%',
            overflow: 'auto',
        })
    ;
    
    $('<textarea>',{
        width: '100%',
        name: 'user-input',
    }).css({
        resize: 'none',
        position: 'absolute',
        left: '0',
        bottom: '0',
        height: '20%',
    }).appendTo(dialog._dialogSelector)
      .bind('keypress', this.onTextareaKeypress );


    //////////////////////////////////////////////////////////////////////

    function setHistory(entry, status){
        var bgcolor = {
            unknown: '#ffffee',
            error: '#ffeeee',
            wait: '#ffffcc',
            received: '#eeffee',
        }[status || 'unknown'];
        entry.css('background', bgcolor);
    };

    function addHistory(isLocal, message, config){
        var outerdiv = $('<div>').addClass('messagePiece');
        var prompting = $('<div>').css('font-weight', 'bold');
        
        var usertext = $('<div>').text(message);
        var time = (config.time?new Date(config.time):new Date());

        usertext.html( usertext.html().replace(/\n/g, "<br />") );

        if(Boolean(isLocal)){
            if(config.receipt)
                outerdiv.attr('data-receipt', config.receipt);
            prompting.text('我  ' + time.toLocaleString() )
                .css('color', '#11aa11')
            ;
        } else {
            prompting.text(buddyJID + '  ' + time.toLocaleString() )
                .css({
                    'color': '#0000cc',
                })
            ;
        };

        return outerdiv
            .append(prompting)
            .append(usertext)
            .appendTo($(dialog._dialogSelector).find('[name="history"]'))
        ;
    };

    this.activate = function(){
        dialog.show();
        return self;
    };

    this.onTextareaKeypress = function(e){
        if(e.ctrlKey) if(e.which == 10 || e.which == 13) self.sendMessage();
    };

    this.sendMessage = function(){
        var message = $(dialog._dialogSelector)
                .find('[name="user-input"]').val().trim(),
            now = new Date(),
            requireReceipt = true;

        function _onSent(json){
            var newEntry = addHistory(true, message, now), status = 'unknown';
            if(false == json.result)
                status = 'error';
            else {
                if(requireReceipt)
                    status = 'wait';
                else
                    status = 'unknown';
            };
            setHistory(newEntry, status);
            $(dialog._dialogSelector).find('[name="user-input"]').val('');
        };
        
        $.ajax({
            url: '/xmpp',
            dataType: 'json',
            type: 'post',
            data: {
                action: 'send',
                jid: localJID,
                recv: buddyJID,
                message: message,
                receipt: (requireReceipt?'1':undefined),
            },
        })
            .done(_onSent)
        ;
    };

    this.unload = function(){
        dialog.unload();
        _xmppChatDialogUnregister(localJID, buddyJID);
    };


    return this;
};


function _xmppChatDialogGenerate(localJID, buddyJID){
    if(_xmppChatDialogs[localJID] && _xmppChatDialogs[localJID][buddyJID])
        return _xmppChatDialogs[localJID][buddyJID].activate();
    var newDialog = new _xmppChatDialog(localJID, buddyJID);
    if(!_xmppChatDialogs[localJID]) _xmppChatDialogs[localJID] = {};
    _xmppChatDialogs[localJID][buddyJID] = newDialog;
    return newDialog.activate();
};
function _xmppChatDialogUnregister(localJID, buddyJID){
    if(!_xmppChatDialogs[localJID]) return;
    delete _xmppChatDialogs[localJID][buddyJID];
};
