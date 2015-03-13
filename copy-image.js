var childProcess = require('child_process');

var alpha = 'bcdefghij';
for (var i = 1; i <= 6; i++) {
  for (var j = 0; j < alpha.length; j++) {
    childProcess.exec('cp public/images/image' + i + 'a.png public/images/image' + i + alpha[j] + '.png');
  }
}