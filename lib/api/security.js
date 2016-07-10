import { Match } from 'meteor/check';
import SecurityException from '../SecurityException';

/**
 * Throws a SecurityException. If a callback has been provided, send it the error.
 * Must be bound to 'this' for callback to keep 'this' context
 * @paral {!object} errorDescriptor
 * @param {!string} errorDescriptor.reason - An information about the forbidden access.
 * @param {!string} errorDescriptor.exceptionId - A unique identifier for this error
 * @param {?string=} errorDescriptor.ExceptionClass - The error to throw
 * @throws {SecurityException} Always.
 */
export function propagateException( errorDescriptor ) {
    let ExceptionClass = errorDescriptor.ExceptionClass || SecurityException;
    throw new ExceptionClass( errorDescriptor.exceptionId, errorDescriptor.reason );
}