module.exports = function(broccoli){
	// if( process ){
	// 	delete(require.cache[require('path').resolve(__filename)]);
	// }

	var $ = require('jquery');
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
		// setTimeout(function(){
			callback(rtn);
		// }, 0);
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
	 * エディタUIを生成 (Client Side)
	 */
	this.mkEditor = function( mod, data, elm, callback ){
		var _this = this;
		var rtn = $('<div>');
		if( typeof(data) !== typeof({}) ){ data = {}; }
		if( typeof(data.resKey) !== typeof('') ){
			data.resKey = '';
		}
		// if( typeof(data.original) !== typeof({}) ){ data.original = {}; }
		var res = _resMgr.getResource( data.resKey );

		var appMode = broccoli.getAppMode();
		var $excel = $('<div data-excel-info>');
		rtn.append( $excel );
		// console.log(data);

		if( data.resKey ){

			if( appMode == 'desktop' ){
				// desktop版
				$excel.html('')
					.append( $('<button type="button" class="btn btn-default">Excelで編集する</button>')
						.attr({
							'data-excel-resKey': data.resKey
						})
						.click(function(){
							var resKey = $(this).attr('data-excel-resKey');
							_this.callGpi(
								{
									'api': 'openOuternalEditor',
									'data': {
										'resKey': resKey
									}
								} ,
								function(output){
									if(!output.result){
										alert('失敗しました。'+"\n"+output.message);
									}
									return;
								}
							);
						})
					)
				;

			}else{
				// Web版
				$excel.html('')
					.append( $('<button type="button" class="btn btn-default">ダウンロードする</button>')
						.attr({
							'data-excel-resKey': data.resKey
						})
						.click(function(){
							var resKey = $(this).attr('data-excel-resKey');
							_this.callGpi(
								{
									'api': 'getBase64',
									'data': {
										'resKey': resKey
									}
								} ,
								function(base64){
									// console.log(base64);
									var dataUri = 'data:application/octet-stream;base64,'+base64;
									// console.log(dataUri);
									window.location.href = dataUri;
									return;
								}
							);
						})
					)
				;
			}
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
	this.duplicateData = function( data, callback, resources ){
		data = JSON.parse( JSON.stringify( data ) );
		it79.fnc(
			data,
			[
				function(it1, data){
					_resMgr.addResource( function(newResKey){
						_resMgr.updateResource( newResKey, resources[data.resKey], function(result){
							// console.log(newResKey);
							data.resKey = newResKey;
							it1.next(data);
						} );
					} );
				} ,
				function(it1, data){
					callback(data);
					it1.next(data);
				}
			]
		);
		return;
	}

	/**
	 * データから使用するリソースのリソースIDを抽出する (Client Side)
	 */
	this.extractResourceId = function( data, callback ){
		callback = callback||function(){};
		resourceIdList = [];
		resourceIdList.push(data.resKey);
		callback(resourceIdList);
		return this;
	}

	/**
	 * エディタUIで編集した内容を保存
	 */
	this.saveEditorContent = function( elm, data, mod, callback ){
		var _this = this;
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
						// Excelファイルが選択された場合、
						// 選択されたファイルの情報を resourceMgr に登録する。
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
					}else{
						// Excelファイルが選択されていない場合、
						// 過去に登録済みの bin.xlsx が変更されている可能性があるので、
						// bin2base64 でJSONを更新しておく。
						_resMgr.resetBase64FromBin( data.resKey, function(){
							it1.next(data);
						} );
						return ;
					}
					it1.next(data);
					return ;
				} ,
				// function(it1, data){
				// 	// ☓ここで一旦保存しないと、古いデータで変換してしまう。
				// 	// ○ここで一旦保存しちゃうと、addResource() した新しいデータが削除されてしまう。
				// 	_resMgr.save( function(){
				// 		// var res = _resMgr.getResource( data.resKey );
				// 		it1.next(data);
				// 	} );
				// } ,
				function(it1, data){
					_this.callGpi(
						{
							'api': 'excel2html',
							'data': data
						} ,
						function(output){
							data.output = output;
							if(!php.is_string(data.output)){
								data.output = '';
							}
							it1.next(data);
							return;
						}
					);
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

	/**
	 * GPI (Server Side)
	 */
	this.gpi = function(options, callback){
		callback = callback || function(){};
		var nodePhpBin = require('node-php-bin').get();

		switch(options.api){
			case 'openOuternalEditor':
				it79.fnc(
					options.data,
					[
						function(it1, data){
							var appMode = broccoli.getAppMode();
							// console.log(appMode);
							if( appMode != 'desktop' ){
								var message = 'appModeが不正です。';
								// console.log( message );
								callback({'result':false, 'message': message});
								return;
							}
							it1.next(data);
						} ,
						function(it1, data){
							_resMgr.getResourceOriginalRealpath( data.resKey, function(realpath){
								// console.log(realpath);
								data.realpath = realpath;
								it1.next(data);
							} );
						} ,
						function(it1, data){
							var desktopUtils = require('desktop-utils');
							desktopUtils.open( data.realpath );
							it1.next(data);
						} ,
						function(it1, data){
							callback({'result':true});
							it1.next(data);
						}
					]
				);
				break;

			case 'getBase64':
				_resMgr.getResource( options.data.resKey, function(resInfo){
					// console.log(resInfo.base64);
					callback(resInfo.base64);
				} );
				break;

			case 'excel2html':
				it79.fnc(
					options.data,
					[
						function(it1, data){
							_resMgr.getResourceOriginalRealpath( data.resKey, function(realpath){
								// console.log(realpath);
								data.realpath = realpath;
								it1.next(data);
							} );
						} ,
						function(it1, data){

							var eventEndFlg = {};
							var timeout = {};
							var doneFlg = false;
							function receiveCallBack(output, eventName){
								// node-webkit で、なぜか childProc.spawn の、
								// stdout.on('data') より先に on('exit') が呼ばれてしまうことがある。
								// 原因は不明。
								// 下記は、complete と success の両方が呼ばれるまで待つようにする処理。
								eventEndFlg[eventName] = true;
								clearTimeout(timeout);
								if(doneFlg){
									return;//もう行っちゃいました。
								}
								if( eventName == 'complete' && (eventEndFlg['success'] || eventEndFlg['error']) ){
									// complete が呼ばれる前に success または error が呼ばれていた場合
									data.output = output;
									it1.next(data);
									return;
								}
								if( eventEndFlg['complete'] && (eventName == 'success' || eventName == 'error') ){
									// complete が既に呼ばれている状態で、success または error が呼ばれた場合
									data.output = output;
									it1.next(data);
									return;
								}
								timeout = setTimeout(function(){
									doneFlg = true;
									data.output = output;
									it1.next(data);
								}, 3000); // 3秒待っても呼ばれなかったら先へ進む
							}

							nodePhpBin.script(
								[
									__dirname+'/php/excel2html.php',
									'--path', data.realpath ,
									'--header_row', data.header_row,
									'--header_col', data.header_col,
									'--cell_renderer', data.cell_renderer,
									'--renderer', data.renderer
								],
								{
									"success": function(output){
										// console.log(output);
										receiveCallBack(output, 'success');
									} ,
									"error": function(error){
										console.error('"excel2html.php" convert ERROR');
										console.error('see error message below:', error);
										receiveCallBack(error, 'error');
									} ,
									"complete": function(output, error, code){
										if( error || code ){
											console.error('"excel2html.php" convert ERROR (code:'+code+')');
											console.error('see error message below:', output);
											var errorMsg = output;
											output = '';
											output += '<tr><th>"excel2html.php" convert ERROR (code:'+code+')</th></tr>';
											output += '<tr><td>see error message below:</td></tr>';
											output += '<tr><td>'+error+'</td></tr>';
											output += '<tr><td>'+errorMsg+'</td></tr>';
										}
										receiveCallBack(output, 'complete');
									}
								}
							);

						} ,
						function(it1, data){
							callback(data.output);
							it1.next(data);
						}
					]
				);
				break;

			default:
				callback('ERROR: Unknown API');
				break;
		}

		return this;
	}

}
