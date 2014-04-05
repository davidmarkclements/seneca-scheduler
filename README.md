# seneca-scheduler

## An email plugin for the [Seneca](http://senecajs.org) toolkit

This module is a plugin for the Seneca framework. It provides scheduling capability for actions.

With this module you can:

   * Schedule a task to happen at a set future date
   * Schedule a recurring task to that happens at prescribed intervals

The default implementation uses the
[node-schedule](https://github.com/mattpat/node-schedule) module to handle the event scheduling

You can customize this by overriding the appropriate actions.


## Support

If you're using this module, feel free to contact me on twitter if you
have any questions! :) [@davidmarkclem](http://twitter.com/davidmarkclem)

Current Version: 0.0.0

Tested on: node 0.10.26, seneca 0.5.15



## Quick examples

Schedule a single future event:

```JavaScript
var seneca = require('seneca')();

seneca.use('scheduler');

seneca.ready(function(err){
  if( err ) return console.log(err);

  seneca.act({
    role:'scheduler',
    cmd:'register',
    for: '22/10/15 17:24:02',
    task: function () {
      //do things
      console.log('doing things');
    },
  })

})
```
The _for_ argument can also be a Date object or an object literal, as well as being a string.

Schedule a recurring event:

```JavaScript
var seneca = require('seneca')();

seneca.use('scheduler');

seneca.ready(function(err){
  if( err ) return console.log(err);

  seneca.act({
    role:'scheduler',
    cmd:'register',
    every: {
      minute: 30,
      hour: 4,
      day: 5
    },
    task: function () {
      //do things
      console.log('doing things');
    },
  })

})
```
This will schedule an event for the 30th minute, of the 4th hour of 5th
day of the month (for days of the week we use dayOfWeek).

There's also an alternative way to express recurrence:

```JavaScript
var seneca = require('seneca')();

seneca.use('scheduler');

seneca.ready(function(err){
  if( err ) return console.log(err);

  seneca.act({
    role:'scheduler',
    cmd:'register',
    every: {
      '30th': 'minute',
      '4th': 'hour',
      '5th': 'day'
    },
    task: function () {
      //do things
      console.log('doing things');
    },
  })

})
```

## Install

```sh
npm install seneca
npm install seneca-scheduler
```

You'll need the [seneca](http://github.com/rjrodger/seneca) module to use this module - it's just a plugin.



## Usage

To load the plugin:

```JavaScript
seneca.use('scheduler', { ... options ... })
```

To isolate logging output from the plugin, use:
```bash
node your-app.js --seneca.log=plugin:scheduler
```

For more logging options, see the [Seneca logging tutorial](http://senecajs.org/logging-example.html).
You may, for example, wish to log task output to a separate file for audit purposes.


## Options

   * _locale_: Defaults to en_gb, can be set to any language supported by moment.js
   * _endianness_: [Date endianness](http://en.wikipedia.org/wiki/Date_format_by_country), defaults to L. Can be L, M or B (little, medium, big). L is DD MM YY, M is MM DD YY and B is YY MM DD


## Actions

All actions provide results via the standard callback format: <code>function(error,data){ ... }</code>.


### ACTION: role:scheduler, cmd:register

Register a task with the scheduler

#### Arguments:

   * _for_: Must not appear alongside _every_. Used to schedule a future one off event, can be a
     * Date object
     * String - with a valid formatted date
     * Object - for instance {day: 14, month: 12, year:15} would be midnight on December 14th 2015
   * _every_: Must not appear alongside _for_. Used to schedule recurring events, must be an object. Can take two forms:
     * Period properties: Same as the _for_ object literal, can contain day, month, year, hour, minute, second,
       but unlike the _for_ object, it can also have a dayOfWeek property to schedule events to occur weekly.
       dayOfWeek begins with 0 for Sunday, running to 6 for Saturday.
     * Suffixed Number properties: for easier reading, properties can describe the "Nth" interval of a period,
       e.g {'4th':'hour', '3rd day'} would be 4am every 3rd day of the month.  
   * _task_: A function to call when the time is right

#### Provides:

Object with properties:

   * _job_: The original registered task
   * _id_: The task id, used for retrieving and removing tasks
   * _name_: The tasks name (as used by node-scheduler).
   * _pattern_: The pattern used to determine scheduling, as set by _for_ or _every_.
   * _cancel_: Method which cancels the task
   * _cancelNext_: Method which cancels the next calling of the task
   * _nextInvocation_: Method which returns a Date object referring to the time of the next calling of the task
   * _trackInvocation_: Used internally by node-schedule
   * _stopTrackingInvocation_: Used internally by node-schedule
   * _events: Used internally by node-schedule

#### Sub Actions:

None.

#### Hooks:

None.


### ACTION: role:scheduler, cmd:list

Outputs an array of all the job id's currently scheduled

#### Arguments:

None.

#### Provides:

Array containing ID strings.

#### Sub Actions:

None.

#### Hooks:

None.

### ACTION: role:scheduler, cmd:retrieve
Returns a task object when passed an id.


#### Arguments:

   _id_: The id of the task to fetch

#### Provides:

Object with properties:

   * _job_: The original registered task
   * _id_: The task id, used for retrieving and removing tasks
   * _name_: The tasks name (as used by node-scheduler).
   * _pattern_: The pattern used to determine scheduling, as set by _for_ or _every_.
   * _cancel_: Method which cancels the task
   * _cancelNext_: Method which cancels the next calling of the task
   * _nextInvocation_: Method which returns a Date object referring to the time of the next calling of the task
   * _trackInvocation_: Used internally by node-schedule
   * _stopTrackingInvocation_: Used internally by node-schedule
   * _events: Used internally by node-schedule

#### Sub Actions:

None.

#### Hooks:

None.



### ACTION: role:scheduler, cmd:remove

Removes a task from the scheduler.

#### Arguments:

   _id_: The id of the task to remove. Can also be an array of id's to remove.
   _ids_: An array of id's to remove.

#### Provides:

Nothing.


#### Sub Actions:

None.

#### Hooks:

None.


### ACTION: role:scheduler, cmd:clear

Clears all scheduled tasks

#### Arguments:

None.

#### Provides:

Nothing

#### Sub Actions:

None.

#### Hooks:

None.

## Logging

To see what this plugin is doing, try:

```sh
node your-app.js --seneca.log=plugin:scheduler
```

This will print action logs and plugin logs for the user plugin. To skip the action logs, use:

```sh
node your-app.js --seneca.log=type:plugin,plugin:scheduler
```

You can also set up the logging programmatically:

    var seneca = require('seneca')({
      log:{
        map:[
          {plugin:'scheduler',handler:'print'}
        ]
      }
    })

For more on logging, see the [seneca logging example](http://senecajs.org/logging-example.html).


## Test

Run tests with:

```sh
npm test
```

If debugging tests:

```sh
npm run debug-test
```

Then go to http://localhost:8080/debug?port=5858 in Chrome to use dev-tools
to debug. Awesome sauce.


## Todo
  * update action (update a task)
  * pause (pause a recurring task)
  * executable tasks (command line strings)
  * fuzzy date matching ('next Tuesday', 'every Wednesday at 5')
  * cron strings
  * tests for error cases
