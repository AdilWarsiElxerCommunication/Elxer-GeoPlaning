import React, { useCallback, useState, useEffect, useMemo } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  useLoadScript,
  Marker,
} from "@react-google-maps/api";

import "./Map.css";

const parser = require("json-xml-parse");
const beautify = require("js-beautify/js").js;
// const js2xmlparser = require("js2xmlparser");

const SimpleMap = () => {
  const [marker, setMarker] = useState([]);
  const [map, setMap] = useState();
  const [center, setCenter] = useState({
    lat: 21.2365405,
    lng: 81.6157633,
  });
  const [centerHandler, setCenterHandler] = useState(true);

  useEffect(() => {
    if (map) {
      setMarker((prev) => {
        return [...prev, map];
      });
    }
  }, [map]);

  useEffect(() => {
    if (marker?.length !== 0) {
      let geoCoordinates = JSON.stringify(marker);
      sessionStorage.setItem("Geo. Coordinates", geoCoordinates);

      if (centerHandler) {
        setCenter(marker.slice(-1)[0]);
      }
    }
  }, [marker]);

  useEffect(() => {
    let geoCoordinates = JSON.parse(sessionStorage.getItem("Geo. Coordinates"));
    if (geoCoordinates) {
      setMarker(geoCoordinates);
    }
  }, []);

  // -------------------------- Basic style for google map starts below ------------------------------------->
  const containerStyle = {
    width: "88vw",
    height: "100vh",
  };

  const defaultProps = {
    center: {
      Coordinate: marker?.length ? `${marker?.length + 1}` : 1,
      lat: 21.2365405,
      lng: 81.6157633,
    },
  };

  const zoom = 13;

  // -------------------------- Function to load google map starts below ----------------------------------->
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyBKO945pSEA3BoRajAB0ZlY8PpQRfo0abw",
  });

  const onLoad = useCallback(function callback(map) {
    const bounds = new window.google.maps.LatLngBounds(defaultProps.center);
    // map.fitBounds(bounds);
    setMap(null);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  //---------------------- Function to set new geo. coordinates starts below ------------------------------>
  const setGeoCoordinate = (e) => {
    setMap({
      Coordinate: `${marker?.length + 1}`,
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    });
    setCenter({
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    });
    setCenterHandler(true);
  };

  //------------ Function to display all geo. coordinates on console starts below ----------------------->
  const extractCoordinate = () => {
    let coordinates = JSON.parse(sessionStorage.getItem("Geo. Coordinates"));
    if (coordinates?.length) {
      const coordinateData = {
        gpx: {},
      };

      coordinates.forEach((m, i) => {
        coordinateData.gpx[`wpt-${i + 1}`] = {
          ["Coordinate"]: { lat: m.lat, lon: m.lng },
          name: `WP-${i + 1}`,
        };
      });

      console.log(coordinateData);

      // console.log(coordinates);
      alert("Open Console to Check detail of Coordinates");
    } else {
      alert("No Geographical Coordinates Available!");
    }
  };

  //---------------------- Function to remove single geo. coordinates starts below ------------------------>
  const deleteCoordinate = (e) => {
    let lat = e.latLng.lat();
    let lng = e.latLng.lng();

    let markData = marker.filter((mark) => {
      return mark.lat !== lat;
    });
    markData = markData.map((m, i) => {
      return {
        Coordinate: `${i + 1}`,
        lat: m.lat,
        lng: m.lng,
      };
    });

    setMarker(markData);
    setCenterHandler(false);
    setCenter({ lat: lat, lng: lng });
    if (marker.length === 1) {
      sessionStorage.clear("Geo. Coordinates");
    }
  };

  //---------------------- Function to remove all geo. coordinates starts below---------------------------->
  const removeCoordinates = () => {
    if (sessionStorage.getItem("Geo. Coordinates")) {
      if (window.confirm("Are you sure!")) {
        setMarker([]);
        setCenterHandler(false);
        setCenter({
          lat: 21.2365405,
          lng: 81.6157633,
        });
        sessionStorage.clear("Geo. Coordinates");
      }
    }
  };

  //--------------------Function to for file download starts below ------------------------------>
  const downloadFile = ({ data, fileName, fileType }) => {
    const blob = new Blob([data], { type: fileType });

    const a = document.createElement("a");
    a.download = fileName;
    a.href = window.URL.createObjectURL(blob);
    const clickEvt = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    a.dispatchEvent(clickEvt);
    a.remove();
  };

  //--------------------Function to download waypoints Json File starts below ------------------------------>
  const exportToJson = (e) => {
    e.preventDefault();
    let geoCoordinatesJSON = JSON.parse(
      sessionStorage.getItem("Geo. Coordinates")
    );

    if (geoCoordinatesJSON) {
      const wptJsonFileName = prompt(
        "Name/Title for Waypoint file:",
        "Waypoints JSON"
      );

      const options = { indent_size: 2, space_in_empty_paren: true };

      let coordinateDataJSON = {
        gpx: {},
      };

      geoCoordinatesJSON.forEach((m, i) => {
        coordinateDataJSON.gpx[`wpt-${i + 1}`] = {
          ["Coordinate"]: { lat: m.lat, lon: m.lng },
          name: `WP-${i + 1}`,
        };
      });

      // console.log(coordinateDataJSON);

      const dataJson = JSON.stringify(coordinateDataJSON);
      coordinateDataJSON = beautify(dataJson, options);
      // console.log(coordinateDataJSON);

      if (coordinateDataJSON) {
        downloadFile({
          data: coordinateDataJSON,
          fileName: wptJsonFileName
            ? `${wptJsonFileName}-JSON.gpx`
            : "Waypoints-JSON.gpx",
          fileType: "text/gpx",
        });
      }
    } else {
      alert("No Geographical Coordinates Available!");
    }
  };

  //--------------------Function to download Waypoints File starts below ------------------------------>

  const exportWaypoints = async (e) => {
    // ------- Below Option is to define formate of Xml file for xml parser Lib. --------->
    const options = {
      beautify: true,
      selfClosing: true,
      attrKey: "@",
      contentKey: "#",
      entityMap: {
        '"': "&#34;",
        "&": "&#38;",
      },
      declaration: {
        encoding: "UTF-8",
        standalone: "yes",
      },
    };

    e.preventDefault();
    let geoCoordinatesXML = JSON.parse(
      sessionStorage.getItem("Geo. Coordinates")
    );

    if (geoCoordinatesXML) {
      const wptXmlFileName = prompt(
        "Name/Title for Waypoints file:",
        "Waypoints"
      );
      const coordinateDataXML = {
        gpx: {
          "@": {
            version: "1.1",
          },
          wpt: [],
        },
      };

      geoCoordinatesXML.forEach((m, i) => {
        coordinateDataXML.gpx.wpt[i] = {
          "@": { lat: m.lat, lon: m.lng },
          name: `WP-${i + 1}`,
        };
      });

      const xml = parser.jsXml.toXmlString(options, coordinateDataXML);
      // console.log(xml);
      // console.log(js2xmlparser.parse("Coordinates", marker));

      if (xml) {
        downloadFile({
          data: xml,
          fileName: wptXmlFileName ? `${wptXmlFileName}.gpx` : "Waypoints.gpx",
          fileType: "text/gpx",
        });
      }
    } else {
      alert("No Geographical Coordinates Available!");
    }
  };

  //--------------------Function to download "Route" File starts below ------------------------------>

  const exportRoute = async (e) => {
    // ------- Below Option is to define formate of Xml file for xml parser Lib. --------->
    const options = {
      beautify: true,
      selfClosing: true,
      attrKey: "@",
      contentKey: "#",
      entityMap: {
        '"': "&#34;",
        "&": "&#38;",
      },
      declaration: {
        encoding: "UTF-8",
        standalone: "no",
      },
    };

    e.preventDefault();
    let geoRoute = JSON.parse(sessionStorage.getItem("Geo. Coordinates"));

    if (geoRoute) {
      const geoRouteFileName = prompt("Name/Title for the Route:", "Route");
      const Route = {
        gpx: {
          "@": {
            version: "1.1",
          },
          name: geoRouteFileName ? geoRouteFileName : "Route",
          rte: {
            rtept: [],
          },
        },
      };

      geoRoute.forEach((m, i) => {
        Route.gpx.rte.rtept[i] = {
          "@": { lat: m.lat, lon: m.lng },
          name: `WP-${i + 1}`,
        };
      });

      const geo_route = parser.jsXml.toXmlString(options, Route);
      // console.log(xml);
      // console.log(js2xmlparser.parse("Coordinates", marker));

      if (geo_route) {
        downloadFile({
          data: geo_route,
          fileName: geoRouteFileName ? `${geoRouteFileName}.gpx` : "Route.gpx",
          fileType: "text/gpx",
        });
      }
    } else {
      alert("No Geographical Coordinates Available!");
    }
  };

  // ---------------------------- App rendering starts from here --------------------------------->

  return isLoaded ? (
    <div className="main-map-container">
      <GoogleMap
        mapContainerStyle={containerStyle}
        mapContainerClassName="map-container left-box"
        center={center}
        zoom={zoom}
        onClick={setGeoCoordinate}
      >
        {marker?.map((mark, i) => {
          return (
            <Marker
              key={i}
              position={mark}
              onDblClick={deleteCoordinate}
            ></Marker>
          );
        })}
        <></>
      </GoogleMap>
      <div className="rightBox">
        <input
          className="Buttons"
          type="button"
          value="Extract Coordinate"
          onClick={extractCoordinate}
        />
        <input
          className="Buttons"
          type="button"
          value="Remove Coordinate"
          onClick={removeCoordinates}
        />
        <input
          className="Buttons"
          type="button"
          value="Export to JSON"
          onClick={exportToJson}
        />
        <input
          className="Buttons"
          type="button"
          value="Export Waypoints"
          onClick={exportWaypoints}
        />
        <input
          className="Buttons"
          type="button"
          value="Export Route"
          onClick={exportRoute}
        />
      </div>
    </div>
  ) : (
    <></>
  );
};

export default SimpleMap;
