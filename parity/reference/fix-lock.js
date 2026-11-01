// Rewrites the taobao-style "resolved" URLs of an npm lockfile to real npmjs tarball URLs.
// taobao: https://registry.npm.taobao.org/<name>/download/<name>-<ver>.tgz?cache=...
// npmjs : https://registry.npmjs.org/<name>/-/<basename>-<ver>.tgz
// Usage: node fix-lock.js <package-lock.json>   (plain Node 10 compatible)
var fs = require('fs');
var file = process.argv[2];
var lock = JSON.parse(fs.readFileSync(file, 'utf8'));
var n = 0;
function fix(deps) {
  Object.keys(deps || {}).forEach(function (k) {
    var d = deps[k];
    if (d.resolved) {
      var u = d.resolved.replace('registry.npm.taobao.org', 'registry.npmjs.org').split('?')[0];
      var m = u.match(/^(https:\/\/registry\.npmjs\.org\/)(.+?)\/download\/(.+)$/);
      if (m) {
        var base = m[3].split('/').pop();
        u = m[1] + m[2] + '/-/' + base;
        n++;
      }
      d.resolved = u;
    }
    fix(d.dependencies);
  });
}
fix(lock.dependencies);
fs.writeFileSync(file, JSON.stringify(lock, null, 2) + '\n');
console.log('rewrote ' + n + ' resolved URLs');
