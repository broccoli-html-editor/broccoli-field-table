window.BroccoliFieldTable = function(broccoli){

	var $ = require('jquery');
	var it79 = require('iterate79');
	var php = require('phpjs');
	var _resMgr = broccoli.resourceMgr;

	/**
	 * パスから拡張子を取り出して返す
	 */
	function getExtension(path){
		var ext = path.replace( new RegExp('^.*?\.([a-zA-Z0-9\_\-]+)$'), '$1' );
		ext = ext.toLowerCase();
		return ext;
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
				"renderer":'simplify',
			};
		}
		return rtn;
	}

	/**
	 * エディタUIを生成 (Client Side)
	 */
	this.mkEditor = function( mod, data, elm, callback ){
		var Editor = require('./editor/editor.js');
		var editor = new Editor(broccoli, this, mod, data, elm);
		editor.init( callback );
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
					data.header_row = $dom.find('input[name="'+mod.name+'__header_row"]').val();
					data.header_col = $dom.find('input[name="'+mod.name+'__header_col"]').val();
					data.cell_renderer = $dom.find('input[name="'+mod.name+'__cell_renderer"]:checked').val();
					data.renderer = $dom.find('input[name="'+mod.name+'__renderer"]:checked').val();
					it1.next(data);
				} ,
				function(it1, data){
					_resMgr.getResource(data.resKey, function(result){
						if( result === false ){
							_resMgr.addResource(function(newResKey){
								data.resKey = newResKey;
								it1.next(data);
							});
							return;
						}
						it1.next(data);
					});
				} ,
				function(it1, data){
					_resMgr.getResource(data.resKey, function(res){
						resInfo = res;
						it1.next(data);
					});
					return;
				} ,
				function(it1, data){
					realpathSelected = $dom.find('input[type=file]').val();

					if( realpathSelected ){
						// NOTE: Excelファイルが選択された場合、
						// 選択されたファイルの情報を resourceMgr に登録する。
						resInfo.ext = $dom.find('div[data-excel-info]').attr('data-extension');
						resInfo.type = $dom.find('div[data-excel-info]').attr('data-mime-type');
						resInfo.size = $dom.find('div[data-excel-info]').attr('data-size');
						resInfo.base64 = $dom.find('div[data-excel-info]').attr('data-base64');

						resInfo.isPrivateMaterial = true;
							// NOTE: リソースファイルの設置は resourceMgr が行っている。
							// isPrivateMaterial が true の場合、公開領域への設置は行われない。

						_resMgr.updateResource( data.resKey, resInfo, function(){
							it1.next(data);
						} );
						return ;
					}else{
						// NOTE: Excelファイルが選択されていない場合、
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
				// 	// NOTE:
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
					callback(data);
					it1.next(data);
				}
			]
		);

		return;
	} // this.saveEditorContent()
};
