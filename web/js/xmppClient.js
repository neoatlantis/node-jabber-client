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

    var target = dialog.dialog.empty();
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
                    .always(dialog.close)
                ;
            },
        },
        {
            text: '取消',
            click: dialog.close,
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
            .text('当前状态[在线]')
            .append($('<span>').addClass('caret'))
            .appendTo(dlgStatusChanger)
    ;
    $('<ul>', {role: 'menu'})
        .addClass('dropdown-menu')
        .appendTo(dlgStatusChanger)
    ;
//    dlgStatusChanger.appendTo(dialog.dialog);

    
    // add list
    var dlgContactList = $('<select>').addClass('form-control');



    // xmpp client status function
    function _refreshStatus(json){
        console.log(json);
    };
    
    setInterval(function(){
        $.ajax({
            url: '/xmpp',
            data: {
                jid: jid,
                action: 'show',
            },
        })
            .done(_refreshStatus)
        ;
    }, 2000);


    return this;
};
