﻿/// <reference path="../../lib/esri.d.ts" />
define(["require", "exports", "esri/arcgis/utils", "esri/tasks/Geoprocessor", "esri/tasks/GeometryService", "esri/tasks/BufferParameters", "esri/geometry/webMercatorUtils", "esri/SpatialReference", "esri/tasks/FeatureSet", "esri/symbols/SimpleFillSymbol", "esri/graphic", "esri/config", "dojo/dom-construct", "dojo/query", "dojo/on", "dojo/dom-attr", "dojo/dom", "dojo/parser", "esri/Color"], function(require, exports, arcgisUtils, Geoprocessor, GeometryService, BufferParameters, webMercatorUtils, SpatialReference, FeatureSet, SimpleFillSymbol, Graphic, config, domConstruct, query, on, domAttr, dom, parser, Color) {
    

    var FormatInfowindowController = (function () {
        function FormatInfowindowController(map) {
            this.map = map;
            parser.parse();
            config.defaults.io.proxyUrl = "/EsriProxy/proxy.ashx";
        }
        FormatInfowindowController.prototype.start = function () {
            try  {
                var map;

                //This service is for development and testing purposes only. We recommend that you create your own geometry service for use within your applications.
                config.defaults.geometryService = new GeometryService("http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer");

                //config.defaults.io.proxyUrl = "/proxy";
                //create the map based on an arcgis online webmap id
                arcgisUtils.createMap("a193c5459e6e4fd99ebf09d893d65cf0", this.map).then(function (response) {
                    window.map = response.map;

                    //setup the geoprocessing tool that will run when users click the new link. This tool
                    //calculates the population in the specified area.
                    window.gp = new Geoprocessor("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Demographics/ESRI_Population_World/GPServer/PopulationSummary");

                    //create a link that we'll the map's popup window.
                    //The link section of the popup has a class called actionList assigned so we can
                    //use dojo/query to find the elements with this class name.
                    var link = domConstruct.create("a", {
                        "class": "action",
                        "id": "statsLink",
                        "innerHTML": "Population",
                        "href": "javascript: void(0);"
                    }, query(".actionList", window.map.infoWindow.domNode)[0]);

                    //when the link is clicked register a function that will run
                    on(link, "click", calculatePopulation);
                });

                function calculatePopulation(evt) {
                    //display a message so user knows something is happening
                    domAttr.set(dom.byId("statsLink"), "innerHTML", "Calculating...");

                    //Get the feature associated with the displayed popup and use it as
                    //input to the geoprocessing task. The geoprocessing task will calculate
                    //population statistics for the area within the specified buffer distance.
                    var feature = window.map.infoWindow.getSelectedFeature();

                    var param = new BufferParameters();
                    param.geometries = [webMercatorUtils.webMercatorToGeographic(feature.geometry)];

                    param.distances = [10]; //buffer distance
                    param.unit = GeometryService.UNIT_KILOMETER;
                    param.bufferSpatialReference = new SpatialReference({ "wkid": 4326 });
                    param.outSpatialReference = new SpatialReference({ "wkid": 102100 });
                    param.geodesic = true;

                    config.defaults.geometryService.buffer(param, function (geometries) {
                        var graphic = new Graphic(geometries[0]);
                        graphic.setSymbol(new SimpleFillSymbol().setColor(new Color([0, 255, 255, .25])));

                        window.map.graphics.add(graphic);

                        //Use the buffered geometry as input to the GP task
                        var featureSet = new FeatureSet();
                        featureSet.geometryType = "esriGeometryPolygon";
                        featureSet.features = [graphic];
                        var taskParams = {
                            "inputPoly": featureSet
                        };
                        window.gp.execute(taskParams, gpResultAvailable, gpFailure);
                    });
                }

                function gpResultAvailable(results, messages) {
                    domAttr.set(dom.byId("statsLink"), "innerHTML", "Population");

                    //clear any existing features displayed in the popup
                    window.map.infoWindow.clearFeatures();

                    //display the query results
                    var content = "";
                    if (results.length > 0) {
                        content = "Population = " + results[0].value.features[0].attributes.SUM;
                    } else {
                        content = "No Results Found";
                    }
                    window.map.infoWindow.setContent(content);
                }
                function gpFailure(error) {
                    domAttr.set(dom.byId("statsLink"), "innerHTML", "Population");

                    var details = domConstruct.create("div", {
                        "innerHTML": "Population = " + error
                    }, query(".break", window.map.infoWindow.domNode)[0], "after");
                    console.error("Error occurred: ", error);
                }
            } catch (error) {
                console.log(error);
            }
        };
        return FormatInfowindowController;
    })();
    return FormatInfowindowController;
});
//# sourceMappingURL=GPPopupLink_Controller.js.map
