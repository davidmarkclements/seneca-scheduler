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
      return this.toDate() !== this.localeData().invalidDate()
    }
  });
  return date;
}

function startsWithNumber(key) {
  return !isNaN(+key[0]);
}

module.exports = function( options ) {
  var seneca = this;
  var defaults = {
    locale: 'en_gb',
    endianness: 'L',
  };
  var jobs = [];


  var style;

  options = seneca.util.deepextend(defaults, options);

  style = styles[options.endianness];
  moment.locale(options.locale);

  seneca.add({role: name, cmd: 'register'}, function(args, done) {
    var name, task, callback, format, date, job, keys;

    if ( ('for' in args) && ('every' in args)) {
      return done(new Error('use either "for" or "every" but not both'));
    }

    if ('for' in args) {
      format = format || (typeof args.for === 'string') && style
      date = punch(moment(args.for, format));

      if (!date.isValid()) {
        return done(new Error('Unable to parse "for", is this a real date?'));
      }
    }

    if ('every' in args) {
      if (!_.isObject(args.every)) {
        return done(new Error('The "every" argument should be an object literal'));
      }

      keys = Object.keys(args.every);

      if (keys.length === 1 && keys[0] === 'cron') {
        // Cron style of scheduling a reccuring task
        args.every = args.every.cron;
      } else if (keys.some(startsWithNumber)) {
        args.every = keys.filter(startsWithNumber)
          .reduce(function (o, k) {
            o[args.every[k]] = parseFloat(k);
            return o;
          }, {});

        if ('day' in args.every) {
          args.every.date = args.every.date || args.every.day;
        }
      }
    }

    name = args.name;
    task = args.task;
    callback = args.callback;

    // Scheduling specifications
    var schedulingSpecifications = args.every;
    if ('for' in args) {
      schedulingSpecifications = date.toDate();
    }

    if (name && name !== '') {
      job = schedule.scheduleJob(
        name,
        schedulingSpecifications,
        task,
        callback
      );
    } else {
      job = schedule.scheduleJob(
        schedulingSpecifications,
        task,
        callback
      );
    }

    if (!job) {
      done(new Error('Job scheduling failed'));
      return;
    }


    // give the job an id since node-schedule
    // only assigns a name
    job.id = _.uniqueId('task-');

    //node-schedule does export the original
    //pattern, so add it here (good for testing)
    job.pattern = _.pick(args, 'for', 'every');

    seneca.log.debug('Scheduled job: ' + JSON.stringify(job));

    jobs[job.id] = job;
    done(null, { job: job });
  });


  seneca.add({role: name, cmd: 'update'},function( args, done ){
    //TODO
  });

  seneca.add({role: name, cmd: 'retrieve'}, function(args, done) {
    var job = jobs[args.id];
    if (!job) { done(new Error('Task not found!')); }
    done(null, { job: job });
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
      }, function (err, res) {
        var task = res.job;
        if (err) { return next(err); }

        if (!task.cancel()) {
          return next(new Error('Unable to cancel task'));
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
    var list = _.map(_.values(jobs), 'id');
    seneca.act({role: name, cmd: 'remove', ids: list}, done);
  });

  seneca.add({role: name, cmd: 'list'}, function(args, done) {
    var list = _.map(_.values(jobs), 'id');
    done(null, { list : list })
  });


  return {
    name:name
  }
}
