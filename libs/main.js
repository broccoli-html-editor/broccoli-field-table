module.exports = function(broccoli){

	var it79 = require('iterate79');
	var php = require('phpjs');
	var _resMgr = broccoli.resourceMgr;
	// var _pj = px.getCurrentProject();

	/**
	 * パスから拡張子を取り出して返す
	 */
	function getExtension(path){
		var ext = path.replace( new RegExp('^.*?\.([a-zA-Z0-9\_\-]+)$'), '$1' );
		ext = ext.toLowerCase();
		return ext;
	}

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		fieldData = fieldData||{};
		var rtn = '';
		if( fieldData.output ){
			rtn += fieldData.output;
		}

		if( mode == 'canvas' ){
			if( !rtn.length ){
				rtn += '<tr><td style="text-align:center;">ダブルクリックして編集してください。</td></tr>';
			}
		}
		setTimeout(function(){ callback(rtn); }, 0);
		return;
	}

	/**
	 * プレビュー用の簡易なHTMLを生成する
	 */
	this.mkPreviewHtml = function( fieldData, mod, callback ){
		// InstanceTreeViewで利用する
		fieldData = fieldData||{};
		var rtn = '';
		if( fieldData.output ){
			rtn += fieldData.output;
		}
		rtn = $('<table>'+rtn+'</table>');

		callback( rtn.get(0).outerHTML );
		return;
	}

	/**
	 * データを正規化する
	 */
	this.normalizeData = function( fieldData, mode ){
		var rtn = fieldData;
		if( typeof(fieldData) !== typeof({}) ){
			rtn = {
				"resKey":'',
				"output":"",
				"header_row":0,
				"header_col":0,
				"cell_renderer":'text',
				"renderer":'simplify'
			};
		}
		return rtn;
	}

	/**
	 * エディタUIを生成
	 */
	this.mkEditor = function( mod, data, elm, callback ){
		var rtn = $('<div>');
		if( typeof(data) !== typeof({}) ){ data = {}; }
		if( typeof(data.resKey) !== typeof('') ){
			data.resKey = '';
		}
		// if( typeof(data.original) !== typeof({}) ){ data.original = {}; }
		var res = _resMgr.getResource( data.resKey );

		var $excel = $('<div data-excel-info>');
		rtn.append( $excel );
		// console.log(data);
		if( data.resKey ){
			$excel.html('')
				.append( $('<button type="button">エクセルで開く</button>')
					.attr({
						'title': _resMgr.getResourceOriginalRealpath( data.resKey ),
						'data-excel-realpath': _resMgr.getResourceOriginalRealpath( data.resKey )
					})
					.click(function(){
						var realpath = $(this).attr('data-excel-realpath');
						px.utils.openURL(realpath);
					})
				)
			;
		}

		rtn.append( $('<input>')
			.attr({
				"name":mod.name ,
				"type":"file",
				"webkitfile":"webkitfile"
			})
			.css({'width':'100%'})
			.bind('change', function(e){
				// console.log(e.target.files);
				var fileInfo = e.target.files[0];

				function readSelectedLocalFile(fileInfo, callback){
					var reader = new FileReader();
					reader.onload = function(evt) {
						callback( evt.target.result );
					}
					reader.readAsDataURL(fileInfo);
				}

				var realpathSelected = $(this).val();
				if( realpathSelected ){
					readSelectedLocalFile(fileInfo, function(dataUri){
						$excel
							.html('選択しました')
							.attr({
								"src": dataUri ,
								"data-size": fileInfo.size ,
								"data-extension": getExtension( fileInfo.name ),
								"data-mime-type": fileInfo.type ,
								"data-base64": (function(dataUri){
									dataUri = dataUri.replace(new RegExp('^data\\:[^\\;]*\\;base64\\,'), '');
									// console.log(dataUri);
									return dataUri;
								})(dataUri)
							})
						;
					});
				}
			})
		);
		rtn.append( $('<div>')
			.append( $('<span>').text('ヘッダー行:') )
			.append( $('<input>')
				.attr({
					"name":mod.name+':header_row' ,
					"type":"number",
					"value":data.header_row
				})
			)
		);
		rtn.append( $('<div>')
			.append( $('<span>').text('ヘッダー列:') )
			.append( $('<input>')
				.attr({
					"name":mod.name+':header_col' ,
					"type":"number",
					"value":data.header_col
				})
			)
		);
		rtn.append( $('<div>')
			.append( $('<span>').text('再現方法:') )
			.append( $('<label>')
				.append( $('<input>')
					.attr({
						"name":mod.name+':renderer' ,
						"type":"radio",
						"value":"simplify"
					})
				)
				.append( $('<span>').text('単純化') )
			)
			.append( $('<label>')
				.append( $('<input>')
					.attr({
						"name":mod.name+':renderer' ,
						"type":"radio",
						"value":"strict"
					})
				)
				.append( $('<span>').text('そのまま表示') )
			)
		);
		rtn.find('input[name="'+mod.name+':renderer"][value="'+data.renderer+'"]').attr({'checked':'checked'});

		rtn.append( $('<div>')
			.append( $('<span>').text('セルの表現方法:') )
			.append( $('<label>')
				.append( $('<input>')
					.attr({
						"name":mod.name+':cell_renderer' ,
						"type":"radio",
						"value":"html"
					})
				)
				.append( $('<span>').text('HTML') )
			)
			.append( $('<label>')
				.append( $('<input>')
					.attr({
						"name":mod.name+':cell_renderer' ,
						"type":"radio",
						"value":"text"
					})
				)
				.append( $('<span>').text('テキスト') )
			)
			.append( $('<label>')
				.append( $('<input>')
					.attr({
						"name":mod.name+':cell_renderer' ,
						"type":"radio",
						"value":"markdown"
					})
				)
				.append( $('<span>').text('Markdown') )
			)
		);
		rtn.find('input[name="'+mod.name+':cell_renderer"][value="'+data.cell_renderer+'"]').attr({'checked':'checked'});

		$(elm).html(rtn);
		setTimeout(function(){ callback(); }, 0);
		return;
	}

	/**
	 * データを複製する
	 */
	this.duplicateData = function( data, callback ){
		data = JSON.parse( JSON.stringify( data ) );
		data.resKey = _resMgr.duplicateResource( data.resKey );
		callback(data);
		return;
	}

	/**
	 * エディタUIで編集した内容を保存
	 */
	this.saveEditorContent = function( elm, data, mod, callback ){
		var resInfo,
			realpathSelected;
		var $dom = $(elm);
		if( typeof(data) !== typeof({}) ){
			data = {};
		}
		if( typeof(data.resKey) !== typeof('') ){
			data.resKey = '';
		}

		it79.fnc(
			data,
			[
				function(it1, data){
					data.header_row = $dom.find('input[name="'+mod.name+':header_row"]').val();
					data.header_col = $dom.find('input[name="'+mod.name+':header_col"]').val();
					data.cell_renderer = $dom.find('input[name="'+mod.name+':cell_renderer"]:checked').val();
					data.renderer = $dom.find('input[name="'+mod.name+':renderer"]:checked').val();
					it1.next(data);
				} ,
				function(it1, data){
					// console.log('saving image field data.');
					_resMgr.getResource(data.resKey, function(result){
						// console.log(result);
						if( result === false ){
							_resMgr.addResource(function(newResKey){
								data.resKey = newResKey;
								// console.log(data.resKey);
								it1.next(data);
							});
							return;
						}
						it1.next(data);
					});
				} ,
				function(it1, data){
					// console.log('getResource() finaly');
					// console.log(data);
					_resMgr.getResource(data.resKey, function(res){
						resInfo = res;
						// console.log(resInfo);
						it1.next(data);
					});
					return;
				} ,
				function(it1, data){
					realpathSelected = $dom.find('input[type=file]').val();
					// console.log(realpathSelected);
					if( realpathSelected ){
						resInfo.ext = $dom.find('div[data-excel-info]').attr('data-extension');
						resInfo.type = $dom.find('div[data-excel-info]').attr('data-mime-type');
						resInfo.size = $dom.find('div[data-excel-info]').attr('data-size');
						resInfo.base64 = $dom.find('div[data-excel-info]').attr('data-base64');

						resInfo.isPrivateMaterial = true;
							// リソースファイルの設置は resourceMgr が行っている。
							// isPrivateMaterial が true の場合、公開領域への設置は行われない。

						// console.log(resInfo);
						_resMgr.updateResource( data.resKey, resInfo, function(){
							// var res = _resMgr.getResource( data.resKey );
							it1.next(data);
						} );
						return ;
					}
					it1.next(data);
					return ;
				} ,
				function(it1, data){
					// var realpath = _resMgr.getResourceOriginalRealpath( data.resKey );
					// if( !px.utils.isFile(realpath) ){
					// 	realpath = res.realpath;
					// }
					// if( !px.utils.isFile(realpath) ){
					// 	realpath = realpathSelected;
					// }
					//
					// var cmd = px.cmd('php');
					// cmd += ' '+px.path.resolve( _pj.get('path') + '/' + _pj.get('entry_script') );
					// cmd += ' "/?PX=px2dthelper.convert_table_excel2html';
					// cmd += '&path=' + px.php.urlencode(realpath);
					// cmd += '&header_row=' + px.php.urlencode( data.header_row );
					// cmd += '&header_col=' + px.php.urlencode( data.header_col );
					// cmd += '&cell_renderer=' + px.php.urlencode( data.cell_renderer );
					// cmd += '&renderer=' + px.php.urlencode( data.renderer );
					// cmd += '"';
					// data.output = px.execSync( cmd );
					// data.output = JSON.parse(data.output+'');
					it1.next(data);
				} ,
				function(it1, data){
					// console.log(data);
					callback(data);
					it1.next(data);
				}
			]
		);

		return;
	}// this.saveEditorContent()

}
