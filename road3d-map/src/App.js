import React, { Component } from 'react';
import * as dat from 'dat.gui';
import * as mapvgl from 'mapvgl';
import h337 from 'heatmap.js';
import TitleHeader from './components/TitleHeader';
import Map3D from './components/Map3D';
import Map2D from './components/Map2D';
import ShenhaiData from './data/chengdu_avgspeed_sort_holiday.json';

import './App.less';

function FizzyText(max, min, color1, color2, color3, color4, color5) {
    this.max = max || 10;
    this.min = min || 0;
    this.color1 = color1 || "#0000FF"; // CSS string
    this.color2 = color2 || "#00FF00"; // CSS string
    this.color3 = color3 || "#66FF66"; // CSS string
    this.color4 = color4 || "#FFFF33"; // CSS string
    this.color5 = color5 || "#FF0000"; // CSS string
}

class App extends Component {

    canvasWidth = 512;
    canvasHeight = 256;
    state = {
        dataWeRender: ShenhaiData,
        innerHeight: window.innerHeight,
        visible: true,
        text: null
    };
    tRef = React.createRef();

    componentDidMount() {
        window.addEventListener('resize', this.onResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.onResize);
    }

    onResize = () => {
        this.setState({
            innerHeight: window.innerHeight
        });
    }

    onMapLoaded = map => {
        this.map = map;
        this.initMapvgl(map);
    }

    initMapvgl = map => {
        const { dataWeRender } = this.state
        let { heatMax } = this.parseData(dataWeRender);
       
        this.view = new mapvgl.View({
            map: map
        });
        this.initCanvas();
        // 初始化 GUI面板
        this.initGUIPanel(heatMax, 0)
        this.drawTimeText();
        this.drawMapvgl();
    }

    initCanvas = () => {
        this.heatmap = h337.create({
            container: this.canvasContainer,
            blur: 1,
            radius: 1
        });
        this.canvas = this.heatmap._renderer.canvas;
        this.ctx = this.canvas.getContext('2d');
    }

    drawMapvgl = () => {
        const { dataWeRender } = this.state
        const { heatMax, heatData, lineData } = this.parseData(dataWeRender);
        const { color1, color2, color3, color4, color5 } = this.text

        this.maxText.setValue(heatMax)

        this.heatmap.setData({
            max: heatMax,
            min: 0,
            data: heatData
        });

        this.layer = new mapvgl.WallLayer({
            texture: this.canvas,
            height: 30000
        });
        this.view.addLayer(this.layer);  

        const nuConfig = {
            gradient: {
                '.3': color1,
                '.4': color2,
                '.5': color3,
                '.6': color4,
                '1': color5,
            },
            backgroundColor: '#000'
        };
        console.log(nuConfig)
        this.heatmap.configure(nuConfig)
        this.layer.setData(lineData);
    }

    drawTimeText = () => {
        this.ctx.font = '20px normal 微软雅黑';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.save();
        this.ctx.scale(1/4, 0.9);
        for (let i = 0; i <= 4; i++) {
            this.ctx.fillText(`${24/4*i}:00`, 0, this.canvasHeight / 4 * i);
        }
        this.ctx.restore();
    }

    parseData = roadData => {
        let dataMaxWidth = roadData.length;
        let dataMaxHeight = 0;
        let dataMaxValue = 0;
        let dataMinValue = Infinity;
        let lineData = [];
        let hotData = [];
        let path = [];
        for (let i = 0; i < roadData.length; i++) {
            const link = roadData[i];
            for (let j = 0; j < link.data.length; j++) {
                const hot = link.data[j];
                hotData.push([i, ...hot]);
                dataMaxHeight = Math.max(dataMaxHeight, hot[0]);
                dataMaxValue = Math.max(dataMaxValue, hot[1]);
                dataMinValue = Math.min(dataMinValue, hot[1]);
            }

            let loc = link.loc.split(',');
            for (let k = 0; k < loc.length; k+=2) {
                const x = Number(loc[k]);
                const y = Number(loc[k +1 ]);
                path.push([x, y]);
            }
        }
 
        lineData.push({
            geometry: {
                type: 'LineString',
                coordinates: path
            }
        });

        var heatData = [];
        var preWidth = this.canvasWidth / dataMaxWidth;
        var preHeight = this.canvasHeight / dataMaxHeight;
  
        hotData.forEach(data => {
            heatData.push({
                x: data[0] * preWidth,
                y: data[1] * preHeight,
                value: data[2]
            })
        });

        return {
            heatMax: dataMaxValue,
            heatData,
            lineData
        };
    }

