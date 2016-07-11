import { Meteor } from 'meteor/meteor';
export function normalizeStack( stack, type ) {
    let lines = stack.split('\n');
    lines.splice( 0, 3 );
    return `${type} \n${lines.join('\n')}`;
}

/**
 * Create a Meteor.Error specific for the Serrurier API.
 * @param {String} name
 * @returns {SerrurierException} An exception that extends Meteor.Error, i.e. that can be send through websockets.
 */
export const createSerrurierException = function( name ) {

    function SerrurierException( exceptionId = 'UNKNOWN', reason = 'UNKNOWN' ) {
        this.stack = normalizeStack( Error.call( this ).stack||'', this.name );
        Object.defineProperty( this,'message', {
            'get': function() {
                return `[${exceptionId}] ${reason}`;
            }
        });
        Object.defineProperty( this,'error', {
            'get': function() {
                return `${this.name}.${exceptionId}`;
            }
        });
        Object.defineProperty( this, 'details', {
            'get': function() {
                return name;
            }
        });
        Object.defineProperty( this, 'reason', {
            'get': function() {
                return reason;
            }
        });
    }
    // See the trickery here : http://stackoverflow.com/a/17891099
    SerrurierException.prototype = Object.create( Meteor.Error.prototype, {
        constructor: {
            value: SerrurierException,
            writable: false,
            configurable: true
        },
        name: {
            'get': function() {
                return name;
            }
        }
    });
    return SerrurierException;
};