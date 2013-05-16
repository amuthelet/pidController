$(function () {
    $(document).ready(function() {
        Highcharts.setOptions({
            global: {
                useUTC: false
            }
        });
    
        var chart;
        $('#chart').highcharts({
            chart: {
                type: 'spline',
                animation: Highcharts.svg, // don't animate in old IE
                marginRight: 10,
                events: {
                    load: function() {
    
                        // set up the updating of the chart each second
                        var series = this.series;
                        setInterval(function() {
                            series[0].addPoint(myPID.outputCommand, true, true);
                            series[1].addPoint(myPID.error, true, true);
                            series[2].addPoint(myPID.integral, true, true);
                            series[3].addPoint(myPID.derivative, true, true);
                        }, 100);
                    }
                }
            },
            title: {
                text: 'PID Controller'
            },
            xAxis: {
                type: 'linear',
                minRange:300,
            },
            yAxis: [{
                title: {
                    text: 'Value1'
                },               
            },
            {
                title: {
                    text: 'Value2'
                },               
            },
            {
                title: {
                    text: 'Value3'
                },
            },               
            {
                title: {
                    text: 'Value4'
                },               
            }],
            plotOptions: {
                series: {
                    marker: {
                        enabled: false
                    }
                }
            },
            tooltip: {
                formatter: function() {
                        return '<b>'+ this.series.name +'</b><br/>'+
                        Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) +'<br/>'+
                        Highcharts.numberFormat(this.y, 2);
                }
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'top',
                x: -10,
                y: 100,
                borderWidth: 0
            },
            exporting: {
                enabled: false
            },
           series: [{
                name: 'Controller command',
                yAxis: 1,
                data: (function() {
                    // generate an array of random data
                    var data = [],
                        time = (new Date()).getTime(),
                        i;
    
                    for (i = 0; i <= 300; i++) {
                        data[i] = 0.0;
                    }
                    return data;
                })()
            },
            {
                name: 'Error',
                yAxis: 2,
                data: (function() {
                    // generate an array of random data
                    var data = [],
                        time = (new Date()).getTime(),
                        i;
    
                    for (i = 0; i <= 300; i++) {
                        data[i] = 0.0;
                    }
                    return data;
                })()
            },
            {
                name: 'Integral',
                data: (function() {
                    // generate an array of random data
                    var data = [],
                        time = (new Date()).getTime(),
                        i;
    
                    for (i = 0; i <= 300; i++) {
                        data[i] = 0.0;
                    }
                    return data;
                })()
            },
            {
                name: 'Derivative',
                data: (function() {
                    // generate an array of random data
                    var data = [],
                        time = (new Date()).getTime(),
                        i;
    
                    for (i = 0; i <= 300; i++) {
                        data[i] = 0.0;
                    }
                    return data;
                })()
            },
            ]
        });
    });
    
});