    bindCanvasRef = input => {
        this.canvasContainer = input;
    }

    layerSetData = () => {
        const { dataWeRender } = this.state
        const { lineData } = this.parseData(dataWeRender);

        if (this.layer) {
            this.drawTimeText();
            this.view.addLayer(this.layer);  
            this.layer.setData(lineData);
        }
    }

    changeHeatMap = () => {
        const { dataWeRender } = this.state
        const { heatData } = this.parseData(dataWeRender);
        const { max, min } = this.text

        this.heatmap.setData({
            max: max,
            min: min,
            data: heatData
        });
        this.layerSetData()

        this.forceUpdate()
    }

    changeHeatMapColor = () => {
        const { color1, color2, color3, color4, color5 } = this.text
        const nuConfig = {
            gradient: {
                '.3': color1,
                '.4': color2,
                '.5': color3,
                '.6': color4,
                '1': color5,
            },
            backgroundColor: '#000'
        };
        
        console.log(nuConfig)
        this.heatmap.configure(nuConfig)
        this.layerSetData()

        this.forceUpdate()
    }

    onChangeClick = () => {
        const { visible } = this.state
        
        this.setState({ visible: !visible })
    }
      
    initGUIPanel = (max, min, color1, color2, color3, color4, color5) => {
     
        this.gui = new dat.GUI();

        this.text = new FizzyText(max, min, color1, color2, color3, color4, color5);
   
        this.setState({ text: this.text })
        
        this.minText = this.gui.add(this.text, 'min');
        this.maxText = this.gui.add(this.text, 'max');

        this.color1 = this.gui.addColor(this.text, 'color1');
        this.color2 = this.gui.addColor(this.text, 'color2');
        this.color3 = this.gui.addColor(this.text, 'color3');
        this.color4 = this.gui.addColor(this.text, 'color4');
        this.color5 = this.gui.addColor(this.text, 'color5');

        this.minText.onFinishChange(this.changeHeatMap);
        this.maxText.onFinishChange(this.changeHeatMap);

        this.color1.onFinishChange(this.changeHeatMapColor)
        this.color2.onFinishChange(this.changeHeatMapColor)
        this.color3.onFinishChange(this.changeHeatMapColor)
        this.color4.onFinishChange(this.changeHeatMapColor)
        this.color5.onFinishChange(this.changeHeatMapColor)

        this.gui.__controllers.forEach(e => {
            e.updateDisplay()
        })
    }

    // 切换控制
    onChangeClick = () => {
        const { visible } = this.state

        this.setState({ visible: !visible })
    }

    getFileContent = (fileInput, callback) => {
        if (fileInput.files && fileInput.files.length > 0 && fileInput.files[0].size > 0) {
            var file = fileInput.files[0];
            if (window.FileReader) {
                var reader = new FileReader();
                reader.onloadend = function (evt) {
                    if (evt.target.readyState == FileReader.DONE) {
                        callback(evt.target.result);
                    }
                };
                // 包含中文内容用gbk编码
                reader.readAsText(file, 'gbk');
            }
        }
    };

    onChangeUploadClick = () => {
        this.getFileContent(this.tRef.current, dataWeRender => {
            this.setState({ dataWeRender: JSON.parse(dataWeRender) }, () => {
                this.view.removeLayer(this.layer)
                this.drawMapvgl()
            })
        });
    }

    render() {
        const { innerHeight, visible, text, dataWeRender } = this.state;
        
        return (
            <React.Fragment>
                <TitleHeader />
                <div ref={this.bindCanvasRef} className="canvas"></div>
                <input className="upload" ref={this.tRef} onChange={this.onChangeUploadClick} type="file" name="upload" id="upload" accept="text/json"/>
                <div className="change" onClick={this.onChangeClick}><b>切换2D/3D</b></div>
                <Map3D
                    style={{ height: innerHeight }}
                    visible={visible}
                    center={[11586045.04, 3566065.08]}
                    zoom={11}
                    onMapLoaded={this.onMapLoaded}
                    changeHeatMap={this.changeHeatMap}
                >
                </Map3D>
                {text &&
                    <Map2D
                        center={[11586045.04,3566065.08]}
                        zoom={11}
                        dataWeRender={dataWeRender}
                        text={text}
                        visible={visible}
                        changeHeatMap={this.changeHeatMap}
                    >
                    </Map2D> 
                }
            </React.Fragment>
        );
    }
}

export default App;
