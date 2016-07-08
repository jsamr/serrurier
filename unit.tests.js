import { Assertion } from './lib/api/Assertion'
import SecurityException from './lib/SecurityException';
import ValidationException from './lib/ValidationException';
import MethodParamsAssertion from './lib/api/MethodParamsAssertion';
import DefaultAssertion from './lib/api/DefaultAssertion';
import MethodParamsCadenas from './lib/api/MethodParamsCadenas';
import DefaultCadenas from './lib/api/DefaultCadenas';
import cadenas from './lib/cadenas-decorator';
import { decoratorMock } from 'meteor/svein:serrurier-decorators-core/lib/utils';
import _ from 'lodash';
import { chai } from 'meteor/practicalmeteor:chai';

const expect = chai.expect;
const getMethodName = () => 'methodName';
const verboseReason = 'This is some verbose reason justifying why the assertion failed';

const alwaysFailing = {
    doesAssertionFails: (arg1) => {
        return arg1;
    },
    reason: 'I always fail.',
    matchPatterns: [ String ]
};
const alwaysPassing = {
    doesAssertionFails: () => {
        return null;
    },
    reason: 'I always pass.'
};
const alwaysFailingDefaultCadenas = new DefaultCadenas( _.extend({
        name: 'alwaysFailingDefaultCadenas'
    }, alwaysFailing )
);
const alwaysPassingDefaultCadenas = new DefaultCadenas( _.extend({
        name: 'alwaysPassingDefaultCadenas'
    }, alwaysPassing )
);
const alwaysFailingMethodParamsAssertor = new MethodParamsCadenas( _.extend({
        name: 'alwaysFailingMethodParamsAssertor'
    }, alwaysFailing )
);
const alwaysPassingMethodParamsAssertor = new MethodParamsCadenas( _.extend({
        name: 'alwaysPassingMethodParamsAssertor'
    }, alwaysPassing )
);
const methodArgMustBeAStringAssertor = new MethodParamsCadenas({
    name: 'methodArgMustBeAStringAssertor',
    doesAssertionFails: (methodArg) => {
        return typeof methodArg !== 'string';
    },
    reason:'Target method argument should be a string'

});

