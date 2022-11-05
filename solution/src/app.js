// Copyright 2021 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Loader } from '@googlemaps/js-api-loader';
import * as THREE from 'three';
import { Vector3 } from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
// import Split from 'split.js'
// Split(['#split-0', '#split-1'])

const apiOptions = {
  apiKey: 'abcd'
};
var map;
var Highcharts = require('highcharts');
// packages are similar.
// var Highcharts = require('highcharts/highstock');
require('highcharts/modules/exporting')(Highcharts);

const mapOptions = {
  "tilt": 67.5,
  "heading": 180,
  "zoom": 18.5,
  "center": { lat: 40.74259319078668, lng: -73.98780008071152 },
  "mapId": "a",
  "disableDefaultUI": true
}

const mapOptions2 = {
  "center":  { lat: 40.74259319078668, lng: -73.98780008071152 },
  "mapId": "b",
  "disableDefaultUI":false
}

async function initMap(mapId) {    
  const mapDiv = document.getElementById("map");
  mapOptions.mapId = mapId;
  console.log(mapDiv);
  const apiLoader = new Loader(apiOptions);
  await apiLoader.load();
  map = new google.maps.Map(mapDiv, mapOptions);
  return map;
}


async function initMapOverview() {    
  const mapDiv = document.getElementById("overview");
  console.log(mapDiv);
  const apiLoader = new Loader(apiOptions);
  await apiLoader.load();
  return new google.maps.Map(mapDiv, mapOptions2);
}

var num_bees, time

