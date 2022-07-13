import {
    AmbientLight,
    AxesHelper,
    DirectionalLight,
    GridHelper,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
} from "three";
import {
    OrbitControls
} from "three/examples/jsm/controls/OrbitControls";

// 创建Three.js场景
const scene = new Scene();

//Object to store the size of the viewport
const size = {
    width: window.innerWidth,
    height: window.innerHeight,
};

// 创建摄像机（用户的视角）。
const aspect = size.width / size.height;
const camera = new PerspectiveCamera(75, aspect);
camera.position.z = 15;
camera.position.y = 13;
camera.position.x = 8;

// 创建场景的灯光
const lightColor = 0xffffff;

const ambientLight = new AmbientLight(lightColor, 0.5);
scene.add(ambientLight);

const directionalLight = new DirectionalLight(lightColor, 1);
directionalLight.position.set(0, 10, 0);
directionalLight.target.position.set(-5, 0, 0);
scene.add(directionalLight);
scene.add(directionalLight.target);

// 设置渲染器，获取HTML的画布。
const threeCanvas = document.getElementById("three-canvas");
const renderer = new WebGLRenderer({
    canvas: threeCanvas,
    alpha: true
});

renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 在场景中创建网格和坐标轴
const grid = new GridHelper(50, 30);
scene.add(grid);

const axes = new AxesHelper();
axes.material.depthTest = false;
axes.renderOrder = 1;
scene.add(axes);

// 创建轨道控制（用于导航场景）。
const controls = new OrbitControls(camera, threeCanvas);
controls.enableDamping = true;
controls.target.set(-2, 0, 0);

// 动画循环
const animate = () => {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
};

animate();

// 根据浏览器的大小调整视口
window.addEventListener("resize", () => {
    size.width = window.innerWidth;
    size.height = window.innerHeight;
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height);
});

import { IFCLoader } from "web-ifc-three/IFCLoader";
import {
    IFCWALLSTANDARDCASE,
    IFCSLAB,
    IFCDOOR,
    IFCWINDOW,
    IFCFURNISHINGELEMENT,
    IFCMEMBER,
    IFCPLATE,
    IFCWALL,
    IFCSTAIR,
    IFCCOLUMN,
    IFCRAILING,
    IFCCURTAINWALL,
    IFCROOF,
    IFCFLOWTERMINAL,
    IFCBUILDINGELEMENTPROXY,
    IFCFURNITURE,
    IFCCOVERING
} from 'web-ifc';
const categories = {
    IFCWALLSTANDARDCASE,
    IFCSLAB,
    IFCFURNISHINGELEMENT,
    IFCDOOR,
    IFCWINDOW,
    IFCPLATE,
    IFCMEMBER,
    IFCWALL,
    IFCSTAIR,
    IFCCOLUMN,
    IFCRAILING,
    IFCCURTAINWALL,
    IFCROOF,
    IFCFLOWTERMINAL,
    IFCBUILDINGELEMENTPROXY,
    IFCFURNITURE,
    IFCCOVERING
};
// 设置IFC加载
const ifcLoader = new IFCLoader();

