module.exports = function(broccoli, main, editor, mod, data, elm){

    this.init = function( callback ){
        var template = require('./html.twig');
        setTimeout(function(){
            callback();
        }, 0);
    }


}
