module.exports = function(broccoli, main, editor, mod, data, elm){
	var TableTagEditor = require('@tomk79/table-tag-editor');

	this.init = function( callback ){
		var _this = this;
		if( typeof(data) !== typeof({}) ){ data = {}; }
		if( typeof(data.resKey) !== typeof('') ){
			data.resKey = '';
		}
		var appMode = broccoli.getAppMode();
		var templateHtml = require('./html.twig');
		var $rtn = $( templateHtml({
			modName: mod.name,
			appMode: appMode,
			resKey: data.resKey,
			data: data,
		}) );

		var ImportXlsx = require('./importXlsx.js');

		// ソースコード
		$rtn.find('textarea[name="'+mod.name+'__src"]').val( data.src );

		// Excelから取り込む
		$rtn.find('.broccoli-field-table__import-xlsx')
			.on('click.broccoli-field-table', function(){
				var importXlsx = new ImportXlsx(broccoli, main, editor, mod, data, elm);
				importXlsx.init(function(){
				});
			})
		;

		$(elm).html($rtn);

		var tableTagEditor = new TableTagEditor( $rtn.find('textarea[name="'+mod.name+'__src"]') );


		setTimeout(function(){
			callback();
		}, 0);
	}


}
