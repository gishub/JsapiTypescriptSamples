﻿/// <reference path="../../lib/esri.d.ts" />

import Map = require("esri/map");
import Locator = require("esri/tasks/locator");
import Graphic = require("esri/graphic");
import InfoTemplate = require("esri/InfoTemplate");
import SimpleMarkerSymbol = require("esri/symbols/SimpleMarkerSymbol");
import Font = require("esri/symbols/Font");
import TextSymbol = require("esri/symbols/TextSymbol");
import arrayUtils = require("dojo/_base/array");
import Color = require("esri/Color");
import number = require("dojo/number");
import parser = require("dojo/parser");
import dom = require("dojo/dom");
import registry = require("dijit/registry");
import esriConfig = require("esri/config");

export = LocatorAddressController;

class LocatorAddressController {
        
    constructor(public map: string) {
        parser.parse();
        esriConfig.defaults.io.proxyUrl = "/EsriProxy/proxy.ashx";
    }

    start() {

        try {
            var map, locator;

            map = new Map(this.map, {
                basemap: "streets",
                center: [-93.5, 41.431],
                zoom: 5
            });

            locator = new Locator("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
            locator.on("address-to-locations-complete", showResults);

            // listen for button click then geocode
            registry.byId("locate").on("click", locate);
            //on(dom.byId("locate"), "click", locate);
            
            map.infoWindow.resize(200, 125);

        function locate() {
                console.log("click")
                map.graphics.clear();
                var address = {
                    "SingleLine": dom.byId("address").value
                };
                locator.outSpatialReference = map.spatialReference;
                var options = {
                    address: address,
                    outFields: ["Loc_name"]
                }
            console.log("click")
              locator.addressToLocations(options);
            }

            function showResults(evt) {
                var candidate;
                var symbol = new SimpleMarkerSymbol();
                var infoTemplate = new InfoTemplate(
                    "Location",
                    "Address: ${address}<br />Score: ${score}<br />Source locator: ${locatorName}"
                    );
                symbol.setStyle(SimpleMarkerSymbol.STYLE_SQUARE);
                symbol.setColor(new Color([153, 0, 51, 0.75]));

                var geom;
                arrayUtils.every(evt.addresses, function (candidate) {
                    console.log(candidate.score);
                    if (candidate.score > 80) {
                        console.log(candidate.location);
                        var attributes = {
                            address: candidate.address,
                            score: candidate.score,
                            locatorName: candidate.attributes.Loc_name
                        };
                        geom = candidate.location;
                        var graphic = new Graphic(geom, symbol, attributes, infoTemplate);
                        //add a graphic to the map at the geocoded location
                        map.graphics.add(graphic);
                        //add a text symbol to the map listing the location of the matched address.
                        var displayText = candidate.address;
                        var font = new Font(
                            "16pt",
                            Font.STYLE_NORMAL,
                            Font.VARIANT_NORMAL,
                            Font.WEIGHT_BOLD,
                            "Helvetica"
                            );

                        var textSymbol = new TextSymbol(
                            displayText,
                            font,
                            new Color("#666633")
                            );
                        textSymbol.setOffset(0, 8);
                        map.graphics.add(new Graphic(geom, textSymbol));
                        return false; //break out of loop after one candidate with score greater  than 80 is found.
                    }
                });
                if (geom !== undefined) {
                    map.centerAndZoom(geom, 12);
                }
            }
        }
        catch (error) {
            console.log(error);
        }
    }
}