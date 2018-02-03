var seneca = require('seneca')({
  // Namespace for strict options.
  strict: {
    // Allow results to be non-Objects.
    result: false
  }
});
var moment = require('moment');
var expect = require('chai').expect;


var role = 'scheduler';
seneca.use('../lib/scheduler.js');

/**
 * Check scheduler 'task' has a 'job' inside
 */
checkTaskJob = function(task) {
  if (task && task.job) {
    return;
  }
  throw new Error('task is null or task doesn\'t owns any job');
}


suite('register');

/**
 * 'for' mode with Date object
 */
test('the "for" argument accepting Date object', function (done) {
  var registeredAt;

  seneca.act({
    role: role,
    cmd: 'register',
    for: moment().add(1, 'seconds').toDate(),
    task: function () {
      var now = Date.now();
      expect(now).to.be.above(registeredAt);
      done();
    }
  }, function (err) {
    registeredAt = Date.now()
    expect(err).to.be.null;
  });

});


/**
 * 'for' mode with Object describing a Date
 */
test('the "for" argument accepting object literal', function (done) {
  var registeredAt;
  var date = moment().add(1, 'seconds');

  seneca.act({
    role: role,
    cmd: 'register',
    for: {
      year: date.year(),
      month: date.month(),
      day: date.date(),
      hour: date.hour(),
      minute: date.minute(),
      second: date.second()
    },
    task: function() {
      var now = Date.now()
      expect(now).to.be.above(registeredAt);
      done();
    }
  }, function (err) {
    registeredAt = Date.now()
    expect(err).to.be.null;
  });

});


/**
 * 'for' mode with Date string
 */
test('the "for" argument accepting string', function (done) {

  seneca.act({
    role: role,
    cmd: 'register',
    for: '10/22/15',
    task: function () {}
  }, function (err) {
    expect(err).to.be.null;
    done();
  });

});


/**
 * 'every' mode with Object containing recurring indications (here, trigger a task each hour)
 */
test('the "every" argument accepting object literal', function (done) {

  seneca.act({
    role: role,
    cmd: 'register',
    every: {
      year: null,
      month: null,
      day: null,
      hour: 1,
      minute: null,
      second: null
    },
    task: function() {}
  }, function (err, task) {
    expect(err).to.be.null;
    expect(function() {
      checkTaskJob(task);
    }).to.not.throw(Error);

    var nextCall = task.job.nextInvocation();
    expect(nextCall.getHours()).to.equal(1);
    done();
  });

});


/**
 *
 */
test('the "every" argument with intuitive object literal', function (done) {

  seneca.act({
    role: role,
    cmd: 'register',
    every: {
      '2nd': 'hour',
      '20th': 'minute',
      '30th': 'second'
    },
    task: function() {}
  }, function (err, task) {
    expect(err).to.be.null;
    expect(function() {
      checkTaskJob(task);
    }).to.not.throw(Error);

    var every = task.job.pattern.every;

    expect(every).to.have.property('hour');
    expect(every).to.have.property('minute');
    expect(every).to.have.property('second');

    expect(every.hour).to.equal(2);
    expect(every.minute).to.equal(20);
    expect(every.second).to.equal(30);

    done();
  });

});


/**
 *
 */
test('the "every" argument accepting object literal containing cron style scheduling', function (done) {
  var minutesToWait = 5;

  seneca.act({
    role: role,
    cmd: 'register',
    every: {
      cron: '*/' + minutesToWait + ' * * * *'
    },
    name: 'cron-like scheduling',
    task: function() {}
  }, function (err, task) {
    expect(err).to.be.null;
    expect(function() {
      checkTaskJob(task);
    }).to.not.throw(Error);

    var minutesToCheck = new Date().getMinutes() / minutesToWait;
    if ((new Date().getMinutes() % minutesToWait) === 0) {
      minutesToCheck = (new Date().getMinutes() + 1) / 5;
    }

    var nextTriggerInMinutes = minutesToWait * Math.ceil( minutesToCheck );
    var nextCall = task.job.nextInvocation();
    expect(nextCall.getMinutes()).to.equal(nextTriggerInMinutes);

    done();
  });

});


//TODO
// suite('update');
//
//TODO
// suite('pause');
//


suite('retrieve');

