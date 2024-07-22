// import React, { useEffect, useRef } from 'react';
// import map from 'lodash/map';
// import reduce from 'lodash/reduce';
// import filter from 'lodash/filter';
// import min from 'lodash/min';
// import max from 'lodash/max';
// import isNumber from 'lodash/isNumber';
// import L from 'leaflet';
// import { useMap, Pane, useMapEvent, useMapEvents } from 'react-leaflet';
// import simpleheat from 'simpleheat';
// import PropTypes from 'prop-types';

// export type LngLat = {
//   lng: number;
//   lat: number;
// };

// export type Point = {
//   x: number;
//   y: number;
// };

// export type Bounds = {
//   contains: (latLng: LngLat) => boolean;
// };

// export type Pane = {
//   appendChild: (element: Object) => void;
// };

// export type Panes = {
//   overlayPane: Pane;
// };

// export type Map = {
//   layerPointToLatLng: (lngLat: Point) => LngLat;
//   latLngToLayerPoint: (lngLat: LngLat) => Point;
//   on: (event: string, handler: () => void) => void;
//   getBounds: () => Bounds;
//   getPanes: () => Panes;
//   invalidateSize: () => void;
//   options: Object;
// };

// export type LeafletZoomEvent = {
//   zoom: number;
//   center: Object;
// };

// function isInvalid(num: number): boolean {
//   return !isNumber(num) && !num;
// }

// function isValid(num: number): boolean {
//   return !isInvalid(num);
// }

// function isValidLatLngArray(arr: Array<number>): boolean {
//   return filter(arr, isValid).length === arr.length;
// }

// function isInvalidLatLngArray(arr: Array<number>): boolean {
//   return !isValidLatLngArray(arr);
// }

// function safeRemoveLayer(leafletMap: Map, el: HTMLElement): void {
//   const { overlayPane } = leafletMap.getPanes();
//   if (overlayPane && overlayPane.contains(el)) {
//     overlayPane.removeChild(el);
//   }
// }

// function shouldIgnoreLocation(loc: LngLat): boolean {
//   return isInvalid(loc.lng) || isInvalid(loc.lat);
// }

// type HeatmapLayerProps = {
//   points: Array<any>;
//   longitudeExtractor: (point: any) => number;
//   latitudeExtractor: (point: any) => number;
//   intensityExtractor: (point: any) => number;
//   fitBoundsOnLoad?: boolean;
//   fitBoundsOnUpdate?: boolean;
//   onStatsUpdate?: (stats: { min: number; max: number }) => void;
//   max?: number;
//   radius?: number;
//   maxZoom?: number;
//   minOpacity?: number;
//   blur?: number;
//   gradient?: Object;
// };

// const HeatmapLayer: React.FC<HeatmapLayerProps> = (props) => {
//   const map = useMap();
//   const elRef = useRef<HTMLCanvasElement | null>(null);
//   const heatmapRef = useRef<any>(null);

//   useEffect(() => {
//     const canAnimate = map.options.zoomAnimation && L.Browser.any3d;
//     const zoomClass = `leaflet-zoom-${canAnimate ? 'animated' : 'hide'}`;
//     const mapSize = map.getSize();
//     const transformProp = L.DomUtil.testProp([
//       'transformOrigin',
//       'WebkitTransformOrigin',
//       'msTransformOrigin',
//     ]) as string;

//     elRef.current = L.DomUtil.create('canvas', zoomClass);
//     elRef.current.style[transformProp] = '50% 50%';
//     elRef.current.width = mapSize.x;
//     elRef.current.height = mapSize.y;

//     const el = elRef.current;

//     const Heatmap = L.Layer.extend({
//       onAdd: (leafletMap: Map) => leafletMap.getPanes().overlayPane.appendChild(el),
//       addTo: (leafletMap: Map) => {
//         leafletMap.addLayer(this);
//         return this;
//       },
//       onRemove: (leafletMap: Map) => safeRemoveLayer(leafletMap, el),
//     });

//     const leafletElement = new Heatmap();
//     heatmapRef.current = simpleheat(el);

//     resetHeatmap();

