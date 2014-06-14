WM = {}; // Windows Manager

WM.register = function(title, content){
    var handle = COMMON.uuid();
    $(content).attr('data-uuid', handle);

    $('<li>')
        .data('uuid', handle)
        .append($('<a>', {href: '#'})
            .text(title)
            .prepend($('<span>')
                .addClass('glyphicon glyphicon-star')
            )
        )
        .click(function(){
            alert($(this).data('uuid'));
        })
        .appendTo($('#nav-switches'))
    ;
};

setInterval(function(){
    $('#nav-datetime').text(new Date().toLocaleString());
}, 500);