test('returns a task for a given id', function (done) {
  var callbackResponse = 'Callback execution !!';
  var someCallback = function () { return callbackResponse };
  var taskName = 'A name for a task to retrieve';

  seneca.act({
    role: role,
    cmd: 'register',
    for: moment().add(1, 'years'),
    name: taskName,
    task: function () { return 'task execution' },
    callback: someCallback
  }, function (err, task) {
    expect(err).to.be.null;
    expect(function() {
      checkTaskJob(task);
    }).to.not.throw(Error);

    seneca.act({
      role: role,
      cmd: 'retrieve',
      id: task.job.id,
    }, function (err, retrievedTask) {
      expect(err).to.be.null;
      expect(function() {
        checkTaskJob(task);
      }).to.not.throw(Error);
      var job = retrievedTask.job;

      expect(job).has.property('id');
      expect(job).has.property('pattern');
      expect(job).has.property('callback');
      expect(job.name).to.equal(taskName);
      expect(job.callback).to.equal(someCallback);
      expect(job.callback()).to.equal(callbackResponse);

      done();

    });




  });
});

suite('list');

test('outputs the ids of all registered tasks', function (done) {
  var ids = [];
  seneca.act({
    role: role,
    cmd: 'register',
    for: moment().add(1, 'years'),
    task: function () {},
  }, function (err, task) {
    expect(err).to.be.null;
    expect(function() {
      checkTaskJob(task);
    }).to.not.throw(Error);

    ids.push(task.job.id);

    seneca.act({
      role: role,
      cmd: 'register',
      for: moment().add(1, 'years'),
      task: function () {},
    }, function (err, task) {
      expect(err).to.be.null;
      expect(function() {
        checkTaskJob(task);
      }).to.not.throw(Error);

      ids.push(task.job.id);

      seneca.act({
        role: role,
        cmd: 'list',
      }, function (err, list) {
        expect(err).to.be.null;

        expect(list.list).to.contain(ids[0]);
        expect(list.list).to.contain(ids[1]);
        done();
      });
    });

  });


})


suite('remove');

test('cancels a task when given an id', function (done) {

  seneca.act({
    role: role,
    cmd: 'register',
    for: moment().add(1, 'years'),
    task: function () {},
  }, function (err, task) {
    expect(err).to.be.null;
    expect(function() {
      checkTaskJob(task);
    }).to.not.throw(Error);

    seneca.act({
      role: role,
      cmd: 'remove',
      id: task.job.id
    }, function (err) {
      expect(err).to.be.null;

      seneca.act({
        role: role,
        cmd: 'list'
      }, function (err, list) {
        expect(list.list).not.to.contain(task.job.id);
        done();
      })


    });

  });

});

test('cancels multiple tasks when given an array of ids', function (done) {
  var ids = [];

  seneca.act({
    role: role,
    cmd: 'register',
    for: moment().add(1, 'years'),
    task: function () {},
  }, function (err, task) {
    expect(err).to.be.null;
    expect(function() {
      checkTaskJob(task);
    }).to.not.throw(Error);

    ids.push(task.job.id);

    seneca.act({
      role: role,
      cmd: 'register',
      for: moment().add(1, 'years'),
      task: function () {},
    }, function (err, task) {
      expect(err).to.be.null;
      expect(function() {
        checkTaskJob(task);
      }).to.not.throw(Error);

      ids.push(task.job.id);

      seneca.act({
        role: role,
        cmd: 'remove',
        ids: ids
      }, function (err) {
        expect(err).to.be.null;

        seneca.act({
          role: role,
          cmd: 'list'
        }, function (err, list) {
          expect(list.list).not.to.contain(ids[0]);
          expect(list.list).not.to.contain(ids[1]);
          done();
        })
      });
    });
  });

});


suite('clear');


test('removes all jobs', function (done) {

  seneca.act({
    role: role,
    cmd: 'register',
    for: moment().add(1, 'years'),
    task: function () {},
  }, function (err, task) {
    expect(err).to.be.null;
    expect(function() {
      checkTaskJob(task);
    }).to.not.throw(Error);

    seneca.act({
      role: role,
      cmd: 'register',
      for: moment().add(1, 'years'),
      task: function () {},
    }, function (err, task) {
      expect(err).to.be.null;
      expect(function() {
        checkTaskJob(task);
      }).to.not.throw(Error);

      seneca.act({
        role: role,
        cmd: 'clear',
      }, function (err) {
        expect(err).to.be.null;

        seneca.act({
          role: role,
          cmd: 'list'
        }, function (err, list) {
          expect(list.list.length).to.equal(0);
          done();
        })
      });
    });
  });

})
