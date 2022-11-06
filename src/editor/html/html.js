module.exports = function(broccoli, main, editor, mod, data, elm){
	var TableTagEditor = require('@tomk79/table-tag-editor');

    this.init = function( callback ){
        var _this = this;
        if( typeof(data) !== typeof({}) ){ data = {}; }
        if( typeof(data.resKey) !== typeof('') ){
            data.resKey = '';
        }
        var appMode = broccoli.getAppMode();
        var template = require('./html.twig');
        var $rtn = $( template({
            modName: mod.name,
            appMode: appMode,
            resKey: data.resKey,
            data: data,
        }) );

        // ヘッダー行
        $rtn.find('input[name='+(mod.name)+'__header_row]').val( data.header_row );

        // ヘッダー列
        $rtn.find('input[name='+(mod.name)+'__header_col]').val( data.header_col );

        // 再現方法
        $rtn.find('input[name="'+mod.name+'__renderer"]').val( data.renderer );

        // セルの表現方法
        $rtn.find('input[name="'+mod.name+'__cell_renderer"]').val( data.cell_renderer );

        // 編集方法
        $rtn.find('input[name="'+mod.name+'__editor"]').val( data.editor );

        // ソースコード
        $rtn.find('textarea[name="'+mod.name+'__output"]').val( data.output );

        $(elm).html($rtn);

        var tableTagEditor = new TableTagEditor( $rtn.find('textarea[name="'+mod.name+'__output"]') );


        setTimeout(function(){
            callback();
        }, 0);
    }


}
