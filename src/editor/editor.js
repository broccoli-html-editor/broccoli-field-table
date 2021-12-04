module.exports = function(broccoli, main, mod, data, elm){
    var EditorHtml = require('./html/html.js');
    var EditorXlsx = require('./xlsx/xlsx.js');

    this.init = function( callback ){
        var editorXlsx = new EditorXlsx( broccoli, main, this, mod, data, elm );
        editorXlsx.init( function(){
            callback();
        } );
    }
}
