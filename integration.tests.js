import SecurityException from './lib/SecurityException';
import { Serrurier, server, cadenas } from './lib/main';
import { ValidationError } from 'meteor/mdg:validation-error';
import {
    decorateDescription,
    ActionsStore,
    Logger,
    registerIsolatedReporter
} from 'meteor/svein:serrurier-core';
import { decoratorMock, once } from 'meteor/svein:serrurier-core/lib/utils';
import { chai } from 'meteor/practicalmeteor:chai';
const expect = chai.expect;
Logger.silence();

describe( 'svein:serrurier-core with svein:serrurier', function() {
    let securityContext = { reason:'', exceptionId:'any-kind-of-error' };
    describe( 'when the `decorateDescription` function is applied to an Astro description `object`', function() {
        let description1,
            description2,
            onceBefore = once( function(){
                registerIsolatedReporter( SecurityException, function() {
                    console.info('SecurityException reporter is being called.');
                });
                description1 = decorateDescription({
                    name: 'MyAstroClass1',
                    events: {
                        eventA: function() {
                            throw new SecurityException( securityContext );
                        }
                    },
                    methods: {
                        methodA: function() {
                            throw new SecurityException( securityContext );
                        }
                    }
                });
                description2 = decorateDescription({
                    name: 'MyAstroClass2',
                    events: {
                        eventA: [
                            function() { throw new Error();},
                            function() {}
                        ]
                    },
                    methods: {
                        methodA: function() {
                            throw new Error();
                        }
                    }
                });
            });
        before( onceBefore );
        describe( 'any wrapped method called `methodName` when a reporter listen to `SecurityException`', function() {
            it( 'should have the "isSecured" property set in the store', function() {
                expect( ActionsStore.getProp( description1.methods.methodA, 'isSecured' ) ).to.be.true;
            });
            it( 'should have the "descriptor" property set to `${description.name}#${methodName}` available in the store', function() {
                expect( ActionsStore.getProp( description1.methods.methodA, 'descriptor' )).to.equal( 'MyAstroClass1#methodA' );
            });
        });
        describe( 'any first wrapped event listener called `listenerdName`', function() {
            it( 'should have the "isSecured" property set in the store', function() {
                expect( ActionsStore.getProp( description1.events.eventA[0], 'isSecured' ) ).to.be.true;
            });
            it( 'should have the "descriptor" property set to `${description.name}#${listenerdName}` available in the store', function() {
                expect( ActionsStore.getProp( description1.events.eventA[0], 'descriptor' )).to.equal( 'MyAstroClass1#eventA' );
            });
        });
        describe( 'any second wrapped event listener called `listenerName`', function() {
            it( 'should have the "descriptor" property set to `${description.name}#${listenerdName}1` available in the store', function() {
                expect( ActionsStore.getProp( description2.events.eventA[1], 'descriptor' )).to.equal( 'MyAstroClass2#eventA1' );
            });
        });
        describe( 'a `description.methods` wrapped field member that threw a `SecurityException`', function() {
            it( 'should not anymore throw an instance of `SecurityException`', function() {
                expect( function() { description1.methods.methodA(); }).not.to.throw( SecurityException );
            });
        });
        describe( 'a `description.events` wrapped field member that threw a `SecurityException`', function() {
            it( 'should not anymore throw an instance of `SecurityException` ', function() {
                expect( function() { description1.events.eventA[0](); }).not.to.throw( SecurityException );
            });
        });
        describe( 'a `description.methods` wrapped field member that threw any but a `SecurityException`', function() {
            it( 'should still throw this error', function() {
                expect( function() { description2.methods.methodA(); }).to.throw( Error );
            });
        });
        describe( 'a `description.events` wrapped field member that threw any but a `SecurityException`', function() {
            it( 'should still throw this error`', function() {
                expect( function() { description2.events.eventA[0](); }).to.throw( Error );
            });
        });

    });
});

describe( 'svein:serrurier with mdg:validation-error', function() {
    describe( 'calling a server decorated method throwing a ValidationError', function() {
        let MyClass;
        const onceBefore = once( function() {
            function thrower(){
                throw new ValidationError([
                    {
                        name: 'cost',
                        type: 'out-of-range',
                        value: 1456,
                        min: 0,
                        max: 100
                    }
                ]);
            }
            const description = {
                name: 'AClassThatShouldGoAlongWithValidationError',
                methods: {
                    methodA: thrower
                }
            };
            decoratorMock( description.methods, 'methodA', server());
            MyClass = Serrurier.createClass( description );
        });
        before( onceBefore );
        it( 'should be passed to the given callback', function() {
            (new MyClass).methodA( function( err ) {
                expect(ValidationError.is(err)).to.be.true ;
            });

        });
    });
});