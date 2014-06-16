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

    var dialog = WM.register(jid, $('<div>'), {
        minWidth: 240,
        minHeight: 400,
        width: 241,
        height: 401,
    });

    // add status changer
    var dlgStatusChanger = $('<div>').addClass('btn-group'),
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
            .appendTo(dlgStatusChanger)
    ;
    $('<ul>', {role: 'menu'})
        .addClass('dropdown-menu')
        .appendTo(dlgStatusChanger)
    ;
    dlgStatusChanger.appendTo(dialog._dialogSelector);

    
    // add list
    var dlgContactList = $('<select>').addClass('form-control');


    ///////////////////////// Refreshing Functions //////////////////////

    var func = {};

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


    /* get new updates and refresh */
    function _refreshStatus(json){
        var client = json.client || {};

        func.setOnlineStatus(client.status || 'PREAUTH');
    };
    
    setInterval(function(){
        $.ajax({
            url: '/xmpp',
            data: {
                jid: jid,
                action: 'show',
            },
            dataType: 'json',
        })
            .done(_refreshStatus)
        ;
    }, 2000);


    return this;
};
