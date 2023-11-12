# broccoli-field-table

_broccoli-field-table_ は、 _broccoli-html-editor_ に カスタムフィールド "tableフィールド" を追加する拡張パッケージです。

## インストール - Install

```
$ npm install broccoli-html-editor --save
$ npm install broccoli-field-table --save
```

※ 設定手順はTBD


## 更新履歴 - Change log

### broccoli-field-table v0.4.1 (2023年11月13日)

- ダークモードに対応した。

### broccoli-field-table v0.4.0 (2022年12月29日)

- デフォルトがHTML編集モードに変更され、Excel編集モードへ移行できるようになった。
- データ構造を変更: `data.output` を `data.src` に改名した。 (ただし後方互換性維持のため、`data.output` にも配慮する)
- HTML編集モードでビジュアル編集がサポートされるようになった。
- 内部コードの構成を変更。
- 一部の英語化に関する修正。

### broccoli-field-table v0.3.0 (2022年1月3日)

- HTMLでの直接編集モードに切り替える機能を追加。
- その他、ライブラリの更新と内部コードの修正など。

### broccoli-field-table v0.2.4 (2021年4月23日)

- 内部コードの細かい修正。

### broccoli-field-table v0.2.3 (2020年12月10日)

- データに `output` が含まれていない場合にエラーが起きる不具合を修正。
- ウェブモードで、登録済みのエクセルファイルをダウンロードできない不具合を修正。

### broccoli-field-table v0.2.2 (2020年6月21日)

- 外部依存パッケージのバージョンを更新。

### broccoli-field-table v0.1.1 (2020年5月19日)

- NodeJS版: 外部依存パッケージのバージョンを更新。

### broccoli-field-table v0.2.1 (2020年4月4日)

- 外部依存パッケージのバージョンを更新。

### broccoli-field-table v0.2.0 (2018年7月27日)

- broccoli-html-editor のバックエンドPHP化に対応した。

### broccoli-field-table v0.1.0 (2018年6月15日)

- オプション付きの呼び出し方法を追加。phpのバイナリのパスを設定できるようになった。
- CSVファイルの変換時に文字化けすることがある問題を修正

### broccoli-field-table v0.1.0-beta.2 (2016年4月15日)

- broccoli-html-editor のウェブモードに対応。ウェブモードの場合に、アップ済みファイルを直接開かずダウンロードさせるようになった。
- 特定の環境下で、変換後のHTMLソースを受け取れないことがある問題を修正

### broccoli-field-table v0.1.0-beta.1 (2016年3月24日)

- 初回リリース。

## ライセンス - License

MIT License


## 作者 - Author

- Tomoya Koyanagi <tomk79@gmail.com>
- website: <https://www.pxt.jp/>
- Twitter: @tomk79 <https://twitter.com/tomk79/>
