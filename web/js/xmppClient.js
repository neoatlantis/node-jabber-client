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
            for(var jid in v[groupName]){
                jids.push(jid);
                if(list.find('[data-jid="' + jid + '"]').length > 0) continue;
                list.append($('<a>', {href: '#'}).addClass('list-group-item')
                    .text(jid)
                    .attr('data-jid', jid)
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

function _xmppClientChat(localJID, buddyJID){
    
};
