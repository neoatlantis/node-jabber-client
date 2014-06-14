WM = {}; // Windows Manager

WM.register = function(title, content){
    var handle = COMMON.uuid();
    $(content).attr('data-window-uuid', handle);

    $('<li>')
        .attr('data-window-uuid', handle)
        .append($('<a>', {href: '#'})
            .text(title)
            .prepend($('<span>')
                .addClass('glyphicon glyphicon-star')
            )
        )
        .appendTo($('#nav-switches'))
    ;
};

setInterval(function(){
    $('#nav-datetime').text(new Date().toLocaleString());
}, 500);
