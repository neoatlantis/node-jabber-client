WM = {}; // Windows Manager

WM._newTaskBarButton = function(_managedDialog){
    return new (function(managedDialog){
        var self = this;
        var taskBarButtonItem = $('<li>')
            .attr('data-wmbtn', managedDialog.uuid)
            .append($('<a>', {href: '#'})
                .text(managedDialog.title)
                .prepend($('<span>')
                    .addClass('glyphicon glyphicon-star')
                )
            )
            .appendTo($('#nav-switches'))
        ;

        var thisButtonSelector = '[data-wmbtn="' + managedDialog.uuid + '"]';
        var thisDialog = $(managedDialog._dialogSelector);

        function onDialogFocus(){
            $('#nav-switches').children('li').removeClass('active');
            $(thisButtonSelector).addClass('active');
        };
        thisDialog.on('dialogfocus', onDialogFocus);
        thisDialog.on('click', onDialogFocus);

        function onTaskBarButtonClick(){
            var wasActive = $(thisButtonSelector).hasClass('active');
            $('#nav-switches').children('li').removeClass('active');                
            
            if(wasActive){
                // hide this dialog
                managedDialog.hide();
            } else {
                // show this dialog
                managedDialog.show();
                $(thisButtonSelector).addClass('active');
                thisDialog.dialog('moveToTop') ;
            };
        };
        taskBarButtonItem.click(onTaskBarButtonClick);
        onTaskBarButtonClick();

/*        $(managedDialog._dialogSelector).on('dialogclose', function(){
            $(thisButtonSelector).remove();
        });*/

        return this;
    })(_managedDialog);
};

WM.register = function(_title, _div, _conf){
    var theManagedDialog = new (function(title, div, conf){
        var self = this;

        var title = title, buttons = [];
        conf.autoOpen = false;

        this.uuid = COMMON.uuid();
        this.dialog = div
            .attr('title', title)
            .attr('data-wmdlg', self.uuid)
            .appendTo('body')
            .on("dialogclose", self.close)
            .dialog(conf)
        ;
        this._dialogSelector = '[data-wmdlg="' + self.uuid + '"]';

        this.title = function(v){
            if(!v) return title;
            title = v;
            $(self._dialogSelector)
                .attr('title', title)
                .dialog('option', 'title', v)
            ;
            return title;
        };

        this.buttons = function(v){
            if(!v) return buttons;
            buttons = v;
            $(self._dialogSelector).dialog('option', 'buttons', v);
            $('button').addClass('btn btn-default');
            return buttons;
        };

        this.unload = function(){
            $(self._dialogSelector).dialog('close').dialog('destroy').remove();
        };

        this.hide = function(){
            $(self._dialogSelector).dialog('close');
        };

        this.show = function(){ 
            $(self._dialogSelector).dialog('open');
        };

        return this;
    })(_title, _div, _conf);

    WM._newTaskBarButton(theManagedDialog);
    return theManagedDialog;
};

setInterval(function(){
    $('#nav-datetime').text(new Date().toLocaleString());
}, 500);
