import { ensures, ensuresArg } from '../ensures';
import ValidationException from '../ValidationException';
import { each, create, partial } from 'meteor/svein:serrurier-core/lib/lodash';
import { Match } from 'meteor/check';
import { Assertion }  from './Assertion';
import SecurityException from '../SecurityException';
const cadenasMap = new Map();

let isApiLocked = false;

export function lockApi() {
    isApiLocked = true;
}

/**
 * @param {!Function} methodNameGetter
 * @param {string} name
 * @param {Array=} params
 * @return {Assertion}
 */
export function buildAssertion( methodNameGetter, name, params ) {
    ensuresArg( 'In function `buildAssertion` param `methodNameGetter`', methodNameGetter, Function );
    ensuresArg( 'In function `buildAssertion` param `name`', name, String );
    ensuresArg( 'In function `buildAssertion` param `params`', params, Match.Optional(Array) );
    let cadenas = cadenasMap.get( name );
    //noinspection JSCheckFunctionSignatures
    let args = Match.test( params, Array )? params : [];
    if (!cadenas) throw Error( `No cadenas found with name '${name}'.
    Currently registered cadenas are : '${Array.from(cadenasMap.keys()).join(', ')}'.
    To register a new Cadenas, simply instanciate it with \'new DefaultCadenas\' or \`new MethodParamAssertor\`.` );
    return cadenas.toAssertion( args, methodNameGetter );
}

export function validateArguments( args, matchPatterns, nameFunc ) {
    let i = 0;
    each( matchPatterns, ( pattern, index ) => {
        if(i > args.length) throw new ValidationException( `${nameFunc()} Missing argument n°${index})}` );
        ensuresArg( `In \`${nameFunc()}()\` the param at index \`${index}\``, args[i], pattern );
        i++;
    });
}

/**
 * @class
 */
export class Cadenas {

    /**
     * @param {!string } cadenasName - The cadenas name to get a partial from
     * @param {!object} config
     * @param {!string} config.name
     * @param {!string=} config.ExceptionClass
     * @param {...*} partials - The partials to be applied to the {@link Cadenas#doesAssertionFails} method.
     * @see _.partial
     */
    static partialFrom( cadenasName, config, ...partials ){
        if(!isApiLocked){
            const  { name, ExceptionClass } = config;
            if(!partials) partials = [];
            /** @type Cadenas */
            let cadenas = null;
            ensuresArg( 'In static method `Cadenas.partialFrom` : param `config.name`', name, String );
            ensuresArg( 'In static method `Cadenas.partialFrom` : param `cadenasName`', cadenasName, String );
            ensuresArg( 'In static method `Cadenas.partialFrom` : param `ExceptionClass`', ExceptionClass, Match.Optional( Function ) );
            //noinspection JSCheckFunctionSignatures
            if(Match.test( cadenasName, String )) cadenas = cadenasMap.get( cadenasName );
            if(!cadenasName) throw new Error( `Cadenas ${cadenasName} does not exist` );
            const partial = create( cadenas, Object.assign( config, {
                toAssertion: function( args, methodNameGetter ) {
                    partials.push( ...args );
                    return cadenas.toAssertion.call(this, partials, methodNameGetter);
                }}));
            cadenasMap.set( name, partial );
            return partial;
        }
    }

    /**
     * @param {Array} args
     * @private
     */
    _validateArgument( args ){
        validateArguments( args, this.matchPatterns, () => `Cadenas ${this.name}` );
    }

    /**
     * @param {!Array} assertorArgs - Any argument to be given to {@link Cadenas#doesAssertionFails}
     * @param {Function} methodNameGetter
     * @return {Assertion}
     */
    toAssertion( assertorArgs, methodNameGetter ){
        this._validateArgument( assertorArgs );
        this._methodNameGetter = methodNameGetter;
        const AssertionClass = this.AssertionClass;
        const numOfOptArgs = this.matchPatterns.length - assertorArgs.length;
        if(numOfOptArgs)  for(let i=0; i<numOfOptArgs; i++) assertorArgs.push( undefined );
        const fullAssertionFails = partial( this.doesAssertionFails, ...assertorArgs );
        const cadenas = this;
        return new AssertionClass( cadenas, fullAssertionFails, methodNameGetter, assertorArgs, this.ExceptionClass );
    }

    /**
     * An identifier that looks like the following : 'ExceptionClass.cadenasName'
     * @returns {string}
     */
    get exceptionId() {
        return this.name;
    }
    /**
     * @param {!object} config - An object holding the instantiation params
     * @param {!Function} config.AssertorClass - The cadenas class (constructor) to instantiate.
     * @param {!string} config.name
     * @param {!Function_predicate} config.doesAssertionFails - A function that returns a string if the assertion fails, false otherwise. The return value must be the 'reason',
     * i.e. a machine-readable identifier of the failure.
     * @param {?Function} config.ExceptionClass
     * @param {Array.<meteor_match_pattern=} config.matchPatterns - An array of match patterns to validate the doesAssertionFails method
     * @param {Object<string, Array.<*>>=} config.dependingCadenas - Cadenas this cadenas depends on : a dictionary which keys are cadenas names, and values are a list of arguments
     * to pass to the cadenas {@link Function_predicate}
     */
    constructor(config){
        ensuresArg('In `Cadenas` constructor : param `config`', config, Object);
        const { AssertionClass, name, doesAssertionFails, matchPatterns=[], dependingCadenas={}, ExceptionClass=SecurityException } = config;
        ensures( 'In `Cadenas` constructor : param `config.AssertionClass` must be a class inheriting from `AbstractAssertion`. ' +
            'Are you sure you didn\'t mean to call a concrete constructor like `new DefaultCadenas()`?`"', AssertionClass.prototype, Assertion );
        ensuresArg( 'In `Cadenas` constructor : param `config.doesAssertionFails`', doesAssertionFails, Function );
        ensuresArg( 'In `Cadenas` constructor : param `config.name`', name, String );
        ensuresArg( 'In `Cadenas` constructor : param `config.matchPatterns`', matchPatterns, Array );
        ensuresArg( 'In `Cadenas` constructor : param `config.dependingCadenas`', dependingCadenas, Object );
        ensuresArg( 'In `Cadenas` constructor : param `config.ExceptionClass`', ExceptionClass, Function );
        this.AssertionClass = AssertionClass;
        this.doesAssertionFails = doesAssertionFails;
        this.name = name;
        this.matchPatterns = matchPatterns;
        this.dependingCadenas = dependingCadenas;
        this.ExceptionClass = ExceptionClass;
        if(cadenasMap.get( name )) throw new Error( `Cadenas ${name} already exists` );
        cadenasMap.set( name, this );
    }
}