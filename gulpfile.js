let gulp = require('gulp');
let sass = require('gulp-sass');//CSSコンパイラ
let autoprefixer = require("gulp-autoprefixer");//CSSにベンダープレフィックスを付与してくれる
let minifyCss = require('gulp-minify-css');//CSSファイルの圧縮ツール
let uglify = require("gulp-uglify");//JavaScriptファイルの圧縮ツール
let concat = require('gulp-concat');//ファイルの結合ツール
let plumber = require("gulp-plumber");//コンパイルエラーが起きても watch を抜けないようになる
let rename = require("gulp-rename");//ファイル名の置き換えを行う
let twig = require("gulp-twig");//Twigテンプレートエンジン
let browserify = require("gulp-browserify");//NodeJSのコードをブラウザ向けコードに変換
let packageJson = require(__dirname+'/package.json');



// broccoli.js (frontend) を処理
gulp.task("broccoli-html-editor", function() {
	return gulp.src(["node_modules/broccoli-html-editor/client/dist/*"])
		.pipe(gulp.dest( './tests/testdata/htdocs/libs/' ))
	;
});


// broccoli-field-table.js (frontend) を処理
gulp.task("broccoli-field-table.js", function() {
	return gulp.src(["src/broccoli-field-table.js"])
		.pipe(plumber())
		.pipe(browserify({}))
		.pipe(concat('broccoli-field-table.js'))
		.pipe(gulp.dest( './dist/' ))
		.pipe(gulp.dest( './tests/testdata/htdocs/libs/' ))
		.pipe(concat('broccoli-field-table.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest( './dist/' ))
		.pipe(gulp.dest( './tests/testdata/htdocs/libs/' ))
	;
});


// test/main.js を処理
gulp.task("test/main.js", function() {
	return gulp.src(["tests/testdata/htdocs/index_files/main.src.js"])
		.pipe(plumber())
		.pipe(browserify({}))
		.pipe(concat('main.js'))
		.pipe(gulp.dest( './tests/testdata/htdocs/index_files/' ))
	;
});



let _tasks =  gulp.parallel(
	'broccoli-field-table.js',
	'broccoli-html-editor',
	'test/main.js'
);

// src 中のすべての拡張子を監視して処理
gulp.task("watch", function() {
	var svrCtrl = require( './tests/biflora/serverCtrl.js' );
	svrCtrl.boot(function(){
		require('child_process').spawn('open',[svrCtrl.getUrl()]);
	});

	return gulp.watch(["src/**/*","libs/**/*","tests/testdata/htdocs/index_files/main.src.js"], _tasks);
});

// src 中のすべての拡張子を処理(default)
gulp.task("default", _tasks);
