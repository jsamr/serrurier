import { Class } from 'meteor/jagi:astronomy';
import server from './server-decorator';
import cadenas from './cadenas-decorator';
import {
    decorateDescription,
    registerIsolatedReporter,
    publishServerReporter,
    subscribeServerReporter,
    silence as silenceCoreApi,
    lockApi as lockDecoratorsApi
}  from 'meteor/svein:serrurier-core';
import { Cadenas, lockApi as lockCadenasApi } from './api/Cadenas';
import DefaultCadenas from './api/DefaultCadenas';
import MethodParamsCadenas from './api/MethodParamsCadenas';
import SecurityException from './SecurityException';
import StateException from './StateException';
import ValidationException from './ValidationException';
import { ensuresArg } from './ensures';
import { createSerrurierException } from './utils';
import Logger from './Logger';

let isSerrurierLocked = false;

function runIfApiIsOpen( func ) {
    if(!isSerrurierLocked) return func();
}

/**
 * Serrurier API entry-point.
 * @type {{
 *  createClass: (function(!Object): Astro.Class),
 *  inheritClass: (function(!Astro.Class, !Object): Astro.Class),
 *  extendClass: (function(!Astro.Class, !Object)),
 *  registerIsolatedReporter: (function(!Function, function({object}, context))),
 *  publishServerReporter: (function(!Function, function({object}, context), String=)),
 *  subscribeServerReporter: (function(!Function, String=)),
 *  lock: (function()),
 *  silence: (function()),
 *  createException: (function(String))
 *}}
 */
const Serrurier = {
    /**
     * Create a secured class, same as Astro.Class.create but with decorator functionality.
     * @param {!object} description - A description of the Astro Class to decorate.
     * @returns {Astro.Class} An Astro Class.
     */
    createClass( description ) {
        return runIfApiIsOpen( () =>{
            ensuresArg( 'In `Serrurier.createClass` : argument `description`', description, Object );
            return Class.create( decorateDescription( description ) );
        });
    },
    /**
     * Inherit securely from a Class, same as Astro.Class.inherit but with decorator functionality.
     * @param {!Astro.Class} Clazz - The Class to inherit from.
     * @param {!object} description
     * @returns {Astro.Class} An Astro Class inheriting from Clazz
     */
    inheritClass( Clazz, description ) {
        return runIfApiIsOpen( () =>{
            ensuresArg( 'In method `Serrurier.inheritClass` : argument `description`', description, Object );
            ensuresArg( 'In method `Serrurier.inheritClass` : argument `Clazz`', Clazz, Function );
            //noinspection JSUnresolvedFunction
            return Clazz.inherit( decorateDescription( description ) );
        });
    },
    /**
     * Extend securely a Class, same as Astro.Class.extend but with decorator functionality.
     * @param {!Astro.Class} Clazz - The Class to extend.
     * @param {!object} description
     */
    extendClass( Clazz, description ) {
        runIfApiIsOpen( () =>{
            ensuresArg( 'In method `Serrurier.extendClass` : argument `description`', description, Object );
            ensuresArg( 'In method `Serrurier.extendClass` : argument `Clazz`', Clazz, Function );
            //noinspection JSUnresolvedFunction
            Clazz.extend( decorateDescription( description ) );
        });
    },
    /**
     * Register a reporter that will be run on the environment the exception is thrown.
     * @param {!Function} ExceptionClass - The constructor of the exception to listen to
     * @param {function({object} context, {object} exception )} reporter - The hook that will be called when it's associated exception type is thrown.
     */
    registerIsolatedReporter( ExceptionClass, reporter ) {
        runIfApiIsOpen( () => registerIsolatedReporter.call( null, ExceptionClass, reporter ) );
    },
    /**
     * @locus server
     *
     * Must be called on server. To have this reporter working on client, you must subscribe to it, see {@link Serrurier.subscribeServerReporter }
     * Publish a reporter (function) that will be run server side through Meteor methods when the corresponding exception type is thrown, either from client or from server.
     * This reporter will have access to all the available Meteor api inside Meteor methods, see {@link https://docs.meteor.com/api/methods.html#Meteor-methods}.
     *
     * @param {!Function} ExceptionClass - The exception constructor. The field `Error.prototype.name` must exist if you don't want to provide the third argument (name).
     * @param {function({object} context, {object} exception )} serverReporter - The hook that will be called when it's associated exception type is thrown.
     * @param {String} [name] - The name of the Meteor method that will be used in the background. Default is namespaced with '/serrurier/'.
     * @see Serrurier.subscribeServerReporter
     */
    publishServerReporter( ExceptionClass, serverReporter, name ) {
        runIfApiIsOpen( () => publishServerReporter.call( null, ExceptionClass, serverReporter, name ) );
    },

    /**
     * @locus client
     *
     * Must be called on client. Acknowledge Serrurier that a server reporter is available for client and must be called when a ExceptionClass is thrown.
     *
     * @param {!Function} ExceptionClass - The exception constructor. The field `Error.prototype.name` must exist if you don't want to provide the third argument (name).
     * @param {String} [name] - The name of the Meteor method that will be used in the background. Default is namespaced with '/serrurier/'.
     * @see Serrurier.publishServerReporter
     */
    subscribeServerReporter( ExceptionClass, name ) {
        runIfApiIsOpen( () => subscribeServerReporter.call( null, ExceptionClass, name ) );
    },

    /**
     * Lock the api : mutating functionalities (like registering reporters, creating cadenas) becomes unavailable.
     */
    lock(){
        lockCadenasApi();
        lockDecoratorsApi();
        isSerrurierLocked = true;
    },
    /**
     * Silence the serrurier api, preventing it from logging anything.
     * This is a irreversible action.
     */
    silence() {
        silenceCoreApi();
        Logger.silence();
    },
    /**
     * Creates an exception that can be used to register reporters.
     * @param {String} name
     */
    createException( name ) {
        return createSerrurierException( name );
    }

};

export {
    server,
    cadenas,
    Serrurier,
    DefaultCadenas,
    MethodParamsCadenas,
    SecurityException,
    StateException,
    ValidationException
};

export default Serrurier;