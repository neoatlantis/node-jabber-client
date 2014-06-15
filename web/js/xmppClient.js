var xmppClient = function(){
    return new _xmppClient();
};

function _xmppClient(){
    var self = this;
    var dialog = WM.register('登录XMPP', $('<div>'), {
        width: 450,
        height: 230,
        dialogClass: 'no-close',
    });

    function _drawLoginForm(){
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
                },
            },
            {
                text: '取消',
                click: dialog.close,
            }
        ]);

    };

    _drawLoginForm();

    return this;
};
