import { Match } from 'meteor/check'
import map from 'lodash/map';
import some from 'lodash/some';
import { Class } from 'meteor/jagi:astronomy'
import { buildAssertion } from './Cadenas';
import { ensuresArg } from '../ensures';
import Logger from '../Logger';
okChar = '✔';
failChar = '✘';
const logger = new Logger( 'cadenas' );
/**
 *
 * @param {!Object.<string, Array.<*>|*>} assertorDescriptions - Dictionary which keys are cadenas names, and values are cadenas param(s).
 * @param {!Function} methodNameGetter
 * @return {Assertion[]}
 */
function buildAssertions( assertorDescriptions, methodNameGetter ) {
    ensuresArg('`buildAssertions`', assertorDescriptions, Object);
    return map( assertorDescriptions, ( params, name ) => buildAssertion( methodNameGetter, name, params ) );
}

function verbose( verdict, reason ) {
    if( Match.test( verdict, Boolean )) return reason;
    else return `${verdict} ${reason}`;
}

/**
 *
 * @param reason
 * @param exceptionId
 * @param ExceptionClass
 * @return {error_descriptor}
 */
function buildErrorDescriptor( reason, exceptionId, ExceptionClass ) {
    return { reason, exceptionId, ExceptionClass };
}


/**
 * An assertion to be run every time the target wrapped method is called.
 */
export class Assertion {

    /**
     * @param {!Function} methodNameGetter
     * @param astroClassInstanceContext
     * @param astroMethodParams
     * @return {?error_descriptor|boolean} The first object with error details value of a depending assertion perform if any, false otherwise.
     * @private
     */
    _performDependingAssertions( methodNameGetter, astroClassInstanceContext, astroMethodParams ) {
        const dependingAssertions = buildAssertions( this.cadenas.dependingCadenas, methodNameGetter);
        let verdict = false;
        some( dependingAssertions, ( assertion ) => {
            verdict = assertion.perform( astroClassInstanceContext, astroMethodParams ) || false;
            return verdict ? buildErrorDescriptor( verbose( verdict, assertion.cadenas.reason ), assertion.cadenas.exceptionId, assertion.ExceptionClass ) : false;
        });
        return verdict;
    }

    /**
     * Apply the assertion function to the needed arguments.
     * @param {Astro.Class} astroClassInstanceContext
     * @param {Array} astroMethodParams
     * @return {?*} An truthy value if at least one among depending assertions and this assertion is failing, false if none fails.
     * @abstract
     */
    _applyAssertionFunc( astroClassInstanceContext, astroMethodParams ) {
        throw Error( 'Not yet implemented.' );
    }

    /**
     * Run the assertion.
     * Should never be overridden by a sub class.
     * @param {Astro.Class} astroClassInstanceContext
     * @param {Array} astroMethodParams
     * @return {?error_descriptor|boolean} An object with error details if at least one among depending assertions and this assertion is failing, false if none fails.
     */
    //noinspection JSUnusedLocalSymbols
    perform( astroClassInstanceContext, astroMethodParams ) {
        this.astroInstance = astroClassInstanceContext;
        this.astroMethodParams = astroMethodParams;
        let className = '';
        let dependingAssertionsOutcome = this._performDependingAssertions( this._methodNameGetter,  astroClassInstanceContext, astroMethodParams );
        if( astroClassInstanceContext instanceof Class ) className = astroClassInstanceContext.constructor.getName();
        if( dependingAssertionsOutcome ) return dependingAssertionsOutcome;
        else {
            const verdict = this._applyAssertionFunc( astroClassInstanceContext, astroMethodParams );
            if( verdict ) {
                const reason = verbose( this.cadenas.reason, verdict );
                logger.warn( `${failChar}  ${className}#${this._methodNameGetter()} : failed assertion '${this.cadenas.name}' ( ${reason} )` );
                return buildErrorDescriptor( reason, this.cadenas.exceptionId, this.ExceptionClass );
            }
            else {
                logger.info( `${okChar} ${className}#${this._methodNameGetter()} : passed assertion '${this.cadenas.name}' ( ${this.cadenas.reason} )` );
                return false;
            }
        }
    }

    /**
     * @return {!string} The name of the method or event it is being targeting.
     */
    getMethodName() {
        return this._methodNameGetter();
    }

    /**
     *
     * @param {!Cadenas} cadenas
     * @param {!Function} assertionFunc
     * @param {!Function} methodNameGetter
     * @param {!Array}  assertionArgs - The args passed to assertion
     * @param {!Function} ExceptionClass - An error constructor
     */
    constructor( cadenas, assertionFunc, methodNameGetter, assertionArgs, ExceptionClass ) {
        this.assertionFunc = assertionFunc;
        this._methodNameGetter = methodNameGetter;
        this.cadenas = cadenas;
        this.ExceptionClass = ExceptionClass;
        //noinspection JSUnusedGlobalSymbols
        this.assertionArgs = assertionArgs;
    }

    /**
     * The instance the assertion is being called upon
     * @name Assertion#astroInstance
     * @type {Astro.Class}
     */
}
