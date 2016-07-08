import { Class } from 'meteor/jagi:astronomy';
import DefaultCadenas from './DefaultCadenas';
import MethodParamsCadenas from './MethodParamsCadenas';
import { validateArguments } from './Cadenas';
import StateException from '../StateException';

// cadenas shall never be exposed

//noinspection JSUnusedGlobalSymbols
const userIsLoggedIn = new DefaultCadenas({
    name: 'userIsLoggedIn',
    doesAssertionFails: () => {
        return !Meteor.userId()
    },
    reason: 'Must be logged in.'
});


/**
 * Assert running on server
 */
//noinspection JSUnusedGlobalSymbols
const onServer = new DefaultCadenas({
    name: 'onServer',
    doesAssertionFails: () => !Meteor.isServer,
    reason: 'Cannot be run client side.'
});


/**
 *Assert method arguments are matching {meteor_match_pattern}s
 */
//noinspection JSUnusedGlobalSymbols
const matchParams = new MethodParamsCadenas({
    name: 'matchParams',
    doesAssertionFails: function( methodMatchPatterns ) {
        try{
            validateArguments( this.astroMethodParams, methodMatchPatterns, () => `Method ${this.getMethodName()} arguments are invalid. ` );
        } catch(e) {
            if(e instanceof TypeError){
                return e.message;
            } else throw e;
        }
        return false;
    },
    reason: 'Invalid method arguments.',
    matchPatterns: [
        // methodMatchPatterns
        Array
    ]
});

/**
 * Assert user [userId] exists
 * Assumes that the method it is applied on has a userId as first argument.
 */
//noinspection JSUnusedGlobalSymbols
const userExists = new MethodParamsCadenas({
    name: 'userExists',
    doesAssertionFails: (userId) => !Meteor.users.findOne( userId, {_id:1} ),
    reason: 'User does not exists.',
    dependingCadenas: { 'matchParams': [ String ] }
});

/**
 * Assert this document (Astro.Class instance) has been persisted in db
 */
const persisted = new DefaultCadenas({
    name: 'persisted',
    doesAssertionFails: function() {
        return this._isNew === true;
    },
    reason: 'Cannot call this method before its target has been persisted.',
    ExceptionClass: StateException
});

/**
 * Assert the user is logged
 */
const userLoggedIn = new DefaultCadenas({
    name: 'userLoggedIn',
    doesAssertionFails: () => !Meteor.userId(),
    reason: 'Must be logged in.'
});
