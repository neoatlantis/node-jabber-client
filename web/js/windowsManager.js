WM = {}; // Windows Manager

WM.register = function(title, content){
    var handle = COMMON.uuid();
    $(content).dialog().attr('data-uuid', handle);

    $('<li>')
        .data('uuid', handle)
        .append($('<a>', {href: '#'})
            .text(title)
            .prepend($('<span>')
                .addClass('glyphicon glyphicon-star')
            )
        )
        .click(function(){
            var uuid = $(this).data('uuid');
            $('#nav-switches').children('li').each(function(){
                var thisUUID = $(this).data('uuid');
                if(uuid != thisUUID) return $(this).removeClass('active');

                if($(this).hasClass('active')){
                    // hide this dialog
                } else {
                    // show this dialog
                    $(this).addClass('active');
                    $('[data-uuid="' + uuid + '"])
                        .show()
                        .dialog('moveToTop')
                    ;
                };
            });

        })
        .appendTo($('#nav-switches'))
    ;
};

setInterval(function(){
    $('#nav-datetime').text(new Date().toLocaleString());
}, 500);
