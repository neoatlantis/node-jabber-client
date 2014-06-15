WM = {}; // Windows Manager

WM._newTaskBarButton = function(managedDialog){
    return new (function taskBarButton(){
        var self = this;
        var taskBarButtonItem = $('<li>')
            .append($('<a>', {href: '#'})
                .text(managedDialog.title)
                .prepend($('<span>')
                    .addClass('glyphicon glyphicon-star')
                )
            )
            .appendTo($('#nav-switches'))
        ;

        taskBarButtonItem.click(function(){
            var thisButton = $(taskBarButtonItem),
                thisDialog = managedDialog.dialog;

            var wasActive = thisButton.hasClass('active');
            $('#nav-switches').children('li').removeClass('active');                
            
            if(wasActive){
                // hide this dialog
                thisDialog.hide();
            } else {
                // show this dialog
                thisButton.addClass('active');
                thisDialog
                    .show()
                    .dialog('moveToTop')
                ;
            };
        });

        managedDialog.dialog.on('dialogclose', function(){
            $(taskBarButtonItem).remove();
        });

        return this;
    })();
};

WM.register = function(_title, _div){
    var theManagedDialog = new (function wmDialogRegister(title, div){
        var self = this;

        this.uuid = COMMON.uuid();
        this.title = title;
        this.dialog = div
            .attr('title', self.title)
            .attr('data-uuid', self.uuid)
            .appendTo('body')
            .on("dialogclose", function(event, ui){
                $('[data-uuid="' + handle + '"]').remove();
            })
            .dialog()
        ;

        return this;
    })(_title, _div);

    WM._newTaskBarButton(theManagedDialog);
    return theManagedDialog;
};

setInterval(function(){
    $('#nav-datetime').text(new Date().toLocaleString());
}, 500);
