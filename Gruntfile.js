module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jscs: {
      src: '**/*.js',
      options: {
        config: '.jscsrc',
        verbose: true,
        fix: true,
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-jscs');

  // Default task(s).
  grunt.registerTask('default', ['jscs']);

};
