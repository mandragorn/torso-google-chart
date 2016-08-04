# torso-google-chart
Adds a view behavior to torso that renders a google chart when the view is rendered.

Usage:

```
Torso.View.extend({
  template: chartTemplate,

  behaviors: {
    /**
     * Torso Data Behavior for retrieving the chart's data from the backend.
     */
    data: {
      behavior: Torso.behaviors.DataBehavior,
      cache: new Torso.Collection(),
      ids: function(cache) {
        return cache.fetchIdsByCriteria({
          page: this.view.get('page'),
          pageSize: this.view.get('pageSize')
        });
      }
    },
    /**
     * Chart behavior.
     */
    chart: {
      behavior: GoogleChartBehavior,
      /**
       * jQuery selector to bind the chart DOM to.
       */
      _chartContainerSelector: '[data-chart-container]',

      /**
       * Options for the LineChart draw method.
       */
      chartOptions: {
        title: 'Something over time',
        width: 900,
        height: 500,
        hAxis: {
          format: 'MMM d: h:mm aa'
        }
      },

      /**
       * Initialize the datasource for the chart.  Order of adding the columns matters (left to right).
       */
      _initializeChartDataSource: function(googleChartDataTable) {
        googleChartDataTable.addColumn('datetime', 'Date of Measurement');
        googleChartDataTable.addColumn('number', 'Value');
      },

      /**
       * Return the 2-d array of data to insert into the data table backing the chart.
       * The number and order of the result columns should match the columns configured in _initializeChartDataSource().
       */
      _getChartDataSourceRows: function() {
        var dataBehavior = this.view.getBehavior('data');
        var dataArray = dataBehavior.toJSON();
        var chartData = _.map(dataArray, function(data) {
          return [new Date(data.date), data.value];
        });
        return chartData;
      }
    }
  },

  /**
   * Initialize the page state for retrieving the ids and bind the event emitted
   * when the data is updated to cause the chart to update.
   */
  initialize: function() {
    this.set({
      page: 1,
      pageSize: 4
    });

    var dataBehavior = this.getBehavior('data');
    this.listenTo(dataBehavior, 'fetched', function() {
      var chartBehavior = this.getBehavior('chart');
      chartBehavior.trigger('dataUpdated');
    });
  }
});
```
