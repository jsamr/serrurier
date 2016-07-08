import { ActionsStore } from 'meteor/svein:serrurier-decorators-core';
import { ensures } from './ensures';
import Meteor from 'meteor/meteor';


/**
 * Decoration to mark this method as to be executed on server.
 * @return {Function}
 */
export default function server(){
    return function( target, methodName ){
        const targetMethod = target[methodName];
        ensures( 'The annotation `server` must target a function, but found a '+typeof targetMethod, targetMethod, Function );
        ActionsStore.registerOrUpdate( targetMethod, methodName );
        ActionsStore.setProp( targetMethod, 'onServer', true );
        return targetMethod;
    }
}