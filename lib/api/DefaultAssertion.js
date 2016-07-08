import { Assertion } from './Assertion';
/**
 * @class
 * @extends {Assertion}
 */
class DefaultAssertion extends Assertion {
    //noinspection JSUnusedLocalSymbols
    _applyAssertionFunc( astroClassInstanceContext, astroMethodParams ) {
        return this.assertionFunc.apply( astroClassInstanceContext, astroMethodParams );
    }
}

export default DefaultAssertion;