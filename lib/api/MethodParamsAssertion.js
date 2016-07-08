import { Assertion } from './Assertion';
/**
 * An assertion applying to the astro class method arguments.
 * @class
 * @extends {Assertion}
 */
export default class MethodParamsAssertion extends Assertion {

    _applyAssertionFunc( astroClassInstanceContext, astroMethodParams ) {
        return this.assertionFunc.apply( this, astroMethodParams );
    }
}