//     if (props.fitBoundsOnLoad) {
//       fitBounds();
//     }
//     attachEvents();
//     updateHeatmapProps(getHeatmapProps(props));

//     map.addLayer(leafletElement);

//     return () => {
//       map.removeLayer(leafletElement);
//       safeRemoveLayer(map, el);
//     };
//   }, []);

//   useEffect(() => {
//     updateHeatmapProps(getHeatmapProps(props));
//     if (props.fitBoundsOnUpdate) {
//       fitBounds();
//     }
//     resetHeatmap();
//   }, [props]);

//   const getMax = (props: HeatmapLayerProps) => props.max || 3.0;
//   const getRadius = (props: HeatmapLayerProps) => props.radius || 30;
//   const getMaxZoom = (props: HeatmapLayerProps) => props.maxZoom || 18;
//   const getMinOpacity = (props: HeatmapLayerProps) => props.minOpacity || 0.01;
//   const getBlur = (props: HeatmapLayerProps) => props.blur || 15;

//   const getHeatmapProps = (props: HeatmapLayerProps) => ({
//     minOpacity: getMinOpacity(props),
//     maxZoom: getMaxZoom(props),
//     radius: getRadius(props),
//     blur: getBlur(props),
//     max: getMax(props),
//     gradient: props.gradient,
//   });

//   const updateHeatmapProps = (props: any) => {
//     updateHeatmapRadius(props.radius, props.blur);
//     updateHeatmapGradient(props.gradient);
//     updateHeatmapMax(props.max);
//   };

//   const updateHeatmapRadius = (radius: number, blur?: number) => {
//     if (radius) {
//       heatmapRef.current.radius(radius, blur);
//     }
//   };

//   const updateHeatmapGradient = (gradient: Object) => {
//     if (gradient) {
//       heatmapRef.current.gradient(gradient);
//     }
//   };

//   const updateHeatmapMax = (maximum: number) => {
//     if (maximum) {
//       heatmapRef.current.max(maximum);
//     }
//   };

//   const fitBounds = () => {
//     const points = props.points;
//     const lngs = map(points, props.longitudeExtractor);
//     const lats = map(points, props.latitudeExtractor);
//     const ne = { lng: max(lngs), lat: max(lats) };
//     const sw = { lng: min(lngs), lat: min(lats) };

//     if (shouldIgnoreLocation(ne) || shouldIgnoreLocation(sw)) {
//       return;
//     }

//     map.fitBounds(L.latLngBounds(L.latLng(sw), L.latLng(ne)));
//   };

//   const resetHeatmap = () => {
//     const topLeft = map.containerPointToLayerPoint([0, 0]);
//     L.DomUtil.setPosition(elRef.current, topLeft);

//     const size = map.getSize();

//     if (heatmapRef.current._width !== size.x) {
//       elRef.current.width = heatmapRef.current._width = size.x;
//     }
//     if (heatmapRef.current._height !== size.y) {
//       elRef.current.height = heatmapRef.current._height = size.y;
//     }

//     if (heatmapRef.current && !heatmapRef.current._frame && !map._animating) {
//       heatmapRef.current._frame = L.Util.requestAnimFrame(redrawHeatmap, this);
//     }

//     redrawHeatmap();
//   };

//   const redrawHeatmap = () => {
//     const r = heatmapRef.current._r;
//     const size = map.getSize();

//     const maxIntensity = props.max === undefined ? 1 : getMax(props);

//     const maxZoom = props.maxZoom === undefined ? map.getMaxZoom() : getMaxZoom(props);

//     const v = 1 / Math.pow(2, Math.max(0, Math.min(maxZoom - map.getZoom(), 12)) / 2);

//     const cellSize = r / 2;
//     const panePos = map._getMapPanePos();
//     const offsetX = panePos.x % cellSize;
//     const offsetY = panePos.y % cellSize;
//     const getLat = props.latitudeExtractor;
//     const getLng = props.longitudeExtractor;
//     const getIntensity = props.intensityExtractor;

//     const inBounds = (p: Point, bounds: Bounds) => bounds.contains(p);

//     const filterUndefined = (row: Array<any>) => filter(row, (c) => c !== undefined);

