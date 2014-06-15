var xmppClient = function(){
    return new _xmppClient();
};

function _xmppClient(){
    var self = this;
    var dialog = WM.register('登录XMPP', $('<div>'));

    function _drawLoginForm(){
        var target = dialog.dialog.empty();
        var form = $('<form>', {role: 'form'})
            .appendTo(target);

    };

    _drawLoginForm();

    return this;
};
