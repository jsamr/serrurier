import { ensures } from './ensures';
import { propagateSecurityException } from './api/security';
import { buildAssertion } from './api/Cadenas';
import { Match } from 'meteor/check';
import { ActionsStore } from 'meteor/svein:serrurier-decorators-core';
import last from 'lodash/last'
/**
 * @param name
 * @param {...*} params - params to give to the named cadenas
 * @example
 * ​@asserting( 'loggedUserInRole', roles.ADMIN )
 * methodThatMustBeRunByAdmin(){
 *           // method content
 * }
 *
 */
export default function cadenas(name, ...params ){
    let thatMethodName = '';
    let assertion = buildAssertion( () => thatMethodName, name, params );
    return function( target, methodName ) {
        const oldAction = target[methodName];
        ensures( 'The annotation `cadenas` must target a function, but found a '+typeof oldAction, oldAction, Function );
        thatMethodName = methodName;
        target[methodName] = function() {
            /** @type error_descriptor */
            let errorDescriptor = assertion.perform( this, arguments );
            // if at least one assertion returns an error descriptor, store it and stop proceeding assertions.
            //noinspection JSCheckFunctionSignatures
            if( Match.test( errorDescriptor, Object ) ) {
                const possibleCallback = last( arguments );
                propagateSecurityException.call( this, errorDescriptor, possibleCallback );
            }
            else return oldAction.apply( this, arguments );
        };
        ActionsStore.registerOrUpdate( target[methodName], methodName );
        return target[methodName];
    }
}