//     const roundResults = (results: Array<any>) =>
//       reduce(
//         results,
//         (result, row) =>
//           map(filterUndefined(row), (cell) => [
//             Math.round(cell[0]),
//             Math.round(cell[1]),
//             Math.min(cell[2], maxIntensity),
//             cell[3],
//           ]).concat(result),
//         []
//       );

//     const accumulateInGrid = (points: Array<any>, leafletMap: Map, bounds: Bounds) =>
//       reduce(
//         points,
//         (grid, point) => {
//           const latLng = [getLat(point), getLng(point)];
//           if (isInvalidLatLngArray(latLng)) {
//             //skip invalid points
//             return grid;
//           }

//           const p = leafletMap.latLngToContainerPoint(latLng);

//           if (!inBounds(p, bounds)) {
//             return grid;
//           }

//           const x = Math.floor((p.x - offsetX) / cellSize) + 2;
//           const y = Math.floor((p.y - offsetY) / cellSize) + 2;

//           grid[y] = grid[y] || [];
//           const cell = grid[y][x];

//           const alt = getIntensity(point);
//           const k = alt * v;

//           if (!cell) {
//             grid[y][x] = [p.x, p.y, k, 1];
//           } else {
//             cell[0] = (cell[0] * cell[2] + p.x * k) / (cell[2] + k); // x
//             cell[1] = (cell[1] * cell[2] + p.y * k) / (cell[2] + k); // y
//             cell[2] += k; // accumulated intensity value
//             cell[3] += 1;
//           }

//           return grid;
//         },
//         []
//       );

//     const getBounds = () => new L.Bounds(L.point([-r, -r]), size.add([r, r]));

//     const getDataForHeatmap = (points: Array<any>, leafletMap: Map) =>
//       roundResults(accumulateInGrid(points, leafletMap, getBounds(leafletMap)));

//     const data = getDataForHeatmap(props.points, map);

//     heatmapRef.current.clear();
//     heatmapRef.current.data(data).draw(getMinOpacity(props));

//     heatmapRef.current._frame = null;

//     if (props.onStatsUpdate && props.points && props.points.length > 0) {
//       props.onStatsUpdate(
//         reduce(
//           data,
//           (stats, point) => {
//             stats.max = point[3] > stats.max ? point[3] : stats.max;
//             stats.min = point[3] < stats.min ? point[3] : stats.min;
//             return stats;
//           },
//           { min: Infinity, max: -Infinity }
//         )
//       );
//     }
//   };

//   const attachEvents = () => {
//     map.on('viewreset', resetHeatmap);
//     map.on('moveend', resetHeatmap);
//     if (map.options.zoomAnimation && L.Browser.any3d) {
//       map.on('zoomanim', animateZoom);
//     }
//   };

//   const animateZoom = (e: LeafletZoomEvent) => {
//     const scale = map.getZoomScale(e.zoom);
//     const offset = map
//       ._getCenterOffset(e.center)
//       ._multiplyBy(-scale)
//       .subtract(map._getMapPanePos());

//     if (L.DomUtil.setTransform) {
//       L.DomUtil.setTransform(elRef.current, offset, scale);
//     } else {
//       elRef.current.style[L.DomUtil.TRANSFORM] = `${L.DomUtil.getTranslateString(offset)} scale(${scale})`;
//     }
//   };

//   return null;
// };

// HeatmapLayer.propTypes = {
//   points: PropTypes.array.isRequired,
//   longitudeExtractor: PropTypes.func.isRequired,
//   latitudeExtractor: PropTypes.func.isRequired,
//   intensityExtractor: PropTypes.func.isRequired,
//   fitBoundsOnLoad: PropTypes.bool,
//   fitBoundsOnUpdate: PropTypes.bool,
//   onStatsUpdate: PropTypes.func,
//   max: PropTypes.number,
//   radius: PropTypes.number,
//   maxZoom: PropTypes.number,
//   minOpacity: PropTypes.number,
//   blur: PropTypes.number,
//   gradient: PropTypes.object,
// };

// // export default HeatmapLayer;

export {}