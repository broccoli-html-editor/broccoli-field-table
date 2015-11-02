<?php
require_once(__DIR__.'/../../vendor/autoload.php');
$req = new \tomk79\request();

// var_dump($req->get_cli_options());
// var_dump($req->get_cli_option('--path'));

$path_xlsx = $req->get_cli_option('--path');
$options = array(
	'header_row' => $req->get_cli_option('--header_row') ,
	'header_col' => $req->get_cli_option('--header_col') ,
	'renderer' => $req->get_cli_option('--renderer') ,
	'cell_renderer' => $req->get_cli_option('--cell_renderer') ,
	'render_cell_width' => true ,
	'strip_table_tag' => true
);
// var_dump($path_xlsx);
// var_dump($options);
if( is_null($path_xlsx) ){
	print '<!-- ERROR: parameter path is required. -->';
	exit;
}
if( !is_file($path_xlsx) || !is_readable($path_xlsx) ){
	print '<!-- ERROR: $path_xlsx is NOT a file or NOT readable. -->';
	exit;
}

$excel2html = new \tomk79\excel2html\main($path_xlsx);
$val = @$excel2html->get_html($options);
// var_dump($val);
print $val;
exit;