describe('svein:serrurier', function() {
    describe('in a `DefaultCadenas` instance', function () {
        describe('the method `toAssertion`', function () {
            let assertion = alwaysFailingDefaultCadenas.toAssertion( [verboseReason], getMethodName );
            it( 'should return a `DefaultAssertion` instance', function () {
                expect(assertion).to.be.an.instanceof(DefaultAssertion);
            });
            it( 'should throw a `TypeError` when it is called with a wrong number of elements in `assertorArgs` array argument', function () {
                expect(function () {
                    alwaysFailingDefaultCadenas.toAssertion([], getMethodName)
                }).to.throw( TypeError );
            });
        });
    });
    describe('in a `MethodParamsAssertor` instance', function () {
        describe('the method `toAssertion`', function () {
            let alwaysFailing = alwaysFailingMethodParamsAssertor.toAssertion( [verboseReason], getMethodName );
            let alwaysPassing = alwaysPassingMethodParamsAssertor.toAssertion( [verboseReason], getMethodName );
            it('should return a `MethodParamsAssertion` instance', function () {
                expect(alwaysFailing).to.be.an.instanceof( MethodParamsAssertion );
            });
            it('should throw a `TypeError` when it is called with a wrong number of elements in `assertorArgs` array argument', function () {
                expect(function () {
                    alwaysFailingMethodParamsAssertor.toAssertion( [], getMethodName )
                }).to.throw(TypeError);
            });
            it('should return a falsy value when the `doesAssertionFails` method returns a null value', function () {
                let t = expect(alwaysPassing.perform( null, [] )).not.to.be.ok;
            });
        });
    });
    describe('in a `DefaultAssertion` instance', function () {
        describe('the method `perform`', function () {
            let alwaysFailing = alwaysFailingDefaultCadenas.toAssertion( [verboseReason], getMethodName );
            let alwaysPassing = alwaysPassingDefaultCadenas.toAssertion( [verboseReason], getMethodName );
            it('should return an security report of type object with fields `exceptionId` and `reason` when  the `doesAssertionFails` method returns a non null value', function () {
                expect(alwaysFailing.perform( null, []) ).to.be.a( 'object' ).to.have.property( 'reason' );
                expect(alwaysFailing.perform( null, []) ).to.be.a( 'object' ).to.have.property( 'exceptionId' );
            });
            it('should return a falsy value when the `doesAssertionFails` method returns a null value', function () {
                let t = expect(alwaysPassing.perform(null, [])).not.to.be.ok;
            });
        });
    });
    describe('in a `MethodParamsAssertion` instance', function () {
        describe('the method `perform`', function () {
            let alwaysFailing = alwaysFailingMethodParamsAssertor.toAssertion( [verboseReason], getMethodName );
            let alwaysPassing = alwaysPassingMethodParamsAssertor.toAssertion( [verboseReason], getMethodName );
            it('should return an security report of type object with fields `exceptionId` and `reason` when the `doesAssertionFails` method returns a non null value', function () {
                expect( alwaysFailing.perform(null, []) ).to.be.a( 'object' ).to.have.property( 'reason' );
                expect( alwaysFailing.perform(null, []) ).to.be.a( 'object' ).to.have.property( 'exceptionId' );
            });
            it('should return a falsy value when the `doesAssertionFails` method returns a null value', function () {
                let t = expect(alwaysPassing.perform(null, [])).not.to.be.ok;
            });
        });
    });
    describe( 'a method decorated with `cadenas`', function () {
        describe( 'describing a `DefaultCadenas` instance', function () {
            it( 'should throw an error of type `SecurityException` when the bound assertion fails ', function () {
                let targetCandidate = {
                    someMethod: function () { }
                };
                decoratorMock( targetCandidate, 'someMethod', cadenas( 'alwaysFailingDefaultCadenas', 'assertion argument 1' ));
                expect(function () {
                    targetCandidate.someMethod();
                }).to.throw( SecurityException );
            });
        });
        describe('describing a `MethodParamsAssertor` instance', function () {
            let targetCandidate = {
                someMethod: function () { }
            };
            decoratorMock( targetCandidate, 'someMethod', cadenas( 'methodArgMustBeAStringAssertor' ));
            it('should throw an error of type `ValidationException` when the bound assertion fails ', function () {
                expect(function () {
                    // must fail because the first argument is not a string
                    targetCandidate.someMethod( {} );
                }).to.throw( ValidationException );
            });

            it('should not throw an error of type `SecurityException` when the bound assertion passes ', function () {
                expect(function () {
                    // must passes because the first argument is a string
                    targetCandidate.someMethod( 'methodArgument1' );
                }).not.to.throw( SecurityException );
            });
        });

    });
    describe('a method decorated with multiple `cadenas`s', function () {
        it('should apply all those assertions', function () {
            let targetCandidate1 = {
                someMethod: function () {}
            };
            // mock the @decorator
            decoratorMock( targetCandidate1, 'someMethod', cadenas( 'alwaysFailingDefaultCadenas', 'assertion argument 1' ));
            decoratorMock( targetCandidate1, 'someMethod', cadenas( 'alwaysPassingDefaultCadenas', 'assertion argument 1' ));
            let targetCandidate2 = {
                someMethod: function () {}
            };
            // mock the @decorator
            decoratorMock( targetCandidate2, 'someMethod', cadenas( 'alwaysPassingDefaultCadenas', 'assertion argument 1' ));
            decoratorMock( targetCandidate2, 'someMethod', cadenas( 'alwaysFailingDefaultCadenas', 'assertion argument 1' ));
            expect( function () {
                targetCandidate1.someMethod();
            }).to.throw( SecurityException );
            expect( function () {
                targetCandidate2.someMethod();
            }).to.throw( SecurityException );
        });
    });
});