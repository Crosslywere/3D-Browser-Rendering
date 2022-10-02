class vec3d {
    constructor(x = 0, y = x, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class triangle {
    constructor(p1 = new vec3d, p2 = new vec3d, p3 = new vec3d) {
        this.p = [p1, p2, p3];
    }
}

class mesh {
    constructor(...tri) {
        this.tris = new Array();
        for(let i = 0; i < tri.length; i++) {
            this.tris.push(tri[i]);
        }
    }
    triCount() {
        return this.tris.length;
    }
}

class mat4x4 {
    constructor(val = 0) {
        this.m = new Array(4);
        for(let i = 0; i < this.m.length; i++) {
            this.m[i] = [val, val, val, val];
        }
    }
}

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

// The 3D Object
var cubePoints = [
    new vec3d(0, 0, 0), // 0 back-buttom-left
    new vec3d(0, 0, 1), // 1 front-bottom-left
    new vec3d(0, 1, 0), // 2 back-top-left
    new vec3d(0, 1, 1), // 3 front-top-left
    new vec3d(1, 0, 0), // 4 back-bottom-right
    new vec3d(1, 0, 1), // 5 front-bottom-right
    new vec3d(1, 1, 0), // 6 back-top-right
    new vec3d(1, 1, 1)  // 7 front-top-right
];
var cubeMesh = new mesh(
    // Back
    new triangle(cubePoints[0], cubePoints[2], cubePoints[6]),
    new triangle(cubePoints[0], cubePoints[6], cubePoints[4]),
    // Top
    new triangle(cubePoints[2], cubePoints[3], cubePoints[7]),
    new triangle(cubePoints[2], cubePoints[7], cubePoints[6]),
    // Front
    new triangle(cubePoints[5], cubePoints[7], cubePoints[3]),
    new triangle(cubePoints[5], cubePoints[3], cubePoints[1]),
    // Bottom
    new triangle(cubePoints[1], cubePoints[0], cubePoints[4]),
    new triangle(cubePoints[1], cubePoints[4], cubePoints[5]),
    // Left
    new triangle(cubePoints[1], cubePoints[3], cubePoints[2]),
    new triangle(cubePoints[1], cubePoints[2], cubePoints[0]),
    // Right
    new triangle(cubePoints[4], cubePoints[6], cubePoints[7]),
    new triangle(cubePoints[4], cubePoints[7], cubePoints[5]),
);


// Variables
var fNear;
var fFar;
var fFov;
var fFovRad = 1 / Math.tan(fFov * 0.5 / 180 * Math.PI);
// TODO Add to window resize event
var fAspectRatio;

// Timing variables
var pastTime = new Date().getMilliseconds() / 1000000;
var nowTime = 0;
var deltaTime = 0;
var totalTime = 0;

// Matrices
var matRotZ = new mat4x4, matRotX = new mat4x4, matProj = new mat4x4;

// Utility functions
function magnitude(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}
function normalized(v) {
    let mag = magnitude(v);
    if (mag != 0) {
        return new vec3d(v.x / mag, v.y / mag, v.z / mag);
    }
    return v;
}

function addVectors(v1, v2) {
    return new vec3d(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
}

function subVectors(v1, v2) {
    return new vec3d(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
}

function dotProduct(v1, v2) {
    let nv1 = normalized(v1);
    let nv2 = normalized(v2);
    return nv1.x * nv2.x + nv1.y * nv2.y + nv1.z * nv2.z;
}

function crossProduct(v1, v2) {
    let result = new vec3d;
    result.x = v1.y * v2.z - v1.z * v2.y;
    result.y = v1.z * v2.x - v1.x * v2.z;
    result.z = v1.x * v2.y - v1.y * v2.x;

    result = normalized(result);

    return result;
}

function mulVec3ByMat4(v, m) {
    let result = new vec3d;

    result.x = v.x * m.m[0][0] + v.y * m.m[1][0] + v.z * m.m[2][0] + m.m[3][0];
    result.y = v.x * m.m[0][1] + v.y * m.m[1][1] + v.z * m.m[2][1] + m.m[3][1];
    result.z = v.x * m.m[0][2] + v.y * m.m[1][2] + v.z * m.m[2][2] + m.m[3][2];
    let w    = v.x * m.m[0][3] + v.y * m.m[1][3] + v.z * m.m[2][3] + m.m[3][3];

    if (w != 0) {
        result.x /= w; result.y /= w; result.z /= w;
    }

    return result;
}


function drawLines(t) {
    ctx.beginPath();
    ctx.moveTo(t.p[0].x, t.p[0].y);
    ctx.lineTo(t.p[1].x, t.p[1].y);
    ctx.lineTo(t.p[2].x, t.p[2].y);
    ctx.closePath();
    ctx.stroke();
}

function drawTriangle(t) {
    ctx.beginPath();
    ctx.moveTo(t.p[0].x, t.p[0].y);
    ctx.lineTo(t.p[1].x, t.p[1].y);
    ctx.lineTo(t.p[2].x, t.p[2].y);
    ctx.closePath();
    ctx.fill();
}

// Main functions
function Init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    fAspectRatio = canvas.height / canvas.width;

    matProj.m[0][0] = fAspectRatio * fFovRad;
}

function OnUserCreate() {
    document.querySelector('title').text = "Cube!!!";
    fNear = 0.1;
    fFar = 1000;
    fFov = 90.0;
    fFovRad = 1 / Math.tan(fFov * 0.5 / 180 * Math.PI);
    matProj.m[0][0] = fAspectRatio * fFovRad;
    matProj.m[1][1] = fFovRad;
    matProj.m[2][2] = fFar / (fFar - fNear);
    matProj.m[3][2] = (-fFar * fNear) / (fFar - fNear);
    matProj.m[2][3] = 1.0;
    matProj.m[3][3] = 0.0;
}

// Camera I dont think this will be permanent
let cameraPos = new vec3d;

function OnUserUpdate() {
    
    // Handling resize events
    window.addEventListener('resize', Init);

    // Updateing time
    nowTime = new Date().getMilliseconds() / 1000000;
    deltaTime = pastTime - nowTime;
    pastTime = nowTime;
    totalTime += 35 * (pastTime); // Speeding the rotation up by some value

    matRotZ.m[0][0] = Math.cos(totalTime);
    matRotZ.m[0][1] = Math.sin(totalTime);
    matRotZ.m[1][0] = -(Math.sin(totalTime));
    matRotZ.m[1][1] = Math.cos(totalTime);
    matRotZ.m[2][2] = 1;
    matRotZ.m[3][3] = 1;

    matRotX.m[0][0] = 1;
    matRotX.m[1][1] = Math.cos(totalTime * 0.5);
    matRotX.m[1][2] = Math.sin(totalTime * 0.5);
    matRotX.m[2][1] = -(Math.sin(totalTime * 0.5));
    matRotX.m[2][2] = Math.cos(totalTime * 0.5);
    matRotX.m[3][3] = 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Line thickness of mesh
    ctx.lineWidth = 2;
    // Coloring of the mesh
    ctx.strokeStyle = 'black';

    for (let i = 0; i < cubeMesh.triCount(); i++) {
        let triProjected = new triangle, triTranslated = new triangle, triRotatedZ = new triangle, triRotatedZX = new triangle;
        // Rotating in the z-axis
        triRotatedZ.p[0] = mulVec3ByMat4(cubeMesh.tris[i].p[0], matRotZ);
        triRotatedZ.p[1] = mulVec3ByMat4(cubeMesh.tris[i].p[1], matRotZ);
        triRotatedZ.p[2] = mulVec3ByMat4(cubeMesh.tris[i].p[2], matRotZ);

        // Rotating in the x-axis
        triRotatedZX.p[0] = mulVec3ByMat4(triRotatedZ.p[0], matRotX);
        triRotatedZX.p[1] = mulVec3ByMat4(triRotatedZ.p[1], matRotX);
        triRotatedZX.p[2] = mulVec3ByMat4(triRotatedZ.p[2], matRotX);

        triTranslated = triRotatedZX;
        triTranslated.p[0].z = triRotatedZX.p[0].z + 3.0;
        triTranslated.p[1].z = triRotatedZX.p[1].z + 3.0;
        triTranslated.p[2].z = triRotatedZX.p[2].z + 3.0;

        // TODO Remove unseen faces
        let cross = new vec3d, line1 = new vec3d, line2 = new vec3d;
        line1 = subVectors(triTranslated.p[1], triTranslated.p[0]);
        line2 = subVectors(triTranslated.p[2], triTranslated.p[0]);
        cross = crossProduct(line1, line2);
        // if (normal.z > 0) {
        let dot = dotProduct(cross, subVectors(triTranslated.p[0], cameraPos));
        if (dot < 0) {
            // Lighting code
            let lightDir = normalized(new vec3d(0, 0, -1));
            let lightAmt = dotProduct(cross, lightDir);
            ctx.fillStyle = 'rgb(' + (255 * lightAmt) + ', '+ (255 * lightAmt) + ', '+ (255 * lightAmt) + ')';
            triProjected.p[0] = mulVec3ByMat4(triTranslated.p[0], matProj);
            triProjected.p[1] = mulVec3ByMat4(triTranslated.p[1], matProj);
            triProjected.p[2] = mulVec3ByMat4(triTranslated.p[2], matProj);

            // Translating to center of viewport
            triProjected.p[0].x += 1; triProjected.p[0].y += 1;
            triProjected.p[1].x += 1; triProjected.p[1].y += 1;
            triProjected.p[2].x += 1; triProjected.p[2].y += 1;
            // Scale into view
            triProjected.p[0].x *= 0.5 * canvas.width;
            triProjected.p[0].y *= 0.5 * canvas.height;
            triProjected.p[1].x *= 0.5 * canvas.width;
            triProjected.p[1].y *= 0.5 * canvas.height;
            triProjected.p[2].x *= 0.5 * canvas.width;
            triProjected.p[2].y *= 0.5 * canvas.height;
            
            drawTriangle(triProjected);
        }
    }

    requestAnimationFrame(OnUserUpdate);
    
}
// Starting function
function Start() {
    Init();
    OnUserCreate();
    OnUserUpdate();
}

// Starting the rendering
Start();

// I don't know why the rotation is freezing intermitently 
// (Probably something to do with the sin & cos functions for the rotation matrices)