function initWebGLOverlayView(map) {  

  console.log('In InitWebGLOverlayView function')
  console.log(map);
  let scene, renderer, camera, loader, spaceneedle, bee=[], vx=[], vy=[], changetime=[],avx=0, avy=0, avz=0, initx=11, inity=11, initz=11;
  const webGLOverlayView = new google.maps.WebGLOverlayView();
  num_bees = 20;
  time = 0;

  
  webGLOverlayView.onAdd = () => {   
    // set up the scene
    time = 0
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
    const ambientLight = new THREE.AmbientLight( 0xffffff, 0.75 ); // soft white light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25);
    directionalLight.position.set(0.5, -1, 0.5);
    scene.add(directionalLight);
  
    // load the model    
                  
    const source = "bee-gltf/source/bee_gltf.gltf";
    const source2= "scene.gltf"

    loader = new GLTFLoader();
    // Add space needle
    loader.load(
      source2,
      gltf => {        
        
        spaceneedle = gltf.scene;      
        spaceneedle.scale.set(2,2,2);
        spaceneedle.rotation.x = 90 * Math.PI/180; // rotations are in radians
        spaceneedle.position.x = 0 
        spaceneedle.position.y = 0 
        spaceneedle.position.z = -120;
        scene.add(gltf.scene);     
        }      

    );



    // Add bees
    for (let i = 0; i < num_bees; i++) {
      loader = new GLTFLoader(); 
      vx[i] = -2 + 4*Math.random();
      vy[i] = -2 + 4*Math.random();

      // if (Math.abs(vx[i] + vy[i])<0.2){
      //   vx[i] = 2;
      // }

      changetime[i] = Math.round(100*Math.random());
      loader.load(
        source,
        gltf => {        
          
          bee[i] = gltf.scene;      
          bee[i].scale.set(10,10,10);
          bee[i].rotation.x = 90 * Math.PI/180; // rotations are in radians
          bee[i].rotation.y = Math.atan2(vy[i],vx[i]) + Math.PI/2
          bee[i].position.x = 0 
          bee[i].position.y = 0 
          bee[i].position.z = 0;
          scene.add(bee[i]);     
          }      

      );
  }
  }
  
  webGLOverlayView.onContextRestored = ({gl}) => {    
    // create the three.js renderer, using the
    // maps's WebGL rendering context.
    renderer = new THREE.WebGLRenderer({
      canvas: gl.canvas,
      context: gl,
      ...gl.getContextAttributes(),
    });
    renderer.autoClear = false;

    // wait to move the camera until the 3D model loads    
    loader.manager.onLoad = () => {        
      renderer.setAnimationLoop(() => {
        map.moveCamera({
          "tilt": mapOptions.tilt,
          "heading": mapOptions.heading,
          "zoom": mapOptions.zoom
        });           
        
        
        
        // rotate the map 360 degrees 
        // if (mapOptions.zoom < 17) {
        //   mapOptions.zoom += 0.02;
        // } else if (mapOptions.tilt < 67.5) {
        //   mapOptions.tilt += 0.5
        if (mapOptions.heading <= 720) {
          
          mapOptions.heading += 0.1;      

          if(mapOptions.zoom > 17){
          mapOptions.zoom -= 0.0005;
        }
          time+=1;
          if (time > 700 && time < 3000){

            for (let i = 0; i < num_bees; i++) {
              if (time > changetime[i]){
                console.log("changing "+time+ " for " + i );
                vx[i] = -vx[i] // -0.01 + 0.02*Math.random();
                vy[i] = -vy[i] // -0.01 + 0.02*Math.random();
                changetime[i] = changetime[i]*2;
                }
            }
 
        } else if (time > 3000) {

          for (let i = 0; i < num_bees; i++) {
              console.log("Going back home at"+time+ " for " + i );
              vx[i] = (-initx -bee[i].position.x)*0.01;
              vy[i] = (-inity -bee[i].position.y)*0.01;
            }

        }
          
           
            
          avx = 0,avy=0, avz=0;
          for (let i = 0; i < num_bees; i++) {
            
            
            bee[i].position.x += vx[i] 
            bee[i].position.y += vy[i] 


            // bee[i].position.z = bee[i].position.z + Math.random();
            bee[i].rotation.y = Math.atan2(vy[i],vx[i]) + Math.PI/2

            avx += bee[i].position.x;
            avy += bee[i].position.y;
            avz += bee[i].position.z;

            // ;

            }



            // console.log(avx/num_bees, avy/num_bees, avz/num_bees)
            if(initx==11){
              initx=avx/num_bees
              inity=avy/num_bees
              initz=avz/num_bees

              console.log(initx, inity, initz)
              console.log('----------------------')
            }
          
            
        } else {
          mapOptions.heading = 0
          // time+=1;
          renderer.setAnimationLoop(null)
          console.log(time);

          
        }
        

       
        

        



      });        
    }
  }

  webGLOverlayView.onDraw = ({gl, transformer}) => {
    // update camera matrix to ensure the model is georeferenced correctly on the map
    
    
    
    const latLngAltitudeLiteral = {
        lat: mapOptions.center.lat,
        lng: mapOptions.center.lng,
        altitude: 120
    }

    const matrix = transformer.fromLatLngAltitude(latLngAltitudeLiteral);
    camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);
    
    webGLOverlayView.requestRedraw(); 
    // const objectPosition = new Vector3();
    // bee[0].getWorldPosition(objectPosition);

    // camera.lookAt(objectPosition);
    // console.log(camera.matrix);     
    renderer.render(scene, camera);                  

    // always reset the GL state
    renderer.resetState();
  }
  webGLOverlayView.setMap(map);
}




function displayMap(mapId = "4755751e6697c394" ) {
mapOptions.mapId = mapId;
map.setOptions(mapOptions);
};



