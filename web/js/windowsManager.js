WM = {}; // Windows Manager

WM.register = function(title, div){
    var handle = COMMON.uuid();

    div
        .attr('title', title)
        .attr('data-uuid', handle)
        .appendTo('body')
        .dialog()
        .on("dialogclose", function(event, ui){
            $('[data-uuid="' + handle + '"]').remove();
        });
    ;

    $('<li>')
        .attr('data-uuid', handle)
        .append($('<a>', {href: '#'})
            .text(title)
            .prepend($('<span>')
                .addClass('glyphicon glyphicon-star')
            )
        )
        .click(function(){
            var uuid = $(this).attr('data-uuid');
            $('#nav-switches').children('li').each(function(){
                var thisUUID = $(this).attr('data-uuid');
                if(uuid != thisUUID) return $(this).removeClass('active');
                
                var thisDialog = $('div[data-uuid="' + uuid + '"]');
                if($(this).hasClass('active')){
                    // hide this dialog
                    $(this).removeClass('active');
                    thisDialog.hide();
                } else {
                    // show this dialog
                    $(this).addClass('active');
                    thisDialog
                        .show()
                        .dialog('moveToTop')
                    ;
                };
            });
        })
        .click()
        .appendTo($('#nav-switches'))
    ;
};

setInterval(function(){
    $('#nav-datetime').text(new Date().toLocaleString());
}, 500);
