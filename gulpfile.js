let gulp = require('gulp');
let webpack = require('webpack');
let webpackStream = require('webpack-stream');
let sass = require('gulp-sass');//CSSコンパイラ
let autoprefixer = require("gulp-autoprefixer");//CSSにベンダープレフィックスを付与してくれる
let minifyCss = require('gulp-minify-css');//CSSファイルの圧縮ツール
let plumber = require("gulp-plumber");//コンパイルエラーが起きても watch を抜けないようになる
let rename = require("gulp-rename");//ファイル名の置き換えを行う
let packageJson = require(__dirname+'/package.json');



// broccoli.js (frontend) を処理
gulp.task("broccoli-html-editor", function() {
	return gulp.src(["node_modules/broccoli-html-editor/client/dist/*"])
		.pipe(gulp.dest( './tests/testdata/htdocs/libs/' ))
	;
});


// src 中の *.css.scss を処理
gulp.task('.css.scss', function(){
	return gulp.src("src/**/*.css.scss")
		.pipe(plumber())
		.pipe(sass({
			"sourceComments": false
		}))
		.pipe(autoprefixer())
		.pipe(rename({
			extname: '',
		}))
		.pipe(minifyCss({compatibility: 'ie8'}))
		.pipe(rename({
			extname: '.css'
		}))
		.pipe(gulp.dest( './dist/' ))
		.pipe(gulp.dest( './tests/testdata/htdocs/libs/' ))
	;
});

// broccoli-field-table.js (frontend) を処理
gulp.task("broccoli-field-table.js", function() {
	return webpackStream({
		mode: 'production',
		entry: "./src/broccoli-field-table.js",
		devtool: 'source-map',
		output: {
			filename: "broccoli-field-table.js"
		},
		module:{
			rules:[
				{
					test: /\.twig$/,
					use: ['twig-loader']
				},
				{
					test:/\.html$/,
					use:['html-loader']
				}
			]
		},
		externals: {
			fs: 'commonjs fs',
		},
	}, webpack)
		.pipe(plumber())
		.pipe(gulp.dest( './dist/' ))
		.pipe(gulp.dest( './tests/testdata/htdocs/libs/' ))
	;
});


// test/main.js を処理
gulp.task("test/main.js", function() {
	return webpackStream({
		mode: 'production',
		entry: "./tests/testdata/htdocs/index_files/main.src.js",
		devtool: 'source-map',
		output: {
			filename: "main.js"
		},
		module:{
			rules:[
				{
					test: /\.twig$/,
					use: ['twig-loader']
				},
				{
					test:/\.html$/,
					use:['html-loader']
				}
			]
		}
	}, webpack)
		.pipe(plumber())
		.pipe(gulp.dest( './tests/testdata/htdocs/index_files/' ))
	;
});



let _tasks =  gulp.parallel(
	'broccoli-field-table.js',
	'broccoli-html-editor',
	'.css.scss',
	'test/main.js'
);

// src 中のすべての拡張子を監視して処理
gulp.task("watch", function() {
	return gulp.watch(
		[
			"src/**/*",
			"libs/**/*",
			"tests/testdata/htdocs/index_files/main.src.js",
		],
		_tasks
	);
});

// src 中のすべての拡張子を処理(default)
gulp.task("default", _tasks);