(async () => {    
  
  Highcharts.chart('container', {
    chart: {
        type: 'spline',
        animation: Highcharts.svg, // don't animate in old IE
        marginRight: 10,
        events: {
            load: function () {

                // set up the updating of the chart each second
                var series = this.series[0];
                setInterval(function () {
                    var x = (new Date()).getTime(), // current time
                        y = 100*(0.5 + 0.5*Math.random());
                    series.addPoint([x, y], true, true);
                }, 1000);
            }
        }
    },

    time: {
        useUTC: false
    },

    title: {
        text: 'On Time Delivery %'
    },

    accessibility: {
        announceNewData: {
            enabled: true,
            minAnnounceInterval: 15000,
            announcementFormatter: function (allSeries, newSeries, newPoint) {
                if (newPoint) {
                    return 'New point added. Value: ' + newPoint.y;
                }
                return false;
            }
        }
    },

    xAxis: {
        type: 'datetime',
        tickPixelInterval: 150
    },

    yAxis: {
        title: {
            text: '%'
        },
        plotLines: [{
            value: 0,
            width: 2,
            color: '#808080'
        }]
    },

    tooltip: {
        headerFormat: '<b>{series.name}</b><br/>',
        pointFormat: '{point.x:%Y-%m-%d %H:%M:%S}<br/>{point.y:.2f}'
    },

    legend: {
        enabled: false
    },

    exporting: {
        enabled: false
    },

    series: [{
        name: 'On-time delivery %',
        data: (function () {
            // generate an array of random data
            var data = [],
                time = (new Date()).getTime(),
                i;

            for (i = -19; i <= 0; i += 1) {
                data.push({
                    x: time + i * 1000,
                    y: 100*(0.5 + 0.5*Math.random())
                });
            }
            return data;
        }()),
        color: 'Green',
        zonesAxis: 'y',
        zones: [{
            value: 50,
            color: 'red',
        }, {
            value: 70,
            color: 'red',
        }, {
            value:90,
            color: 'grey',
        }]
    }]
});


Highcharts.chart('container2', {
  chart: {
      type: 'pie',
      events: {
          load: function (e) {
          var series = this.series[0];
          setInterval(function () {
              // find the clicked values and the series
          var data= [
          ['Pickup', Math.round(20*Math.random())],
          ['Delivery', Math.round(20*Math.random())],
      ]
       series.setData (data);
  },2500);
          }
      }
  },
  plotOptions: {
      pie: {
          dataLabels: {
              enabled: true,
              distance: -50,
              style: {
                  fontWeight: 'bold',
                  color: 'white'
              }
          },
          startAngle: -90, 
          endAngle: 90,
          center: ['50%', '75%'],
          size: '110%'
      }
  },
  title: {
      text: 'Pickup / Delivery Requests'
  },
  exporting: {
    enabled: false
},
  series: [{
      data: [
          ['Pickup', Math.round(20*Math.random())],
          ['Delivery', Math.round(20*Math.random())],
      ]
  }]
});

  
  map = await initMap('d55af81411f34bc4');
  const styles = {default:['concrete_jungle'],
concrete_jungle: 'd55af81411f34bc4' ,
mad_max:'4755751e6697c394',
};
  // const map2 = await initMapOverview();
  initWebGLOverlayView(map);
  // window.initMap = map2; 
  const styleControl = document.getElementById(
    "style-selector-control"
  );

  const dashmenu = document.getElementById(
    "sideBar"
  );

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(styleControl);


  map.controls[google.maps.ControlPosition.LEFT].push(dashmenu);

  // Set the map's style to the initial value of the selector.
  const styleSelector = document.getElementById(
    "style-selector"
  );

  console.log( styles[styleSelector.value])
  console.log(styleSelector.value)
  map.setOptions({ mapId: styles[styleSelector.value] });

  // Drop down on change
  styleSelector.addEventListener("change", () => {
    console.log('changing style');
    const styles = {default:['concrete_jungle'],
    concrete_jungle: 'd55af81411f34bc4' ,
    mad_max:'4755751e6697c394',
    };
    console.log( styles[styleSelector.value], styleSelector.value)
    displayMap(styles[styleSelector.value]);
    
  });

  // Button click
  document.getElementById("spawn").addEventListener("click", function(){
    console.log('Spawning ...');
    num_bees = num_bees + 20;
    time=0;

      google.maps.event.trigger(map, 'resize');

    initWebGLOverlayView(map);
  
  });


})();


const styles = {default:['concrete_jungle'],
concrete_jungle: "d55af81411f34bc4" ,
mad_max:"4755751e6697c394"
};
