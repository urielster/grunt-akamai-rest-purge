/*
 * grunt-akamai-rest-purge
 * https://github.com/hereandnow/grunt-akamai-rest-purge
 *
 * Copyright (c) 2014 Bastian Behrens
 * Licensed under the MIT license.
 */

'use strict';

var request = require('request');

var formatResponse = function (response) {
  if (response.body){
    return response.body.detail +
      ' - about ' +
      response.body.estimatedSeconds +
      ' seconds are needed to complete the purge request!'
  }
  return "";
};

var formatCheckStatusResponse = function(response){
  if (response.body && response.body.progressUri){
    var statusUrl = "https://api.ccu.akamai.com"+response.body.progressUri;
    return "Check Status: "+  statusUrl ;
  }
  return "";
};
module.exports = function(grunt) {

  grunt.registerMultiTask('akamai_rest_purge', 'Purging Akamai via their Rest Interface', function() {

    var done = this.async();
    var data = this.data;
    var matchers  = (data.fileMatch) ||  null ;

    var urls = data.urls || getFoldersFileNames(matchers);

    var options = this.options({
      method: 'post',
      url: 'https://api.ccu.akamai.com/ccu/v2/queues/default'
    });

    options.json = grunt.util._.pick(options, [
      'type',
      'action',
      'domain'
    ]);

    options.json.objects = urls;
    if (!urls || (urls instanceof Array && urls.length < 1) ){
      return grunt.log.errorlns("No files found or matched");
    }
    request(options, function (err, response) {
      if (err) {
        return grunt.log.errorlns(err.message);
      }
      if (response.statusCode !== 201) {
        return grunt.log.errorlns(response.body.detail || response.body);
      }
      grunt.log.ok(formatResponse(response));
      grunt.log.ok(formatCheckStatusResponse(response));



      done();
    });
  });




  /**
   * Let it search fs and get the list of files to invalidate
   * @param fileMatch
   * @returns {Array}
   */
  var getFoldersFileNames = function(fileMatch){

    var resultUrls = [];

    if (fileMatch && fileMatch !== null && fileMatch.pattern && fileMatch.dest){
      var options = fileMatch.options;
      options.rename = function(dest, matchedSrcPath, options) {
        return (dest +  matchedSrcPath); //instead of using path which is for real paths in fs
      };

      var map = grunt.file.expandMapping(fileMatch.pattern, fileMatch.dest,fileMatch.options );
      map.forEach(function(url){
        resultUrls.push(url.dest);
      });
    }
    return resultUrls;

  }

};
