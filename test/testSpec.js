var GoogleChartBehavior = require('../GoogleChartBehavior');
var Torso = require('backbone-torso');

var ViewWithGoogleChartBehavior = Torso.View.extend({
  behaviors: {
    googleChartBehavior: {
      behavior: GoogleChartBehavior
    }
  }
});

var ViewWithMultipleGoogleChartBehaviors = Torso.View.extend({
  behaviors: {
    googleChartBehavior1: {
      behavior: GoogleChartBehavior
    },
    googleChartBehavior2: {
      behavior: GoogleChartBehavior
    },
    googleChartBehavior3: {
      behavior: GoogleChartBehavior
    }
  }
});

var MockGoogleDataTable = Torso.Cell.extend({
  addRows: function(data) {
    this.set('rows', rows);
  },
  getNumberOfRows: function() {
    var rows = this.get('rows');
    return (rows && rows.length) || 0
  },
  removeRows: function() {
    this.unset('rows');
  }
});

var MockGoogleChart = Torso.Cell.extend({
  constructor: function(el, options) {
    Torso.Cell.apply(this, {}, options);
    this.set('el', el);
  },
  draw: function(data, options) {
    this.set('data', data);
    this.set('options', options);
  }
});

var mockGoogle = {
  visualization: {
    DataTable: MockGoogleDataTable,
    LineChart: MockGoogleChart.extend({ type: 'lineChart' }),
    OtherChart: MockGoogleChart.extend({ type: 'otherChart' })
  },
  charts: {
    setOnLoadCallback: function(callback) {
      return callback();
    }
  }
};


beforeAll(function() {
  window.google = mockGoogle;
});

afterAll(function() {
  delete window.google;
});

describe('The testing setup', function() {
  it('has a mock google instance for testing.', function() {
    expect(window.google).toBeDefined();
    expect(window.google.visualization).toBeDefined();
    expect(window.google.visualization.LineChart).toBeDefined();
    expect(new window.google.visualization.LineChart()).toEqual(jasmine.any(MockGoogleChart));
  });
});

describe('GoogleChartBehavior', function() {
  it('can be added to a view.', function() {
    var viewWithGoogleChartBehavior = new ViewWithGoogleChartBehavior();
    expect(viewWithGoogleChartBehavior).toBeDefined();
    expect(viewWithGoogleChartBehavior.getBehavior('googleChartBehavior')).toBeDefined();
    expect(viewWithGoogleChartBehavior.getBehavior('googleChartBehavior')).toEqual(jasmine.any(GoogleChartBehavior));
  });

  it('can configure the type of chart to use through Behavior properties.', function() {
    var ViewWithGoogleChartBehavior_differentChartType = Torso.View.extend({
      behaviors: {
        googleChartBehavior: {
          behavior: GoogleChartBehavior,
          ChartType: function() {
            return google.visualization.OtherChart;
          }
        }
      }
    });

    var viewWithGoogleChartBehavior_differentChartType = new ViewWithGoogleChartBehavior_differentChartType();
    var googleChartBehavior_differentChartType = viewWithGoogleChartBehavior_differentChartType.getBehavior('googleChartBehavior');
    googleChartBehavior_differentChartType.trigger('dataUpdated');
    viewWithGoogleChartBehavior_differentChartType.render();

<<<<<<< HEAD
    expect(googleChartBehavior_differentChartType._chart).toBeDefined();
=======
>>>>>>> 01c9b4e... Adding GoogleChartBehavior code.
    expect(googleChartBehavior_differentChartType._chart.type).toBe('otherChart');

  });
});

describe('Multiple GoogleChartBehaviors', function() {
  it('can be added to a view.', function() {
    var viewWithMultipleGoogleChartBehaviors = new ViewWithMultipleGoogleChartBehaviors();
    expect(viewWithMultipleGoogleChartBehaviors).toBeDefined();
    expect(viewWithMultipleGoogleChartBehaviors.getBehavior('googleChartBehavior1')).toBeDefined();
    expect(viewWithMultipleGoogleChartBehaviors.getBehavior('googleChartBehavior2')).toBeDefined();
    expect(viewWithMultipleGoogleChartBehaviors.getBehavior('googleChartBehavior3')).toBeDefined();
  });
});
