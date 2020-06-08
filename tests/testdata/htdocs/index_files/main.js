(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (__dirname){
(function(module){
	var initOptions = {
		'php':{}
	};

	module.exports = function(broccoli){
		// if( process ){
		// 	delete(require.cache[require('path').resolve(__filename)]);
		// }
		// console.log(options);

		var it79 = require('iterate79');
		var _resMgr = broccoli.resourceMgr;
		// var _pj = px.getCurrentProject();

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
		 * GPI (Server Side)
		 */
		this.gpi = function(options, callback){
			callback = callback || function(){};
			var nodePhpBin = require('./node-php-bin.js').get(initOptions.php);

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

				case 'getFileInfo':
					_resMgr.getResource( options.data.resKey, function(resInfo){
						// console.log(resInfo);
						callback(resInfo);
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

	/**
	 * オプション付きでロード
	 * @param  {Object} _initOptions オプション
	 * @return {Function}            プラグインAPI
	 */
	module.exports.get = function(_initOptions){
		initOptions = _initOptions || {};
		initOptions.php = initOptions.php || {};
		return module.exports;
	}

})(module);

}).call(this,"/../../../../libs")
},{"./node-php-bin.js":2,"desktop-utils":4,"iterate79":5}],2:[function(require,module,exports){
(function (process){
/**
 * node-php-bin clone
 *
 * 2020-05-19
 * PHPをアプリに内蔵させようとして作ったのが node-php-bin だったが、
 * 全部の依存関係を静的コンパイルできなかったため断念した。
 * このため、APIのみ複製して格納し、利用することにした。
 */
module.exports = new (function(){
	var childProcess = require('child_process');
	var fs = require('fs');
	var _platform = process.platform;

	this.get = function(options){
		var phpBin, phpVersion, phpIni, phpExtensionDir, phpPresetCmdOptions;
		function phpAgent(options){
			options = options || {};
			phpPresetCmdOptions = [];
			phpExtensionDir = null;

            phpBin = 'php';
            phpIni = null;

			if(typeof(options.bin) == typeof('')){
				phpBin = options.bin;
			}
			if(options.ini === null){
				phpPresetCmdOptions = [];// windows向けの -d オプションを削除する
				phpExtensionDir = null;// ExtensionDir も削除
				phpIni = null;// php.ini のパスも削除
			}else if(typeof(options.ini) == typeof('')){
				phpPresetCmdOptions = [];// windows向けの -d オプションを削除する
				phpExtensionDir = null;// ExtensionDir も削除
				phpIni = options.ini;
			}

			if( phpIni !== null ){
				phpPresetCmdOptions = phpPresetCmdOptions.concat([
					'-c', phpIni
				]);
			}
		}

		/**
		 * PHP のパスを取得
		 */
		phpAgent.prototype.getPath = function(){
			if(phpBin == 'php'){return phpBin;}
			return fs.realpathSync(phpBin);
		}

		/**
		 * php.ini のパスを取得
		 */
		phpAgent.prototype.getIniPath = function(){
			if(phpIni == null){return null;}
			return fs.realpathSync(phpIni);
		}

		/**
		 * phpExtensionDir を取得
		 */
		phpAgent.prototype.getExtensionDir = function(){
			if(phpExtensionDir == null){return null;}
			return fs.realpathSync(phpExtensionDir);
		}

		/**
		 * PHPのバージョン番号を得る
		 */
		phpAgent.prototype.getPhpVersion = function(cb){
			cb = cb || function(){};
			var child = this.spawn(
				['-v'],
				{}
			);
			var data = '';
			child.stdout.on('data', function(row){
				data += row.toString();
			});
			child.stderr.on('data', function(error){
				data += error.toString();
			});
			child.on('exit', function(code){
				var rtn = data;
				data.match(new RegExp('^PHP\\s+([0-9]+\\.[0-9]+\\.[0-9])'));
				rtn = RegExp.$1;
				// console.log(rtn);
				cb(rtn);
			});
			return child;
		}

		/**
		 * PHPコマンドを実行する
		 */
		phpAgent.prototype.script = function(cliParams, options, cb){
			cb = arguments[arguments.length-1];
			var scriptOptions = {};
			var cbSuccess = function(){};
			var cbError = function(){};
			if( typeof(cb) === typeof({}) ){
				scriptOptions = cb;
				cb = scriptOptions.complete || function(){};
				cbSuccess = scriptOptions.success || function(){};
				cbError = scriptOptions.error || function(){};
				// console.log(cb);
				// console.log(scriptOptions);
			}
			if( typeof(cb) !== typeof(function(){}) ){
				cb = function(){};
			}
			options = options || {};
			if(arguments.length < 2){
				options = {};
			}
			if( typeof(options) !== typeof({}) ){
				options = {};
			}

			var child = this.spawn(
				cliParams,
				options
			);
			var data = '';
			var error = '';
			child.stdout.on('data', function( row ){
				cbSuccess(row.toString());
				data += row.toString();
			});
			child.stderr.on('data', function( err ){
				cbError(err.toString());
				data += err.toString();
				error += err.toString();
			});
			child.on('exit', function(code){
				cb( data, error, code );
			});
			return child;
		}

		/**
		 * PHPコマンドを実行する(spawn)
		 */
		phpAgent.prototype.spawn = function(cliParams, options){
			cliParams = cliParams || [];
			options = options || {};
			var child = childProcess.spawn(
				phpBin,
				phpPresetCmdOptions.concat(cliParams),
				options
			);
			return child;
		}

		return new phpAgent(options);
	}

})();
}).call(this,require("r7L21G"))
},{"child_process":3,"fs":3,"r7L21G":7}],3:[function(require,module,exports){

},{}],4:[function(require,module,exports){
(function (process){
/**
 * desktop-utils
 */
module.exports = new (function(){
	var supported = false;
	var dirSeparator = '/';
	switch( process.platform ){
		case 'darwin':
			dirSeparator = '/';
			supported = true;
			break;
		case 'win32':
			dirSeparator = '\\';
			supported = true;
			break;
		default:
			supported = false;
			break;
	}


	/**
	 * デフォルトのアプリケーションでパスやURLを開く
	 * 
	 * @param string item 開くアイテムの URL や ファイル、ディレクトリのパス。
	 * MacOSXの場合は `open` へ、Windowsの場合は `explorer` へ渡されます。
	 * @return spawn
	 */
	this.open = function( item ){
		if( !supported ){ return false; }
		var spawn = require('child_process').spawn;
		var exec = require('child_process').exec;
		var fs = require('fs');

		if( item.match(new RegExp('^(?:https?|data)\\:','i')) ){
			// OS依存しないのでスルー
		}else if( fs.existsSync(item) ){
			item = fs.realpathSync(item);
		}else{
			item = require('path').resolve(item);
		}

		var cmd = 'open';
		if(process.platform == 'win32'){
			cmd = 'explorer';
			item = item.split('"').join(''); // ダブルクオートを削除
			return exec( cmd + ' "' + item + '"' );
		}
		return spawn( cmd, [item], {} );
	}

	/**
	 * 指定したアプリケーションでパスやURLを開く
	 * 
	 * @param string item 開くアイテムの URL や ファイル、ディレクトリのパス。
	 * MacOSXの場合は `open` へ、Windowsの場合は `explorer` へ渡されます。
	 * @return spawn
	 */
	this.openIn = function( app, item ){
		if( !supported ){ return false; }
		var spawn = require('child_process').spawn;
		var exec = require('child_process').exec;
		var fs = require('fs');
		var opt, cmd;

		if( item.match(new RegExp('^(?:https?|data)\\:','i')) ){
			// OS依存しないのでスルー
		}else if( fs.existsSync(item) ){
			item = fs.realpathSync(item);
		}else{
			item = require('path').resolve(item);
		}

		if(process.platform == 'darwin'){
			cmd = 'open';
			opt = [
				'-a',
				app,
				item
			];

		}else if(process.platform == 'win32'){
			item = item.split('"').join(''); // ダブルクオートを削除
			return exec( app + ' "' + item + '"' );
		}
		return spawn( cmd, opt, {} );
	}

	/**
	 * ローカルデータディレクトリのパスを取得する
	 */
	this.getLocalDataDir = function( appName ){
		if( !supported ){ return false; }
		if( !(process.env.HOME||process.env.LOCALAPPDATA) ){ return false; }
		var path = require('path');
		if(typeof(appName)==typeof(0)||typeof(appName)==typeof(1.5)){appName = ''+appName;}
		if(typeof(appName)!=typeof('')){return false;}

		appName = appName.replace(new RegExp('[^a-zA-Z0-9\\_\\-]+','g'), '');
		// appName = appName.toLowerCase();

		if(!appName.length){return false;}

		var path_data_dir = (process.env.HOME||process.env.LOCALAPPDATA) + '/.'+appName+'/';
		path_data_dir = path.resolve(path_data_dir);
		return path_data_dir;
	}

	/**
	 * サーバがUNIXパスか調べる。
	 *
	 * @return bool UNIXパスなら `true`、それ以外なら `false` を返します。
	 */
	this.isUnix = function(){
		if( dirSeparator == '/' ){
			return true;
		}
		return false;
	}//isUnix()

	/**
	 * サーバがWindowsパスか調べる。
	 *
	 * @return bool Windowsパスなら `true`、それ以外なら `false` を返します。
	 */
	this.isWindows = function(){
		if( dirSeparator == '\\' ){
			return true;
		}
		return false;
	}//isWindows()

})();

}).call(this,require("r7L21G"))
},{"child_process":3,"fs":3,"path":6,"r7L21G":7}],5:[function(require,module,exports){
/**
 * node-iterate79
 */
(function(exports){

	/**
	 * 配列の直列処理
	 */
	exports.ary = function(ary, fnc, fncComplete){
		return new (function( ary, fnc, fncComplete ){
			this.idx = -1;
			this.idxs = [];
			for( var i in ary ){
				this.idxs.push(i);
			}
			this.ary = ary||[];
			this.fnc = fnc||function(){};
			this.fncComplete = fncComplete||function(){};

			this.next = function(){
				if( this.idx+1 >= this.idxs.length ){
					this.fncComplete();
					return this;
				}
				this.idx ++;
				this.fnc( this, this.ary[this.idxs[this.idx]], this.idxs[this.idx] );
				return this;
			}
			this.next();
		})(ary, fnc, fncComplete);
	}

	/**
	 * 関数の直列処理
	 */
	exports.fnc = function(aryFuncs){
		var mode = 'explicit';
		var defaultArg = undefined;
		if( arguments.length >= 2 ){
			mode = 'implicit';
			defaultArg = arguments[0];
			aryFuncs = arguments[arguments.length-1];
		}


		function iterator( aryFuncs ){
			aryFuncs = aryFuncs||[];

			var idx = 0;
			var funcs = aryFuncs;
			var isStarted = false;//2重起動防止

			this.start = function(arg){
				if(isStarted){return this;}
				isStarted = true;
				return this.next(arg);
			}

			this.next = function(arg){
				arg = arg||{};
				if(funcs.length <= idx){return this;}
				(funcs[idx++])(this, arg);
				return this;
			};
		}
		var rtn = new iterator(aryFuncs);
		if( mode == 'implicit' ){
			return rtn.start(defaultArg);
		}
		return rtn;
	}


})(exports);

},{}],6:[function(require,module,exports){
(function (process){
// .dirname, .basename, and .extname methods are extracted from Node.js v8.11.1,
// backported and transplited with Babel, with backwards-compat fixes

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function (path) {
  if (typeof path !== 'string') path = path + '';
  if (path.length === 0) return '.';
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) {
    // return '//';
    // Backwards-compat fix:
    return '/';
  }
  return path.slice(0, end);
};

function basename(path) {
  if (typeof path !== 'string') path = path + '';

  var start = 0;
  var end = -1;
  var matchedSlash = true;
  var i;

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false;
      end = i + 1;
    }
  }

  if (end === -1) return '';
  return path.slice(start, end);
}

// Uses a mixed approach for backwards-compatibility, as ext behavior changed
// in new Node.js versions, so only basename() above is backported here
exports.basename = function (path, ext) {
  var f = basename(path);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  if (typeof path !== 'string') path = path + '';
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require("r7L21G"))
},{"r7L21G":7}],7:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],8:[function(require,module,exports){
// console.log(broccoli);

/**
 * main.js
 */
window.main = new (function(){
	var _this = this;
	var it79 = require('iterate79');
	var socket = this.socket = window.biflora
		.createSocket(
			this,
			io,
			{
				'showSocketTest': function( data, callback, main, socket ){
					// console.log(data);
					// alert(data.message);
					// console.log(callback);
					callback(data);
					return;
				}
			}
		)
	;

	// broccoli をインスタンス化
	var broccoli = new Broccoli();
	this.broccoli = window.broccoli = broccoli;

	this.init = function(callback){
		callback = callback||function(){};
		// this.socketTest();
		// broccoli を初期化
		broccoli.init(
			{
				'elmCanvas': $('.canvas').get(0),
				'elmModulePalette': $('.palette').get(0),
				'contents_area_selector': '[data-contents]',
				'contents_bowl_name_by': 'data-contents',
				'customFields': {
					'table': require('./../../../../libs/main.js')
				},
				'gpiBridge': function(api, options, callback){
					// General Purpose Interface Bridge
					socket.send(
						'broccoli',
						{
							'api': 'gpiBridge' ,
							'bridge': {
								'api': api ,
								'options': options
							}
						} ,
						function(rtn){
							// console.log(rtn);
							callback(rtn);
						}
					);
					return;
				}
			} ,
			function(){
				$(window).resize(function(){
					broccoli.redraw();
				});
				callback();
			}
		);
	}

	/**
	 * WebSocket疎通確認
	 */
	this.socketTest = function(){
		socket.send(
			'socketTest',
			{'message': 'socketTest from frontend.'} ,
			function(data){
				console.log(data);
				// alert('callback function is called!');
			}
		);
		return this;
	}

})();

},{"./../../../../libs/main.js":1,"iterate79":5}]},{},[8])