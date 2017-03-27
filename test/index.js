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

suite('register');

test('the "for" argument accepting Date object', function (done) {
  var registeredAt;

  seneca.act({
    role: role,
    cmd: 'register',
    for: moment().add(1, 'seconds').toDate(),
    task: function () {
      var now = Date.now();

      // expect(now).to.be.closeTo(registeredAt + 1000, 500);

      expect(now).to.be.above(registeredAt);
      done();
    }
  }, function (err) {
    registeredAt = Date.now()
    expect(err).to.be.null;
  });

});


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

      // expect(now).to.be.closeTo(registeredAt + 1000, 500);

      expect(now).to.be.above(registeredAt);
      done();
    }
  }, function (err) {
    registeredAt = Date.now()
    expect(err).to.be.null;
  });

});

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
    var nextCall = task.nextInvocation();
    expect(nextCall.getHours()).to.equal(1);
    done();
  });

});

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
    var every = task.pattern.every;
    expect(err).to.be.null;

    expect(every).to.have.property('hour');
    expect(every).to.have.property('minute');
    expect(every).to.have.property('second');

    expect(every.hour).to.equal(2);
    expect(every.minute).to.equal(20);
    expect(every.second).to.equal(30);

    done();
  });

});


test('the "every" argument accepting object literal containing cron style scheduling', function (done) {

  seneca.act({
    role: role,
    cmd: 'register',
    every: {
      cron: '*/5 * * * *'
    },
    task: function() {}
  }, function (err, task) {
    expect(err).to.be.null;
    var nextCall = task.nextInvocation();
    var nextTriggerInMinutes = 5 * Math.ceil( new Date().getMinutes() / 5 );
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
  var someTask = function () { };

  seneca.act({
    role: role,
    cmd: 'register',
    for: moment().add(1, 'years'),
    task: someTask,
  }, function (err, task) {


    seneca.act({
      role: role,
      cmd: 'retrieve',
      id: task.id
    }, function (err, retrievedTask) {
      expect(err).to.be.null;
      expect(retrievedTask).to.exist;
      expect(retrievedTask.job).to.equal(someTask);
      expect(retrievedTask).has.property('id');
      expect(retrievedTask).has.property('name');

      done();

    });




  });
});

suite('list');

test('outputs the ids of all registerd tasks', function (done) {
  var ids = [];
  seneca.act({
    role: role,
    cmd: 'register',
    for: moment().add(1, 'years'),
    task: function () {},
  }, function (err, task) {
    ids.push(task.id);

    seneca.act({
      role: role,
      cmd: 'register',
      for: moment().add(1, 'years'),
      task: function () {},
    }, function (err, task) {
      ids.push(task.id);

      seneca.act({
        role: role,
        cmd: 'list',
      }, function (err, list) {
        expect(err).to.be.null;
        expect(list).to.contain(ids[0]);
        expect(list).to.contain(ids[1]);
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


    seneca.act({
      role: role,
      cmd: 'remove',
      id: task.id
    }, function (err) {
      expect(err).to.be.null;

      seneca.act({
        role: role,
        cmd: 'list'
      }, function (err, list) {
        expect(list).not.to.contain(task.id);
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

    ids.push(task.id);

    seneca.act({
      role: role,
      cmd: 'register',
      for: moment().add(1, 'years'),
      task: function () {},
    }, function (err, task) {

      ids.push(task.id);

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
          expect(list).not.to.contain(ids[0]);
          expect(list).not.to.contain(ids[1]);
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

    seneca.act({
      role: role,
      cmd: 'register',
      for: moment().add(1, 'years'),
      task: function () {},
    }, function (err, task) {


      seneca.act({
        role: role,
        cmd: 'clear',
      }, function (err) {
        expect(err).to.be.null;


        seneca.act({
          role: role,
          cmd: 'list'
        }, function (err, list) {
          expect(list.length).to.equal(0);
          done();
        })


      });

    });

  });
})
