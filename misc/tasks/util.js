var glob = require("glob"),
    fs = require('fs'),
    vfs = require('vinyl-fs'),
    spawnSync = require('child_process').spawnSync;

exports.formateDate = function () {
    var d = new Date(),
        year = d.getFullYear(),
        month = d.getMonth()+1,
        day = d.getDate();
    return year + '-' + addZero(month) + '-' + addZero(day);
};
function addZero(num){
    return (num>9?'':'0')+num;
}
exports.matchFile =  function (blobstr,options) {
    return glob.sync(blobstr, options);
};
exports.isExists = fs.existsSync;
exports.readDir = fs.readdirSync;
exports.readFile = function (filePath) {
    if(fs.existsSync(filePath)){
        return fs.readFileSync(filePath,'utf-8').toString();
    }
    return '';
};
exports.writeFile = function (filePath,data) {
    return fs.writeFileSync(filePath,data,'utf-8');
};
exports.formatCode = function (col,code){
    col = col.toLowerCase();
    code = code.toLowerCase();
    var code_reg = /<code>(\w+)<\/code>/,
        match,result='';
    if(col === 'type'){
        code.split('|').forEach(function (type) {
            type = type.trim();
            if(type){
                match = type.match(code_reg);
                if(match && match[1]){
                    result += '<label class="label label-default label-'+match[1]+'">'+match[1]+'</label>&nbsp;';
                }else{
                    result += '<label class="label label-default label-'+type+'">'+type+'</label>&nbsp;';
                }
            }
        });
        return result;
    }
    return code;
};
exports.mkdir = fs.mkdirSync;
exports.createModuleFiles = function (module) {
    var modulePath = process.cwd()+'/src/'+module,template;
    if(exports.isExists(modulePath)){
        exports.log('[INFO]:'+module+' exists\n');
        return;
    }
    var data = {
        module:module,
        humpModule:module[0].toUpperCase()+module.slice(1),
        dashModule:module.replace(/[A-Z]/g,function(m){return '-'+m.toLowerCase()}),
        date:exports.formateDate()
    };
    exports.mkdir(modulePath);
    template = exports.readFile(__dirname+'/module.js.tpl');
    exports.writeFile(modulePath+'/'+module+'.js',replaceTemplate(template));
    exports.mkdir(modulePath+'/docs');
    template = exports.readFile(__dirname+'/docs-index.html.tpl');
    exports.writeFile(modulePath+'/docs/index.html',replaceTemplate(template));
    template = exports.readFile(__dirname+'/docs-script.js.tpl');
    exports.writeFile(modulePath+'/docs/script.js',replaceTemplate(template));
    template = exports.readFile(__dirname+'/docs-readme.md.tpl');
    exports.writeFile(modulePath+'/docs/readme.md',replaceTemplate(template));
    exports.mkdir(modulePath+'/templates');
    exports.writeFile(modulePath+'/templates/'+module+'.html','<div></div>');
    exports.mkdir(modulePath+'/test');
    template = exports.readFile(__dirname+'/test.js.tpl');
    exports.writeFile(modulePath+'/test/'+module+'.spec.js',replaceTemplate(template));
    function replaceTemplate(template){
        var reg = /<%([^%>]+)%>/g;
        return template.replace(reg, function (m,$1) {
            return data[$1.trim()];
        });
    }
};

exports.deploy = function () {
    if(hasPagesBranch()){
        spawnSync('git',['branch','-D','gh-pages']);
    }
    spawnSync('git', ['checkout','--orphan','gh-pages']);
    vfs.src('dist/docs/**/*')
        .pipe(vfs.dest('.'))
        .on('end',function(){
            var msg = formatCommitMsg();
            spawnSync('git', ['rm','-rf','.']);
            spawnSync('git', ['add','.']);
            spawnSync('git', ['commit','-m',msg]);
            //spawnSync('git', ['push','--force','origin','gh-pages']);
            //console.log(msg);
            //spawnSync('git', ['checkout','master']);
            //spawnSync('git',['branch','-D','gh-pages']);
        });

    function hasPagesBranch(){
        var branchs = spawnSync('git',['branch']).stdout.toString().split('\n');
        var reg = /\bgh\-pages$/;
        return branchs.some(function(branch){
            return branch && reg.test(branch);
        });
    }
    function formatCommitMsg(){
        var d = new Date(),
            year = d.getFullYear(),
            month = d.getMonth()+1,
            day = d.getDate(),
            hour = d.getHours(),
            min = d.getMinutes(),
            seconds = d.getSeconds();
        return 'Site updated: '+year + '-' + addZero(month) + '-' + addZero(day)+' '+
            addZero(hour)+':'+addZero(min)+':'+addZero(seconds);
    }
};
exports.log = function(msg) {
    process.stdout.write(msg+'\n');
};