module.exports = function(broccoli, main, editor, mod, data, elm){
    var templateImportXlsx = require('./importXlsx.twig');

	this.init = function( callback ){
		var _this = this;
		if( typeof(data) !== typeof({}) ){ data = {}; }
		if( typeof(data.resKey) !== typeof('') ){
			data.resKey = '';
		}
		var appMode = broccoli.getAppMode();

		// モーダルを開く
        var $modalImportXlsx = $( templateImportXlsx({
            modName: mod.name,
            appMode: appMode,
            resKey: data.resKey,
            data: data,
        }) );

        var importXlsxModal = px2style.modal({
            "title": "Excelファイルから取り込む",
            "body": $modalImportXlsx,
            "buttons": [
                $('<button type="button" class="px2-btn px2-btn--primary">')
                    .text("Excelファイルから取り込む")
                    .on('click', function(){
                        importXlsxModal.close();
                    }),
            ],
            "buttonsSecondary": [
                $('<button type="button" class="px2-btn">')
                    .text("キャンセル")
                    .on('click', function(){
                        importXlsxModal.close();
                    }),
            ],
        });

		setTimeout(function(){
			callback();
		}, 0);
	}

}
