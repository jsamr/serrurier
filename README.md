<a name="head">
![](https://cdn.rawgit.com/sveinburne/serrurier/master/img/serrurier-raw.svg)

# *Serrurier*, a declarative extension for methods access control in [jagi:astronomy](http://jagi.github.io/meteor-astronomy/)(v2) using decorators
![](https://img.shields.io/github/license/mashape/apistatus.svg)  

> ![](https://cdn.rawgit.com/sveinburne/serrurier/master/img/decorator-raw.svg)

> **ℹ** *Serrurier* and *cadenas* are french words that stands respectively for *locksmith* and *padlock*.  
> **✔** This library aims to write more secure, maintainable and readable code, by defining function access through decorators called *`@cadenas`*.  
> **✔** It integrates smoothly with [alanning:meteor-roles](https://github.com/alanning/meteor-roles).  
> **✔** Helps to abstract error management (user feedbacks, security reports) through [the flexible reporter API](#reporters).  
> **✔** Allows to define [Astro methods that run on server](#server).  
> **✔** Works with synchronous and asynchronous (through Meteor methods api) methods.  
> **✔** Compatible with [ValidationErrors](https://atmospherejs.com/mdg/validation-error#validationerror)

``` bash
meteor add svein:serrurier
```

Table of Contents
=================

* [<g-emoji alias="lock" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f512.png">🔒</g-emoji> <em>@cadenas</em> decorator](#-cadenas-decorator)
  * [Basics](#basics)
  * [Stacking <em>@cadenas</em>](#stacking-cadenas)
  * [Default <em>@cadenas</em>](#default-cadenas)
    * [@cadenas( 'userIsLoggedIn' )](#cadenas-userisloggedin-)
    * [@cadenas( 'matchParams', paramsDescription )](#cadenas-matchparams-paramsdescription-)
    * [@cadenas( 'userExists' )](#cadenas-userexists-)
    * [@cadenas( 'persisted' )](#cadenas-persisted-)
  * [Alanning meteor roles <em>@cadenas</em>](#alanning-meteor-roles-cadenas)
    * [@cadenas( 'loggedUserInRole', role_s, partition )](#cadenas-loggeduserinrole-role_s-partition-)
* [<em>@server</em> decorator](#server-decorator)
  * [Exemple with ValidationError](#exemple-with-validationerror)
* [Adding legacy decorations (Meteor &gt;= 1.3.4)](#adding-legacy-decorations-meteor--134)
* [Security in production](#security-in-production)
* [Reporters](#reporters)
  * [Defining reporters](#defining-reporters)
    * [Isolated reporter](#isolated-reporter)
    * [Server side reporter](#server-side-reporter)
  * [<g-emoji alias="ghost" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f47b.png">👻</g-emoji> Paranoid reporter](#-paranoid-reporter)
* [Write your own <em>@cadenas</em>](#write-your-own-cadenas)
  * [Composition with Cadenas.partialFrom](#composition-with-cadenaspartialfrom)
  * [From scratch](#from-scratch)
* [Run tests](#run-tests)


## &#x1f512; *`@cadenas`* decorator
### Basics

> **ℹ** A *`@cadenas`* is an assertion that will trigger a specific `Exception` when it fails.  
> **ℹ** This (or those) assertions are run both **client** side and **server** side.  
> **ℹ** Those Exceptions can be handled [by reporters](#reporters).  
> **ℹ**  The general syntax for *`@cadenas`* is `@cadenas( cadenasName, ...params )`  
> **ℹ** *`@cadenas`*  can target any function inside a `methods` description block.  
> **ℹ** *`@cadenas`* can target any `events` handlers but **not in an array of handlers**. On any `Error` thrown by a cadenas, `e.preventDefault()` will be called.  
> **ℹ** It supports callbacks for `methods`.  
> **ℹ** *Serrurier* is a very modular library and you can easely write your own *`@cadenas`* [within few lines of codes](#write-cadenas).   
> **⚠** To use decorators in your meteor project (`@`), [follow those 2 straightforward steps](#decorators).  
> **⚠** To use `loggedUserInRole` *`@cadenas`* for alanning:meteor-roles, you need to add `svein:serrurier-cadenas-roles` to your project.
> ```
> meteor add svein:serrurier-cadenas-roles
> ```

``` javascript
import { Serrurier, cadenas } from 'meteor/svein:serrurier';
import { Mongo } from 'meteor/mongo';

const Project = Serrurier.createClass({
  name: 'Project',
  collection: new Mongo.Collection( 'projects' ),
  methods: {
    // This is it
    @cadenas( 'loggedUserInRole', 'administrator' )
    updateSensitiveData() {
      // ...
      console.info( 'The assertion passed, user is administrator.' );
    }
  }
});
```
Then, if logged user is not in role 'administrator' and calls
``` javascript
(new Project()).updateSensitiveData();
```
This will output in the console ( if `Serrurier.silence()` has not been called ) :
![](img/log1.png)

Notice that the cadenas `'userIsLoggedIn'` has passed, because `'loggedUserInRole'` cadenas depends on it.

### Stacking *`@cadenas`*

The order you declare your cadenas is the order they will be applied.

``` javascript
@persisted()
@userIsLoggedIn()
aMethod() {
  // ...
}
```
Serrurier will first check if the astro instance has been persisted, then it will check if user is logged in.

<a name='default-cadenas'>
### Default *`@cadenas`*

> **ℹ** If you want, and you should, write your own cadenas, [go to this section](#write-cadenas).  
> **⚠** To have those cadenas available in your app, you will have to add them manually
> ```
> meteor add svein:serrurier-cadenas-defaults
> ```

#### `@cadenas( 'userIsLoggedIn' )`

> **package** `svein:serrurier-cadenas-defaults`  
> **asserts** that the user is logged in, with `Meteor.userId`.  
> **targets** `methods`, `events`  
> **throws** `SecurityException`  
> **params** none

#### `@cadenas( 'matchParams', paramsDescription )`

> **package** `svein:serrurier-cadenas-defaults`  
> **asserts** that all method arguments match the given paramsDescription.  
> **targets** `methods`  
> **throws** `ValidationException`  
> **params**  
> > *paramsDescription* An array of [Meteor Match Patterns](https://docs.meteor.com/api/check.html#matchpatterns)


#### `@cadenas( 'userExists' )`

> **package** `svein:serrurier-cadenas-defaults`  
> **asserts** that the first argument of the class instance method is a string corresponding to an existing user.  
> **targets** `methods`  
> **throws** `StateException`  
> **params** none


#### `@cadenas( 'persisted' )`

> **package** `svein:serrurier-cadenas-defaults`  
> **asserts** that the instance it is being called upon has been persisted (with `_isNew` property to false)  
> **targets** `methods`, `events`  
> **throws** `StateException`  
> **params** none

<a name="alanning-meteor-roles">
### Alanning meteor roles *`@cadenas`*

> **⚠** This cadenas depends on `svein:serrurier-cadenas-defaults`, so it will be automatically imported if missing.  
> **⚠** You need to use [alanning:meteor-roles](https://github.com/alanning/meteor-roles) in your project to use this one, and add the following package :
>```
>meteor add svein:serrurier-cadenas-roles
>```

#### `@cadenas( 'loggedUserInRole', role_s, partition )`

> **package** `svein:serrurier-cadenas-roles`  
> **asserts** that the logged user has role(s) in a specific scope (partition).  
> **targets** `methods`, `events`  
> **throws** `SecurityException`  
> **depends** on `'userIsLoggedIn'` (will always check that user is logged in first)  
> **params**  
> > *role_s* One single or an array of role(s), i.e. string(s).   
> > *partition* The scopes in which the partition will apply. There is one special partition AUTO that resolves to `this.getPartition()` in the astro class instance, seee below.
> > ```javascript
> > import { parts } from 'meteor/svein:serrurier-cadenas-roles';
// ...
@cadenas( 'loggedUserInRole', 'responsible', parts.AUTO )
// ...
// parts.GLOBAL is the default value, it maps straight to Roles.GLOBAL_PARTITION
@cadenas( 'loggedUserInRole', 'responsible', parts.GLOBAL )
> > ```

<a name='server'>
## *`@server`* decorator

> ```
> meteor add svein:serrurier-decorator-server
> ```  
> **ℹ** Applies to `methods` only.  
> **ℹ** Performs server-side only, you must provide a callback as last argument if you need the return value.  
> **ℹ** This callback has the following signature : `callback( [ Exception ] exception, { * } result )`  
> **⚠** You must always open and close parenthesis when using decorators

```javascript
// @locus client and server
import { Serrurier, server } from 'meteor/svein:serrurier';

//... inside a Serrurier.createClass `methods` field
    @server()
    aMethodThatMustExecuteOnServer() {
      console.info( "Look, I'm running on server only." );
    }

```

Calling `aMethodThatMustExecuteOnServer` from client will call it on server. In the background, a Meteor method will be registered with the name `/serrurier/ClassName#methodName` through `Meteor.methods`.

### Exemple with `ValidationError`

```javascript
import { Serrurier, server } from 'meteor/svein:serrurier';
import { ValidationError } from 'meteor/mdg:validation-error';
//... inside a Serrurier.createClass `methods` field
MyClass = Serruroer.createClass({
  name: 'MyClass'
  methods: {
    @server()
    aMethodThatThrowsValidationError() {
      throw new ValidationError([
        {
            name: 'cost',
            type: 'out-of-range',
            value: 162,
            min: 0,
            max: 100
        }
      ]);
    }
  }
});

// ... later
/** @type MyClass */
myClass.aMethodThatThrowsValidationError( function( err ) {
  console.info( ValidationError.is(err) );
  // prints 'true'
});     

```


<a name='decorators'>
## Adding legacy decorations (Meteor >= 1.3.4)
Follow those two simple steps :

> `meteor npm install -s babel-plugin-transform-decorators-legacy`

Then add at the root of your project a `.babelrc` file with the following content :
``` json
{
  "plugins": [
    "transform-decorators-legacy"
  ]
}
```
That's all you have to do!
## Security in production

You can prevent `Serrurier` from outputting anything in the console, and lock the API with one single `Serrurier.lock()` at the beginning of your application.
This cannot be reversed. Any consequitive call to any `Serrurier` static method will be ignored.

``` javascript
import { Meteor } from 'meteor/meteor';
import Serrurier from 'meteor/svein:serrurier';

if(Meteor.isProduction) Serrurier.lock();

```


<a name="reporters">
## Reporters

> **ℹ** A reporter is exactly like an event listener for errors.   
> **ℹ** For each type of error, i.e. `SecurityException`, `StateException`, `ValidationException` (or custom exceptions), you can register a reporter.  
> **ℹ** You can create your own exceptions with `Serrurier.createException`.  
> **ℹ** By default, there is no reporting : the errors are just thrown up to the method call.  
> **ℹ** A reporter takes one `security_context` argument that holds several informations :  
>
``` javascript
* @typedef {object} security_context
* An object that holds information about the context of the execution.
*
* @prop {!string} action            - The 'Class#method' Astronomy signature who built the context
* @prop {!string} reason            - Why the access was forbidden? Recommanded format
* is a short dot separated description, with arguments separated by columns.
* this.is.an.example:arg1:arg2
* @prop {!string} exceptionId       - Unique identifier of the exception
* @prop {!string} stackTrace        - The stacktrace that generated this exception
* @prop {!object} target            - The target of the action
* @prop {object=} currentTarget     - The currentTarget of the action, i.e. a nested field of the target
*/
```


### Defining reporters

#### Isolated reporter

This reporter is qualified 'isolated' because it listen to exceptions thrown on the environment it is defined (client and/or server).

``` javascript
// @locus client and/or server
import { Serrurier, SecurityException } from 'meteor/svein:serrurier';

// if you need a client-only or server-only reporter, just call this code from one or the other.
Serrurier.registerIsolatedReporter( SecurityException, function( context ) {
    console.info( 'hi!' );
    // prints 'hi!' in server if the exception is thrown server side,
    // in client if the exception is thrown client side.
});
```

#### Server side reporter

If you need a reporter that is executed on server, but listens to both client and server side exceptions, you need to use those functions :

**Server side** :
```javascript
// @locus server
import { SecurityException, Serrurier } from 'meteor/svein:serrurier';

Serrurier.publishServerReporter( SecurityException, function ( context ) {
    console.warn( 'hi!' );
    // prints 'hi!' in server, whether the exception was thrown client or server side.
});
```
**Client side** :
``` javascript
// @locus client
import { SecurityException, Serrurier } from 'meteor/svein:serrurier';

Serrurier.subscribeServerReporter( SecurityException );

```

Suits nicely for Error logging and suspect activity logging, see the Paranoid reporter bellow.  

<a name="paranoid-reporter">
### &#x1f47b; Paranoid reporter
This reporter listen for `SecurityException`s on both client and server, and log detailed information **in the server** console.
It also keep track of those reports for 2 months.

```
meteor add svein:serrurier-reporter-paranoid
```

This is how a report looks like in the server console.
```
_______________________________ SERRURIER PARANOID REPORT _______________________________

        createdAt: new Date('2016-07-07T05:46:25.005Z'),
        ip: '127.0.0.1',
        geoInfo: 'localhost'
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) ...,
        securityContext: {
                reason: 'user.not.in.role:administrator:GLOBAL',
                exceptionId: 'loggedUserInRole',
                action: 'Project#updateSensitiveData',
                stackTrace: '...',
                target: {
                        Project: {
                            plugins: {
                                   task: {
                                           _types: []
                                   },
                                   annotation: {
                                           _types: []
                                   }
                            },
                            isOpen: false,
                            publicationPolicy: true,
                            enablePlugins: false,
                            defaultCaptionSource: null,
                            pending: []
                          }
                },
                userId: 'JCwWgQZLExz5KrcDH'
        }
_________________________________________________________________________________________
```

You must import the package on server to `config` it :

``` javascript
// @locus server
import {
  config,
  ONE_DAY,
  ONE_MONTH,
  ParanoidReports // This is the mongo collection
} from 'meteor/svein:serrurier-reporter-paranoid';

config({
    // [default : false]
    geotracking: true,
    // [default : one day] time in seconds the ip records will be kept
    ip_cache_ttl: ONE_DAY*2,
    // [default : two months] time in seconds the security records will be kept
    record_ttl: ONE_MONTH
});


```

<a name="write-cadenas">
## Write your own *`@cadenas`*

### Composition with `Cadenas.partialFrom`

``` javascript
// @locus client and server
import { Cadenas } from 'meteor/svein:serrurier';
import { Match } from 'meteor/check';
/**
 * Assert the logged user is administrator
 * Note that you can override the ExceptionClass property when making partials.
 */
const loggedUserIsAdmin = Cadenas.partialFrom( 'loggedUserInRole' , {
    name: 'loggedUserIsAdmin'
}, 'administrator' );

```
Later in your project

``` javascript
@cadenas( 'loggedUserIsAdmin' )
methodThatMustBeRunByAdmin() {
      // Will be run by 'administrator'
}
```

### From scratch

```javascript
// @locus client, server
import { DefaultCadenas, Serrurier } from 'meteor/svein:serrurier';

// You can also use builtin exception like ValidationException, SecurityException and StateException
const MyException = Serrurier.createException( 'MyException' );

const myCustomCadenas = new DefaultCadenas({
    name: 'myCustomCadenas',
    // [optional] The exception that will be thrown. Only reporters listening for this exception will be
    // called upon assertion failures.
    // Default to SecurityException for 'DefaultCadenas' and ValidationException for 'MethodParamsCadenas'
    // You shall use the utility function `Serrurier.createException` if you need to create your own.
    // They inherit Meteor.Error and can be thrown from server to client via callabcks.
    ExceptionClass: MyException
    doesAssertionFails: function( myArg ) {
        // Does it need to throw an exception ?
        // Must NOT throw an error. Returns a non-empty string that will result in the // `reason` field for context when the assertion fails, a falsy value otherwise.
    },
    // The cadenas signature (i.e. `doesAssertionFails` signature)?
    // You must describe any parameter here to keep the API consistent.
    // Use Match.Any if you don't want to test an input, however this is not recommanded.
    matchPatterns: [ Match.Optional( String ) ],
    // [optional] A set of depending assertions in the form of a dictionary which keys are cadenas names,
    // and values an array with their `doesAssertionFails` params.
    dependingCadenas: { userIsLoggedIn: [] }

});
```

## Run tests

Inside the *packages/serrurier* folder :
```
meteor test-packages ./ --driver-package practicalmeteor:mocha -p 3001
```
