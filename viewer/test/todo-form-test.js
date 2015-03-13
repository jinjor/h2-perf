var jsdom = require('jsdom').jsdom;
global.document = jsdom('<html><body></body></html>');
global.window = document.defaultView;
global.navigator = window.navigator;

var should = require('should');
var sinon = require('sinon');

describe('todo-form', function() {
    it('should keep input value when submission failed', function() {
        var React = require('react/addons');
        var TodoForm = require('../src/todo-form.js');
        var TestUtils = React.addons.TestUtils;
        var TodoStorage = {
            create: function(name, callback) {
                callback(name === 'ok' ? null : 'error');
            }
        };
        TodoStorageSpy = sinon.spy(TodoStorage, 'create');

        var form = TestUtils.renderIntoDocument( <TodoForm todoStorage={TodoStorage}/> );

        var input = TestUtils.scryRenderedDOMComponentsWithTag(form, 'input')[0];
        var button = TestUtils.scryRenderedDOMComponentsWithTag(form, 'input')[1];

        TestUtils.Simulate.change(input, {
            target: {
                value: 'ok'
            }
        });
        TestUtils.Simulate.submit(button);

        TodoStorageSpy.withArgs('ok').callCount.should.equal(1);
        input.getDOMNode().value.should.equal('');

        TestUtils.Simulate.change(input, {
            target: {
                value: 'ng'
            }
        });
        TestUtils.Simulate.submit(button);

        TodoStorageSpy.withArgs('ng').callCount.should.equal(1);
        input.getDOMNode().value.should.equal('ng');
    });
});