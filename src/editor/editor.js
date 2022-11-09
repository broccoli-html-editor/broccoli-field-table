module.exports = function(broccoli, main, mod, data, elm){
    var EditorHtml = require('./html/html.js');
    var EditorXlsx = require('./xlsx/xlsx.js');
    var editorData = JSON.parse( JSON.stringify(data) );

    this.init = function( callback ){
        if( editorData.editor == 'xlsx' ){
            var editorXlsx = new EditorXlsx( broccoli, main, this, mod, editorData, elm );
            editorXlsx.init( function(){
                callback();
            } );
        }else{
            var editorHtml = new EditorHtml( broccoli, main, this, mod, editorData, elm );
            editorHtml.init( function(){
                callback();
            } );
        }
    }
}
