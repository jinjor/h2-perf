var childProcess = require('child_process');
var fs = require('fs');

for (var i = 2; i <= 60; i++) {
  childProcess.exec('cp public/js/1.js public/js/' + i + '.js');
}

var str = '';
for (var i = 1; i <= 60; i++) {
  str += fs.readFileSync('public/js/' + i + '.js');
}

fs.writeFileSync('public/js/all.js', str);