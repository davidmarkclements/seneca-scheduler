/* Copyright (c) 2014 David Mark Clements, MIT License */
"use strict";

var _ = require('lodash');
var schedule = require("node-schedule");
var moment = require('moment');
var styles = require('./datestyles');

var name = "scheduler";

// monkey punch moment to get around
// a validation bug
function punch(date) {
  Object.defineProperty(date, '_isValid', {
    get: function() {
      return this.toDate() !== this.lang().invalidDate()
    }
  });
  return date;
}

function startsWithNumber(key) {
  return !isNaN(+key[0]);
}

module.exports = function( options ){
  var seneca = this;
  var defaults = {
    locale: 'en_gb',
    endianness: 'L',
  };
  var jobs = {};


  var style;

  options = seneca.util.deepextend(defaults, options);

  style = styles[options.endianness];
  moment.lang(options.locale);

  seneca.add({role: name, cmd: 'register'}, function(args, done) {
    var format, date, job, keys;


    if ( ('for' in args) && ('every' in args)) {
      return done(Error('use either "for" or "every" but not both'));
    }

    if ('for' in args) {
      format = format || (typeof args.for === 'string') && style
      date = punch(moment(args.for, format));

      if (!date.isValid()) {
        return done(Error('Unable to parse "for", is this a real date?'));
      }
    }

    if ('every' in args) {
      if (!_.isObject(args.every)) {
        return done(Error('The "every" argument should be an object literal'));
      }

      keys = Object.keys(args.every);

      if (keys.some(startsWithNumber)) {
        args.every = keys.filter(startsWithNumber)
          .reduce(function (o, k) {
              o[args.every[k]] = parseFloat(k);
              return o;
          }, {});
      }

      if ('day' in args.every) {
        args.every.date = args.every.date || args.every.day;
      }
    }

    job = schedule.scheduleJob( ('for' in args) ?
      date.toDate() :
      args.every, args.task);

    if (!job) { done(Error('failed :(')); }

    //give the job an id since node-schedule
    //only assigns a name
    job.id = _.uniqueId('task-');

    //node-schedule does export the original
    //pattern, so add it here (good for testing)
    job.pattern = _.pick(args, 'for', 'every');

    jobs[job.id] = job;

    done(null, job);

  });


  seneca.add({role: name, cmd: 'update'},function( args, done ){
    //TODO
  });

  seneca.add({role: name, cmd: 'retrieve'}, function(args, done) {
    var job = jobs[args.id];
    if (!job) { done(Error('Task not found!')); }
    done(null, job)
  });

  seneca.add({role: name, cmd: 'pause'},function (args, done){
    //TODO

  });

  seneca.add({role: name, cmd: 'remove'}, function (args, done) {
    function next (err) {
      var id = next.ids.shift();
      if (err) { next.errs.push(err); }
      if (!id) {
        if (!next.ids.length) {
          return done(next.errs.length ? next.errs : null);
        }
        return;
      }
      seneca.act({
        role: name,
        cmd: 'retrieve',
        id: id
      }, function (err, task) {

        if (err) { return next(err); }

        if (!task.cancel()) {
          return next(Error('Unable to cancel task'));
        }

        delete jobs[id];

        if (!next.ids.length) {
          return done(next.errs.length ? next.errs : null);
        }

        next(null);


      })
    }


    next.errs = [];
    next.ids = _.clone(args.ids || args.id);
    next.ids = Array.isArray(next.ids) ? next.ids : [next.ids];
    next();

  });

  seneca.add({role: name, cmd: 'clear'}, function(args, done) {
    var list = _.pluck(_.values(jobs), 'id');
    seneca.act({role: name, cmd: 'remove', ids: list}, done);
  });

  seneca.add({role: name, cmd: 'list'}, function(args, done) {
    var list = _.pluck(_.values(jobs), 'id');
    done(null, list)
  });


  return {
    name:name
  }
}
