import { ensures } from './ensures';
import { propagateException } from './api/security';
import { buildAssertion } from './api/Cadenas';
import { Match } from 'meteor/check';
import { ActionsStore } from 'meteor/svein:serrurier-core';
/**
 * @param name
 * @param {...*} params - params to give to the named cadenas
 * @example
 * ​@cadenas( 'persisted' )
 * methodThatMustBeRunWhenPersisted(){
 *           // method content
 * }
 *
 */
export default function cadenas(name, ...params ) {
    let thatMethodName = '';
    let assertion = buildAssertion( () => thatMethodName, name, params );
    return function cadenasDecoratorApplier( target, methodName ) {
        const oldAction = target[methodName];
        ensures( 'The annotation `cadenas` must target a function, but found a '+typeof oldAction, oldAction, Function );
        thatMethodName = methodName;
        target[methodName] = function cadenasRunner() {
            /** @type error_descriptor */
            let errorDescriptor = assertion.perform( this, arguments );
            // if at least one assertion returns an error descriptor, store it and stop proceeding assertions.
            if( Match.test( errorDescriptor, Object ) ) {
                try {
                    propagateException.call( this, errorDescriptor );
                } catch(error){
                    error.context = Object.assign( {}, errorDescriptor );
                    throw error;
                }
            }
            else {
                try {
                    return oldAction.apply( this, arguments );
                } catch(error){
                    error.context = Object.assign( {}, error.error, error.reason );
                    throw error;
                }
            }
        };
        ActionsStore.registerOrUpdate( target[methodName], methodName );
        target[methodName]._cadenasMethod=methodName;
        return target[methodName];
    }
}