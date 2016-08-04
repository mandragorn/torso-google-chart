(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['underscore', 'backbone-torso'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone-torso'));
  } else {
    root.Torso = root.Torso || {};
    factory(root._, root.Torso);
  }
}(this, function(_, Torso) {
  'use strict';
  
  Torso.Extensions = Torso.Extensions || {};

  /**
   * @class GoogleChartBehavior
   * @constructor
   * @param options {Object} configuration for this behavior.
   *   @param [options._getChartType=this._getChartType] {Function} See GoogleChartBehavior._getChartType for details.
   *   @param [options._chartOptions=this._chartOptions] {Object|Function} See GoogleChartBehavior._chartOptions for details.
   *   @param [options._chartContainerSelector=this._chartContainerSelector] {String|Function} See GoogleChartBehavior._chartContainerSelector for details.
   *   @param [options._createChartDataSource=this._createChartDataSource] {Function} See GoogleChartBehavior._createChartDataSource for details.
   *   @param [options._initializeChartDataSource=this._initializeChartDataSource] {Function} see GoogleChartBehavior._initializeChartDataSource for details.
   *   @param [options._resetChartDataSource=this._resetChartDataSource] {Function} see GoogleChartBehavior._resetChartDataSource for details.
   *   @param [options._fillChartDataSource=this._fillChartDataSource] {Function} see GoogleChartBehavior._fillChartDataSource for details.
   *   @param [options._getChartDataSourceRows=this._getChartDataSourceRows] {Function} see GoogleChartBehavior._getChartDataSourceRows for details.
   * @author jyoung
   */
  Torso.Extensions.GoogleChartBehavior = Torso.Behavior.extend({
    /**
     * A function that will return the constructor to use when creating the google chart.
     * Deferred to a function so that it can be run after google charts has loaded.
     * @method _getChartType
     * @return {Function} a constructor for a google chart.  Default value is google.visualization.LineChart
     * @private
     */
    _getChartType: function() {
      return google.visualization.LineChart;
    },

    /**
     * The configuration to use for the google chart or a function that returns the options to use.  The function is scoped to this behavior.
     * @property _chartOptions {Object|Function}
     * @default null
     * @private
     */
    _chartOptions: null,

    /**
     * The jQuery selector to use to identify the DOM element owned by this view that will contain the chart.
     * The container element will be ignored by template renderer - it will only be updated by the chart's draw function.
     * Can be the selector as a string or a function that returns the jQuery selector string.  The function will be scoped to this behavior.
     * @property _chartContainerSelector {String|Function}
     * @default '[data-container=chart]'
     * @private
     */
    _chartContainerSelector: '[data-chart-container]', 

    /**
     * @method initialize
     * @param options {Object} configuration for this behavior.
     *   @param [options._getChartType=this._getChartType] {Function} See GoogleChartBehavior._getChartType for details.
     *   @param [options._chartOptions=this._chartOptions] {Object|Function} See GoogleChartBehavior._chartOptions for details.
     *   @param [options._chartContainerSelector=this._chartContainerSelector] {String|Function} See GoogleChartBehavior._chartContainerSelector for details.
     *   @param [options._createChartDataSource=this._createChartDataSource] {Function} See GoogleChartBehavior._createChartDataSource for details.
     *   @param [options._initializeChartDataSource=this._initializeChartDataSource] {Function} see GoogleChartBehavior._initializeChartDataSource for details.
     *   @param [options._resetChartDataSource=this._resetChartDataSource] {Function} see GoogleChartBehavior._resetChartDataSource for details.
     *   @param [options._fillChartDataSource=this._fillChartDataSource] {Function} see GoogleChartBehavior._fillChartDataSource for details.
     *   @param [options._getChartDataSourceRows=this._getChartDataSourceRows] {Function} see GoogleChartBehavior._getChartDataSourceRows for details.
     * @override
     */
    initialize: function(options) {
      options = options || {};
      this._getChartType = options._getChartType || this._getChartType;
      this._chartOptions = options._chartOptions || this._chartOptions;
      this._chartContainerSelector = options._chartContainerSelector || this._chartContainerSelector;
      this.view._templateRendererIgnoreElements = this.view._templateRendererIgnoreElements || [];
      this.view._templateRendererIgnoreElements.push(this._chartContainerSelector);
      this._createChartDataSource = options._createChartDataSource || this._createChartDataSource;
      this._initializeChartDataSource = options._initializeChartDataSource || this._initializeChartDataSource;
      this._resetChartDataSource = options._resetChartDataSource || this._resetChartDataSource;
      this._fillChartDataSource = options._fillChartDataSource || this._fillChartDataSource;
      this._getChartDataSourceRows = options._getChartDataSourceRows || this._getChartDataSourceRows;

      _.bindAll(this, '_googleChartsInitialized', '__addChartContainerToRendererIgnoreElements');
      this.set('googleChart.initialized', false);
      this.on('change:googleChart.initialized', this.view.render, this.view);

      this.on('dataUpdated', this._loadDataTable);
    },

    /**
     * Make sure the view is fully initialized before possibly triggering a read of the data on the view.
     * @method postinitialize
     * @private
     */
    postinitialize: function() {
      var view = this.view;
      view.templateRendererOptions = _.wrap(view.templateRendererOptions, this.__addChartContainerToRendererIgnoreElements);
      google.charts.setOnLoadCallback(this._googleChartsInitialized);
    },

    /**
     * Create the chart if it hasn't been already and then runs the draw method of the chart to [re-]render it.
     * @method postrender
     */
    postrender: function() {
      if (this._chartDataSource) {
        if (!this._chart) {
          var ChartType = this._getChartType();
          var chartContainerSelector = _.result(this, '_chartContainerSelector');
          var chartContainer = this.view.$el.find(chartContainerSelector)[0];
          this._chart = new ChartType(chartContainer);
        }
        var chartOptions = _.result(this, '_chartOptions');
        this._chart.draw(this._chartDataSource, chartOptions);
      }
    },

    /**
     * Adds to the ignore elements array
     */
    __addChartContainerToRendererIgnoreElements: function(originalTemplateRendererOptions) {
      var view = this.view;
      var viewTemplateRendererOptions;
      if (_.isFunction(originalTemplateRendererOptions)) {
        var viewBoundTemplateRendererOptions = _.bind(originalTemplateRendererOptions, view);
        viewTemplateRendererOptions = viewBoundTemplateRendererOptions();
      } else if(_.isObject(originalTemplateRendererOptions)) {
        viewTemplateRendererOptions = _.extend({}, originalTemplateRendererOptions);
      }

      var templateRendererOptions = viewTemplateRendererOptions || {};
      templateRendererOptions.ignoreElements = templateRendererOptions.ignoreElements || [];
      // Copy the array we want to add to so we don't modify a shared array.
      templateRendererOptions.ignoreElements = templateRendererOptions.ignoreElements.slice();

      var chartContainerSelector = _.result(this, '_chartContainerSelector');
      templateRendererOptions.ignoreElements.push(chartContainerSelector);
      return templateRendererOptions;
    },

    /**
     * If google charts has been loaded, then updates the datasource of the chart.  The chart will use the
     * new data the next time the view is rendered.  Running this does not automatically cause a render.
     * @method _loadDataTable
     * @private
     */
    _loadDataTable: function() {
      if (this.get('googleChart.initialized')) {
        var chartDataSource = this._chartDataSource;
        if (!chartDataSource) {
          chartDataSource = this._createChartDataSource();
        } else {
          chartDataSource = this._resetChartDataSource(chartDataSource);
        }

        this._fillChartDataSource(chartDataSource);

        this._chartDataSource = chartDataSource;
      }
    },

    /**
     * This method is run once google charts has finished loading and informs the view that the google
     * framework is loaded and ready to use.  It also loads the data table in case it hasn't been loaded yet and
     * there is data already ready to load.
     * @method _googleChartsInitialized
     * @private
     */
    _googleChartsInitialized: function() {
      this.set('googleChart.initialized', true);
      this._loadDataTable();
    },

    /**
     * Allows overriding the data source to use for the chart.
     * The datasource should be anything valid for the data attribute of this chart's .draw(data[, options]) method.
     * See https://developers.google.com/chart/interactive/docs/reference#visdraw for details.
     * This should also handle initializing the chart (with columns, etc.).
     * By default this will create a DataTable and initialize it using _initializeChartDataSource(chartDataSource).
     * @method _createChartDataSource
     * @return the instantiated datasource to use for this chart.
     * @private
     */
    _createChartDataSource: function() {
      var dataTableSource = new google.visualization.DataTable();
      this._initializeChartDataSource(dataTableSource);
      return dataTableSource;
    },

    /**
     * Initialization of the datasource after it is created.
     * Default is a no-op.  The view should override this when configuring the behavior to setup columns, etc.
     * @method _initializeChartDataSource
     * @param chartDataSource {Object} the newly created data source to configure.
     * @private
     */
    _initializeChartDataSource: _.noop,

    /**
     * Resets the data source when the data changes after creation.
     * Default is to remove all existing rows.  Override if creating a new datasource or some other method
     * of clearing is preferred.
     * @method _resetChartDataSource
     * @param chartDataSource {Object} the datasource to reset.
     * @return {Object} the data source to use after data is updated, returned to give the option of creating a new one.
     * @private
     */
    _resetChartDataSource: function(chartDataSource) {
      chartDataSource.removeRows(0, chartDataSource.getNumberOfRows());
      return chartDataSource;
    },

    /**
     * Fills the chart's datasource.
     * By default uses the result of view._getChartDataSourceRows() and passes it into the chart data source's .addRows() method.
     * More info on the addRows() method: https://developers.google.com/chart/interactive/docs/reference#DataTable_addRows
     * @method _fillChartDataSource
     * @param chartDataSource {Object} the datasource to fill.
     * @private
     */
    _fillChartDataSource: function(chartDataSource) {
      var chartDataSourceRows = this._getChartDataSourceRows();
      if (chartDataSourceRows) {
        chartDataSource.addRows(chartDataSourceRows);
      }
    },

    /**
     * Returns an object that is appropriate for passing into the addRows() method of the datasource.
     * More info on the addRows() method: https://developers.google.com/chart/interactive/docs/reference#DataTable_addRows
     * @method _getChartDataSourceRows
     * @return {Array[]} a 2-d array suitable to pass in to google dataTable's addRows() method.
     * @private
     */
    _getChartDataSourceRows: _.noop,

    /**
     * Clean up the chart resource when the behavior is disposed.
     * @method _dispose
     * @private
     */
    _dispose: function() {
      if (this._chart) {
        this._chart.clearChart();
      }
    }
  });
  
  return Torso.Extensions.GoogleChartBehavior;
}));