const input = document.getElementById("file-input");
input.addEventListener(
    "change",
    (changed) => {
        const file = changed.target.files[0];
        UI.$data.fileName = file.name.split(".")[0];
        UI.$data.fileSize = file.size;
        var ifcURL = URL.createObjectURL(file);
        clear();
        ifcLoader.load(
            ifcURL,
            (ifcModel) => {

                ifcLoader.ifcManager.getAllItemsOfType(0, IFCWALLSTANDARDCASE, false).then(res => {
                    res.forEach(id => {
                        ifcLoader.ifcManager.getMaterialsProperties(ifcModel.modelID, id, true).then(v => {
                            console.log(v);
                        })
                    })

                });
                ifcLoader.ifcManager.getSpatialStructure(ifcModel.modelID).then(data => {
                    if (!data.expressID || !data.children.length === 0) {
                        scene.add(ifcModel);
                        console.log("分割结构!");
                        ifcModel.scale.set(0.0005, 0.0005, 0.0005);
                    }
                    else {
                        formatData(data);
                        createModel(ifcModel.modelID);
                        UI.$data.modelList = [...modelTypeList];
                        UI.$data.checkList = [...modelTypeList];
                        console.log("工程结构!")
                    }
                });
            });
    },
    false
);
var excludeType = []
var modelTypeList = [];
var states = {};
var models = {};
var orderBys = [
    "IFCWALL",
    "IFCCURTAINWALL",
    "IFCWALLSTANDARDCASE",
    "IFCROOF",
    "IFCSLAB",
    "IFCCOLUMN",
    "IFCBUILDINGELEMENTPROXY",
    "IFCPLATE",
    "IFCRAILING",
    "IFCSTAIR",
    "IFCCOVERING",
    "IFCWINDOW",
    "IFCDOOR",
    "IFCFLOWTERMINAL",
    "IFCMEMBER",
    "IFCFURNISHINGELEMENT",
    "IFCFURNITURE"
]
function clear() {
    excludeType = ['IFCPROJECT', 'IFCSITE', 'IFCBUILDINGSTOREY', 'IFCBUILDING', 'IFCSPACE']
    modelTypeList = [];
    states = {};
    models = {};
}

function createModel(modelID) {
    modelTypeList.forEach(type => {
        let res = ifcLoader.ifcManager.getAllItemsOfType(modelID, categories[type], false);
        res.then(ids => {
            models[type] = ifcLoader.ifcManager.createSubset({
                modelID: modelID,
                scene,
                ids,
                removePrevious: true,
                customID: type
            });
        })
    })
}

function formatData(data) {
    if (excludeType.indexOf(data.type.toLocaleUpperCase()) === -1 &&
     modelTypeList.indexOf(data.type) === -1 && data.children.length===0) {
        modelTypeList.push(data.type);
        states[data.type] = true;
    }
    if (data.children.length > 0) {
        data.children.forEach(element => {
            formatData(element);
        });
    }
}

const UI = new Vue({
    el: '#ui',
    data() {
        return {
            checkList: [],
            modelList: [],
            files: [

            ],
            fileName: '',
            dealing: false,
            loading: false,
            fileSize: 0,
            loadingText : ''
        }
    },
    methods: {
        modelChange(v) {
            if (states[v]) models[v].removeFromParent();
            else scene.add(models[v]);
            states[v] = !states[v];
        },
        startExec() {
            let data = [...this.checkList];
            data.forEach(d => {
                let i = this.modelList.indexOf(d);
                let j = this.checkList.indexOf(d);
                states[d] = false;
                if (i > -1) {
                    this.modelList.splice(i, 1)
                    this.checkList.splice(j, 1)
                    models[d].removeFromParent();
                }
            })
            data.push(String(this.files.length + 1));
            data.push(this.fileName);
            this.loading = true;
            axios.post('https://localhost:7215/api/Ifc', data).then(res => {
                console.log(res);
                this.loading = false;
                this.files.push(res.data);
            })
        },
        aotoExecByOrders(types, index,fileId) {
            
            if (index > orderBys.length || fileId-1>types.length){
                this.loading = false;
                return;
            }
            console.log(orderBys[index])
            if (types.indexOf(orderBys[index]) > -1) {
                this.loading = true;
                let data = [orderBys[index],String(fileId),this.fileName]        
                axios.post('https://localhost:7215/api/Ifc', data).then(res => {
                    this.loadingText = orderBys[index];
                    this.files.push(res.data);
                    this.aotoExecByOrders(types,index+1,fileId+1);
                })
            }
            else{
                this.aotoExecByOrders(types,index+1,fileId);
            }
        },
        autoExec() {
            this.aotoExecByOrders([...this.checkList],0,1);
        }
    },
})




window.UI = UI;

//设置相对于你输出js文件的位置到web-ifc.wasm的位置定位
ifcLoader.ifcManager.setWasmPath("../assets/");
