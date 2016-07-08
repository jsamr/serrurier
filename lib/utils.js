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

    function SerrurierException( context={} ) {
        this.stack = normalizeStack( Error.call( this ).stack, this.name );
        this._context = context;
        Object.defineProperty( this,'message', {
            'get': function() {
                return `[${this._context.exceptionId}] ${this._context.reason}`;
            }
        });
        Object.defineProperty( this,'error', {
            'get': function() {
                return this._context.exceptionId;
            }
        });
        Object.defineProperty( this,'reason', {
            'get': function() {
                return this._context.reason;
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
        name : {
            value: name
        }
    });
    return SerrurierException;
};