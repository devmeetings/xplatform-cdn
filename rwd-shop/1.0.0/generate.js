var glob = require('glob');
var path = require('path');
var Q = require('q');

var im = require('imagemagick');

var cwd = 'src';
var assets = 'assets';

var baseUrl = 'https://local.xplatform.org/cdn/rwd-shop/1.0.0/';

var htmlStart = ['<html><head><title>Assets</title>',
'<link rel="stylesheet" href="styles.css">',
'</head><body><div class="container">'].join('\n');
var htmlEnd = '</div></body></html>';

var buildAsset = function (asset) {
  return [
    '<div class="asset">',
    '<h3>' + asset.name + '</h3>',
    '<img src="' + asset.path + '">',
    '<label>1x</label>',
    '<input type="text" readonly value="' + asset.url + '">',
    '<label>2x</label>',
    '<input type="text" readonly value="' + asset.url2x + '">',
    '</div>'
  ].join('\n');
};

glob(path.join(cwd, '*.jpg'), function (err, files) {
  if (err) {
    throw err;
  }
  console.log(htmlStart);
  Q.all(
    files.map(function (file) {
      var ext = path.extname(file);
      var name = path.basename(file, ext);

      var baseFileName = path.join(assets, name + ext);
      var baseFileName2x = path.join(assets, name + '_2x' + ext);

      return Q.ninvoke(im, 'convert', [file, '-quality', '90', 'resize', '800x', file]).then(function () {
        return Q.all([
          Q.ninvoke(im, 'convert', [file, '-quality', '90', '-resize', '250x', baseFileName]),
          Q.ninvoke(im, 'convert', [file, '-quality', '90', '-resize', '500x', baseFileName2x])
        ]).then(function (all) {
          return {
            name: name,
            path: baseFileName,
            url: baseUrl + baseFileName,
            url2x: baseUrl + baseFileName2x
          };
        });
      });
    })
  ).done(function (assets) {
    assets.map(function (asset) {
      console.log(buildAsset(asset));
    });
    console.log(htmlEnd);
  });

});
