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

        function onTaskBarButtonClick(){
            var thisButton = $(taskBarButtonItem),
                thisDialog = managedDialog.dialog,
                thisDialogAll = thisDialog.parent('[role="dialog"]');

            var wasActive = thisButton.hasClass('active');
            $('#nav-switches').children('li').removeClass('active');                
            
            if(wasActive){
                // hide this dialog
                thisDialogAll.hide();
            } else {
                // show this dialog
                thisDialogAll.show();
                thisButton.addClass('active');
                thisDialog .dialog('moveToTop') ;
            };
        };
        taskBarButtonItem.click(onTaskBarButtonClick);
        onTaskBarButtonClick();

        managedDialog.dialog.on('dialogclose', function(){
            $(taskBarButtonItem).remove();
        });

        return this;
    })();
};

WM.register = function(_title, _div, _conf){
    var theManagedDialog = new (function wmDialogRegister(title, div, conf){
        var self = this;

        var title = title;

        this.uuid = COMMON.uuid();
        this.dialog = div
            .attr('title', title)
            .attr('data-uuid', self.uuid)
            .appendTo('body')
            .on("dialogclose", function(event, ui){
                $(div).remove();
            })
            .dialog(conf)
        ;

        this.title = function(v){
            if(!v) return title;
            title = v;
            $(div).attr('title', title).dialog('option', 'title', v);
            return title;
        };

        return this;
    })(_title, _div, _conf);

    WM._newTaskBarButton(theManagedDialog);
    return theManagedDialog;
};

setInterval(function(){
    $('#nav-datetime').text(new Date().toLocaleString());
}, 500);
