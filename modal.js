AUI.add(
    'stri-nearest-feature-modal-viewer',
    function(A) {
        var nearestFeatureModalViewer = A.Component.create({
            EXTENDS: A.Base,
            NAME: 'nearestFeatureModal',
            prototype: {
                filterBuilder: null,
                MODAL_ZINDEX: 1056,
                MODAL_WIDTH: "65%",
                MODAL_HEIGHT: "65%",
                printData: [],
                _wfsVersion: "1.0.0",
                _map: null,
                initializer: function(config) {
                    var context = this;
                    this.config = config;
                    this._randomKey = Math.floor(Math.random() * 10000000);
                    this._map = config.map;
                    this._geojson = config.geojson;
                },

                render: function() {
                    var context = this;
                    //destroy previous modal
                    if (this._modal)
                        modal.destroy();
                    var area = satraMapUtils.calcArea(this._geojson.features[0].geometry, true);
                    var perimeter = satraMapUtils.calcPerimeter(this._geojson.features[0].geometry, true);

                    this._modal = new A.Modal({
                        bodyContent: '<div id="modalBox_' + context._randomKey + '" style="height: 100%; cursor: default" class="row-fluid">\
                                                <div class="span9">\
                                                      <div id="printDiv" style="display: none; direction:rtl; font-family: b yekan"></div>\
                                                      <div style="direction:rtl; display: block; border-left: 1px solid #eee; width:100%; height: 100%" id="modal_veiwer_mainbox_' + context._randomKey + '">\
                                                      </div>\
                                                </div>\
                                                <div class="span3">\
                                                      <div id="feature_svg_' + context._randomKey + '"></div>\
                                                      <div style="display:block; width: 100%">\
                                                            <div style="line-height:28px; display:block; background-color: #f2f2f2; height: auto; padding:30px; direction:rtl; font-family:b yekan; padding: 10px">\
                                                                  ' + Liferay.Language.get("leaflet_measurement_area") + ': ' + area + ' <br/>' + Liferay.Language.get("leaflet_measurement_perimeter") + ': ' + perimeter + '\
                                                            </div>\
                                                      </div>\
                                                </div>\
                                          </div>',
                        centered: true,
                        headerContent: '<h3>' + Liferay.Language.get("leaflet_get_report") + '</h3>',
                        modal: false,
                        render: context._map.containerId,
                        width: this.MODAL_WIDTH,
                        height: this.MODAL_HEIGHT,
                        zIndex: this.MODAL_ZINDEX,
                    });

                    this._modal.render();
                    satraMapUtils.drawSVG(this._geojson, "feature_svg_" + this._randomKey);
                    this.mainBox = A.one('#modal_veiwer_mainbox_' + context._randomKey);
                    this.printDiv = A.one('#printDiv');
                    var menu = this.mainBox.appendChild('<div style="display: block; margin: 10px 25px 0px 25px; "></div>');
                    var btnAddRow = menu.appendChild('<button type="button" class="btn btn-success" style="font-family: b yekan">' + Liferay.Language.get("leaflet_add_new_report") + '</button>');
                    var btnPrint = menu.appendChild('<button type="button" style="margin-right: 10px; font-family: b yekan" class="btn btn-warning" style="font-family: b yekan">' + Liferay.Language.get("leaflet_print_results") + '</button>');
                    btnAddRow.on('click', function(e) {
                        this._addReport();
                    }, this);
                    btnPrint.on('click', function(e) {

                        if (context._printSettingsModal) {
                            context._printSettingsModal.destroy();
                        }
                        context._printSettingsModal = new A.Modal({
                            bodyContent: '<div id="settings_container" style="font-family: b yekan !important; min-height:335px; max-height: 335px; overflow-y: auto"></div><button type="button" style="font-family: b yekan;" class="btn btn-primary" id="print_finish">چاپ</button>',
                            centered: true,
                            headerContent: '<h4>' + Liferay.Language.get("leaflet_print_settings") + '</h4>',
                            modal: false,
                            width: "600",
                            height: "450",
                            zIndex: 1060,
                            render: context._map.containerId
                        }).render();

                        var settings_container = A.one("#settings_container");
                        var btnPrintFinish = A.one("#print_finish");
                        btnPrintFinish.on('click', function(e) {
                            context._print();
                        }, this);


                        for (var j = 0; j < context.printData.length; j++) {
                            context.printData[j].checkboxes = [];

                            settings_container.appendChild('<h5 class="header toggler-header-' + ((j == 0) ? 'expanded' : 'collapsed') + '">' + Liferay.Language.get("leaflet_report_fields") + ' ' + (j + 1) + '</h5>');
                            var rowContainer = settings_container.appendChild('<div class="row-fluid content toggler-content-collapsed"></div>');
                            var numCols = 4;
                            var cols = [];
                            for (var i = 0; i < numCols; i++) {
                                cols.push(rowContainer.appendChild('<div class="span' + (12 / numCols) + '"></div>'));
                            }

                            for (var i = 0; i < context.printData[j].properties.length; i++) {
                                var r = i % numCols;
                                var checkbox = cols[r].appendChild('<input  type="checkbox" ' + ((i < 8) ? 'checked="checked"' : '') + '/>');
                                cols[r].appendChild("&nbsp;" + context.printData[j].properties[i]);
                                cols[r].appendChild('<br/>');
                                context.printData[j].checkboxes.push(checkbox);

                            }
                        }

                        new A.TogglerDelegate({
                            animated: true,
                            closeAllOnExpand: false,
                            container: '#settings_container',
                            content: '.content',
                            expanded: false,
                            header: '.header',
                            transition: {
                                duration: 0.2,
                                easing: 'cubic-bezier(0, 0.1, 0, 1)'
                            }
                        });

                    }, this);
                },

                _addReport: function() {
                    /*
                    var filterBuilder = new A.FilterBuilder({map: this._map, callBack: this._addRow, context: this});
                    filterBuilder.render();
                    */
                    var rand = Math.floor(Math.random() * 1000000);
                    var context = this;
                    this._modal_layer = new A.Modal({
                        bodyContent: '<div style="min-height: 220px" id="container_' + rand + '" class="row-fluid"></div><div class="row-fluid"><button type="button" class="btn btn-primary" id="btn_' + rand + '">' + Liferay.Language.get("filter_builder_submit_report") + '</button></div>',
                        centered: true,
                        headerContent: '<h3>' + Liferay.Language.get("select-layer") + '</h3>',
                        modal: false,
                        width: 250,
                        height: 330,
                        render: "body",
                        zIndex: 1070,
                        render: context._map.containerId,
                    });
                    this._modal_layer.render();
                    var active_layers = satraMapUtils.getWmsLayers();
                    var rowContainer = A.one("#container_" + rand);

                    if (active_layers.length == 0) {
                        rowContainer.appendChild('<span>' + Liferay.Language.get("leaflet_no_active_layers") + '</span>');
                    } else {
                        context.checkboxes = [];
                        var numCols = 1;
                        var cols = [];
                        for (var i = 0; i < numCols; i++) {
                            cols.push(rowContainer.appendChild('<div class="span' + (12 / numCols) + '"></div>'));
                        }
                        var i = 0;
                        active_layers.forEach(function(layer) {
                            var layerName = layer.options.layers;
                            var title = satraMapUtils.getLayerTitle(layerName);
                            var r = i % numCols;
                            var checkbox = cols[r].appendChild('<input  type="checkbox"/>');
                            cols[r].appendChild("&nbsp;" + title);
                            cols[r].appendChild('<br/>');
                            context.checkboxes.push(checkbox);
                            i += 1;
                        });

                        var btn = A.one("#btn_" + rand);
                        btn.on('click', function(e) {
                            for (var i = 0; i < context.checkboxes.length; i++) {
                                if (context.checkboxes[i].attr('checked')) {
                                    var params = {};
                                    var layerName = active_layers[i].options.layers;var layerName = active_layers[i].options.layers;
                                    params.filter = "";
                                    if (active_layers[i].options.CQL_FILTER) {
                                        params.filter = active_layers[i].options.CQL_FILTER;
                                    } else if (active_layers[i].options.cql_filter) {
                                        params.filter = active_layers[i].options.cql_filter;
                                    }
                                    params.layerName = layerName;
                                    params.geomField = satraMapUtils.getGeomField(layerName);
                                    context._addRow(context, params);
                                }
                            }
                            context._modal_layer.destroy();
                        });
                    }




                },

                _addRow: function(context, params) {
                    // context._modal.show();
                    var mainLayer = {};
                    mainLayer.name = context._geojson.features[0].layerName;
                    mainLayer.fid = context._geojson.features[0].id;
                    mainLayer.geom_field = context._geojson.features[0].geometry_name;
                    var mainContainer = context.mainBox;
                    var container = mainContainer.appendChild('<div style="display: block; padding:25px; margin: 25px; background-color: #f2f2f2; font-family: b yekan">' + Liferay.Language.get("leaflet_please_wait") + '</div>');

                    var cql_filter = "";

                    if (context.config.draw || context.config.wkt) {
                        var wkt = "";
                        if (context.config.wkt) {
                            wkt = context.config.wkt;
                        } else {
                            wkt = satraMapUtils.toWKT(context.config.draw);
                        }

                        if (params['filter'])
                            cql_filter = params['filter'] + " AND " + "INTERSECTS(" + params.geomField + ", " + wkt + ")";
                        else
                            cql_filter = "INTERSECTS(" + params.geomField + ", " + wkt + ")";
                    } else {
                        var shape = {
                            type: context._geojson.features[0].geometry.type,
                            coordinates: context._geojson.features[0].geometry.coordinates
                        }
                        var shapeJson = JSON.stringify(shape);
                        var wktObj = new Wkt.Wkt();
                        var wkt = wktObj.read(shapeJson).write();

                        if (params['filter'])
                            cql_filter = params['filter'] + " AND " + "INTERSECTS(" + params.geomField + ", querySingle('" + mainLayer.name + "', '" + mainLayer.geom_field + "', 'IN(''" + mainLayer.fid + "'')'))";
                        else
                            cql_filter = "INTERSECTS(" + params.geomField + ", querySingle('" + mainLayer.name + "', '" + mainLayer.geom_field + "', 'IN(''" + mainLayer.fid + "'')'))";

                    }
                    var url = "/fms/ows?SERVICE=WFS&REQUEST=GetFeature&VERSION=" + context._wfsVersion + "&CQL_FILTER=" + cql_filter + "&TYPENAME=" + params.layerName + "&OUTPUTFORMAT=application/json&SRSNAME=EPSG:4326";

                    var xhttp = new XMLHttpRequest();
                    xhttp.onreadystatechange = function() {
                        if (this.status == 200 && this.readyState == 4) {
                            var json = JSON.parse(this.responseText);
                            if (json.totalFeatures)
                                context._setRow(json, container, params.layerName, context, true);
                            else {

                                //look for nearest features
                                var cql_filter = "EQUALS(" + params.geomField + ", querySingleNearest('" + params.layerName + "', '" + (params['filter'].replace(/\'/g, "''") || "INCLUDE") + "', '" + wkt + "', '" + params.geomField + "'))";
                                var url = "/fms/ows?SERVICE=WFS&REQUEST=GetFeature&VERSION=" + context._wfsVersion + "&CQL_FILTER=" + cql_filter + "&TYPENAME=" + params.layerName + "&OUTPUTFORMAT=application/json&SRSNAME=EPSG:4326";
                                var xmlhttp = new XMLHttpRequest();
                                xmlhttp.onreadystatechange = function() {
                                    if (this.readyState == 4 && this.status == 200) {
                                        var json = JSON.parse(this.responseText);
                                        if (json.totalFeatures)
                                            context._setRow(json, container, params.layerName, context);
                                    }
                                }
                                xmlhttp.open("GET", url, true);
                                xmlhttp.send();
                            }
                        }
                    }
                    xhttp.open('GET', url, true);
                    xhttp.send();
                },

                _setRow: function(result, container, layerName, context, isInside) {
                    container.empty();
                    var report = {};
                    if (isInside) {
                        container.appendChild(Liferay.Language.get("leaflet_report_template_part_a") + result.totalFeatures + Liferay.Language.get("leaflet_report_template_part_b") + satraMapUtils.getLayerTitle(layerName) + Liferay.Language.get("leaflet_report_template_part_c"));
                    } else {
                        var distanceObj = satraMapUtils.computeDistance(this._geojson, result);
                        report.distanceObj = distanceObj;
                        container.appendChild(Liferay.Language.get("leaflet_report_template_part_d") + satraMapUtils.getLayerTitle(layerName) + Liferay.Language.get("leaflet_report_template_part_e") + (Math.floor(distanceObj.val * 100) / 100) + LEAFLET_REPORT_TEMPLATE_PART_F);
                    }

                    var random_id = Math.floor(Math.random() * 1000000);
                    var link = container.appendChild('<a id="link_' + random_id + '" style="cursor:pointer; font-size: 11px; font-family: Tahoma"> [' + Liferay.Language.get("leaflet_show") + ']</a>');
                    container.appendChild('<div style="font-size: 10px important; font-family: Tahoma important; background-color: #f9f9f9; margin-top: 20px; display: none; overflow-x: scroll" id="dt_' + random_id + '"></div>');

                    result.layerName = layerName;

                    link.on('click', function(e) {
                        if (context._GJMV)
                            context._GJMV.destroy();
                        context._GJMV = new A.GeoJsonModalViewer({
                            map: context._map,
                            geojson: result
                        });
                        context._GJMV.render(true, false);

                    });
                    var columns = [];
                    var invalidCols = ['groupid', 'companyid', 'userid', 'username', 'createdate', 'modifiedda', 'statusbyu0', 'collectdat', 'statusbyus', 'statusdate', 'status', 'code_'];


                    report.properties = [];
                    for (property in result.features[0].properties) {
                        if (invalidCols.indexOf(property) == -1) {
                            columns.push({
                                key: property,
                                sortable: true
                            });
                            report.properties.push(property);
                        }
                    }
                    report.layerName = layerName;
                    report.features = result.features;
                    report.isInside = isInside;

                    var data = [];
                    for (var i = 0; i < result.features.length; i++) {
                        data.push(result.features[i].properties);
                    }
                    // var table = new A.DataTable({
                    //       columnset: columns,
                    //       recordset: data
                    // });

                    var table2 = new A.DataTable({
                        columnset: columns,
                        recordset: data
                    });

                    report.data = data;
                    context.printData.push(report);
                    // table.render("#print_" + random_id);
                    table2.render("#dt_" + random_id);
                },

                _print: function() {

                    this.printDiv.empty();
                    var counter = 0;
                    this.printData.forEach(function(report) {
                        counter += 1;
                        printRow = this.printDiv.appendChild('<div></div>');

                        if (report.isInside) {
                            printRow.appendChild(Liferay.Language.get("leaflet_report_template_part_a") + result.totalFeatures + Liferay.Language.get("leaflet_report_template_part_b") + satraMapUtils.getLayerTitle(layerName) + Liferay.Language.get("leaflet_report_template_part_c"));
                        } else {
                            printRow.appendChild("<br/>");
                            printRow.appendChild(Liferay.Language.get("leaflet_report_template_part_d") + satraMapUtils.getLayerTitle(report.layerName) + Liferay.Language.get("leaflet_report_template_part_e") + (Math.floor(report.distanceObj.val * 100) / 100) + Liferay.Language.get("leaflet_report_template_part_f"));
                        }
                        var random_id = Math.floor(Math.random() * 1000000);
                        printRow.appendChild('<div style="font-size: 10px important; font-family: Tahoma important; background-color: #f9f9f9; margin-top: 20px;" id="print_' + random_id + '"></div>');
                        var cols = [];
                        for (var i = 0; i < report.checkboxes.length; i++) {
                            if (report.checkboxes[i].attr('checked')) {
                                cols.push(report.properties[i]);
                            }
                        }
                        var table = new A.DataTable({
                            columnset: cols,
                            recordset: report.data
                        });
                        table.render('#print_' + random_id);
                    }, this);

                    var mywindow = window.open('', 'PRINT');
                    mywindow.document.write('<html><head><title>' + Liferay.Language.get("leaflet_print") + '</title>');
                    mywindow.document.write('<style>body {font-family:b yekan} td {font-family: Tahoma !important; font-size: 12px} th {font-family: Tahoma !important; font-size: 12px;}</style>');
                    mywindow.document.write('</head><body style="font-family: b yekan !important; direction:rtl">');
                    mywindow.document.write('<div style="width: 1000px; margin: auto;" class="print-container">');
                    mywindow.document.write('<h3>' + Liferay.Language.get("leaflet_report_infrastructure_access") + '</h3>');
                    mywindow.document.write('<hr/>');
                    mywindow.document.write('<div style="width: 150px; height: 150px;">');
                    mywindow.document.write(document.getElementById("feature_svg_" + this._randomKey).innerHTML);
                    mywindow.document.write('</div>');
                    mywindow.document.write(document.getElementById('printDiv').innerHTML);
                    mywindow.document.write('</div>');
                    mywindow.document.write('</body></html>');
                    mywindow.document.close(); // necessary for IE >= 10
                    mywindow.focus(); // necessary for IE >= 10*/
                    mywindow.print();
                    mywindow.close();
                    return true;
                },

                _fillLayerSelectorInput: function(input) {
                    this._map.eachLayer(function(layer) {
                        if (layer.wmsParams) {
                            input.appendChild('<option value="' + layer.options.layers + '">' + layer.options.layers + '</option>');
                        }
                    }, this);
                },

                destroy: function() {
                    this._modal.destroy();
                }
            }
        });

        A.nearestFeatureModalViewer = nearestFeatureModalViewer;
    },
    '', {
        requires: ['aui-modal', 'aui-toggler', 'datatable', 'datatable-scroll', 'aui-tree-view', 'stri-ext-pivot-d3', 'stri-ext-geo-projection', 'aui-modal', 'stri-geojson-modal-viewer']
    }
);