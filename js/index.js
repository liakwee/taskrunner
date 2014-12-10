var Main = function () {
  //global
  var projectPath = '';
  var taskProcess = '';
  var path = require('path');
  var gui = require('nw.gui');
  var win = gui.Window.get();
  var fs = require('fs');
  var childProcess = require('child_process');
  var gulp = require('gulp');
  var dexec = require( 'deferred-exec' );
  var _ = require('lodash');
  var notifier = require('node-notifier');



  function getDir(evt) {
    var theFiles = evt.target.files;


    for (var i = 0, file; file = theFiles[i]; i++) {
      projectPath = file.path;
      //document.write(projectPath);
    }

    $('.status').html(projectPath);

    fs.readdir(projectPath, function (err, files) {
      console.log(files);
      for (i in files) {
        if (files[i] === 'gulpfile.js') {
          //alert('gulpfile found!');
          console.log('projectPath:', projectPath);
          getGulpTasks();
        }
      }
    });
  };

  function getGulpTasks() {
    var gulpPath,
        execFile = require('child_process').execFile;

    process.chdir(projectPath);
    gulpPath = path.join(path.resolve(), 'node_modules', 'gulp', 'bin', 'gulp.js');

    console.log('gulpPath:', gulpPath);

    execFile(gulpPath, ['--tasks-simple'], function (err, stdout) {
      if (err) {
        console.log(err);
      } else {
        console.log( stdout );
        var tasks = stdout.trim().split('\n'),
          html = '';

        tasks = _.pull(tasks, 'default');
        tasks.unshift('default');

        for (var i = 0; i < tasks.length; i++) {
          html += '<a href="javascript:;" class="collection-item" id="' + tasks[i] + '">' + tasks[i] + '</a>';
        }
        $('.collection').find('span.notfound').addClass('is-hidden');
        $('.collection').append(html);


        $('.collection').find('a').each(function () {
          $(this).on('click', function () {
            executeTasks($(this).attr('id'));
          });
        });

        $('a#stop').removeClass('disabled');
        $('a#stop').on('click', function(){
          taskProcess.kill();
          //$('a#stop').addClass('disabled');
        })
      }
    });
  };


  function executeTasks(name) {
    console.log('id:', name);
    taskProcess = childProcess.spawn('gulp', [name], function (error, stdout, stderr) {
      if(error){
        notifier.notify({
          'title': 'Task '+name+' Error!',
          'message': error
        });
      }

      if(stderr){
        notifier.notify({
          'title': 'Task '+name+' Error!',
          'message': stderr
        });
      }

      $('a#stop').removeClass('disabled');
      outputTerminal(stdout);
    });

    taskProcess.stdout.on('data', function (data) {
      console.log('stdout: ' + data);
      outputTerminal(data);
    });

    taskProcess.stdout.on('end', function () {
      console.log('exec done');
      notifier.notify({
        'title': 'Task Done!',
        'message': 'Task '+name+' Done!'
      });
    });

    taskProcess.on('close', function (code, signal) {
      console.log('child process terminated due to receipt of signal '+signal);
      outputTerminal('child process terminated due to receipt of signal '+signal);
    });
  };

  function outputTerminal(text){
    var textarea = document.getElementById('output');
    textarea.scrollTop = textarea.scrollHeight;
    textarea.value += text;
  };

  function init() {
    var project_path = '';
    // fix the $PATH on OS X
// OS X doesn't read .bashrc/.zshrc for GUI apps
    if (process.platform === 'darwin') {
      process.env.PATH += ':/usr/local/bin';
      process.env.PATH += ':' + process.env.HOME + '/.nodebrew/current/bin';
    }

    $('#open-proj').on('click', function(){
      $('#browse').click();
    });

  };

  var exports = {
    init: init,
    getDir: getDir
  };

  return exports;
}();

$(document).ready(function(){
  Main.init();
})


