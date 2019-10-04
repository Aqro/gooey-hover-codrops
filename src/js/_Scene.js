import * as THREE from 'three'
import { TweenMax as TM, Power2, ExpoScaleEase } from 'gsap'
import vertexShader from '../glsl/vertexShader.glsl'
// import fragmentShader from "../glsl/circleShader.glsl";
// import fragmentShader from "../glsl/displacementShader.glsl";
// import fragmentShader from "../glsl/revealShader.glsl";
// import fragmentShader from "../glsl/dropShader.glsl";
import fragmentShader from '../glsl/overalShader.glsl'

const perspective = 800
const assets = [
    'https://images.unsplash.com/photo-1517365830460-955ce3ccd263',
    'https://images.unsplash.com/photo-1505503693641-1926193e8d57',
]

export default class Scene {

    constructor() {
        this.container = document.getElementById('scene')

        this.W = window.innerWidth
        this.H = window.innerHeight
        this.clock = new THREE.Clock()
        this.ctnImage = new THREE.Vector2(400, 400)
        this.ctnImageZoomed = new THREE.Vector2(this.W, this.H)
        this.vertexShader = vertexShader
        this.fragmentShader = fragmentShader


        this.loader = new THREE.TextureLoader()
        this.images = []

        this.isZoomed = false

        this.direction = new THREE.Vector2(0, 0)
        this.mouse = new THREE.Vector2(0, 0)
        this.prevMouse = this.mouse

        this.preload(assets, () => {
            this.start()
        })

        this.bindEvent()
    }

    bindEvent() {
        window.addEventListener('resize', () => {
            this.onResize()
        })
        window.addEventListener('mousemove', (e) => {
            this.onMouseMove(e)
        })

        document.addEventListener('click', () => {
            this.onClick()
        })
    }

    // Init scene

    start() {
        this.scene = new THREE.Scene()
        this.initCamera()
        this.initLights()

        this.createElements()

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.container,
            alpha: true,
        })
        this.renderer.setSize(this.W, this.H)
        // this.renderer.setClearColor(0xfffdfa)
        this.renderer.setPixelRatio(window.devicePixelRatio)

        this.update()
    }

    initCamera() {
        const fov = (180 * (2 * Math.atan(this.H / 2 / perspective))) / Math.PI

        this.camera = new THREE.PerspectiveCamera(fov, this.W / this.H, 1, 10000)
        this.camera.position.set(0, 0, perspective)
    }

    initLights() {
        const ambientlight = new THREE.AmbientLight(0xffffff, 1)
        this.scene.add(ambientlight)
    }

    // Handlers

    onClick() {
        const startScaleX = this.isZoomed ? this.W : this.ctnImage.x
        const startScaleY = this.isZoomed ? this.H : this.ctnImage.y

        const endScaleX = this.isZoomed ? this.ctnImage.x : this.W
        const endScaleY = this.isZoomed ? this.ctnImage.y : this.H

        const easeScaleX  = ExpoScaleEase.config(startScaleX, endScaleX, Power2.easeInOut)
        const easeScaleY  = ExpoScaleEase.config(startScaleY, endScaleY, Power2.easeInOut)

        TM.to(this.plane.scale, 0.5, {
            x: endScaleX,
            ease: easeScaleX,
        })

        TM.to(this.plane.scale, 0.5, {
            y: endScaleY,
            ease: easeScaleY,
        })

        TM.to([this.plane.rotation, this.plane.position], 0.5, {
            x: 0,
            y: 0,
            z: 0,
            ease: Power2.easeInOut,
        })

        const newValue = this.isZoomed
            ? getRatio(this.ctnImage, this.images[0].image)
            : getRatio(this.ctnImageZoomed, this.images[0].image)

        TM.to(this.plane.material.uniforms.u_map_ar.value, 0.5, {
            x: newValue.x,
            y: newValue.y,
            ease: Power2.easeInOut,
        })

        TM.to(this.plane.material.uniforms.u_progress, 0.5, {
            value: this.isZoomed ? 0 : 1,
            ease: Power2.easeInOut,
        })

        this.isZoomed = !this.isZoomed
    }

    onResize() {
        this.W = window.innerWidth
        this.H = window.innerHeight

        this.camera.aspect = this.W / this.H

        this.camera.updateProjectionMatrix()
        this.renderer.setSize(this.W, this.H)

        this.ctnImage = new THREE.Vector2(400, 400)
        this.ctnImageZoomed = new THREE.Vector2(this.W, this.H)
    }

    onMouseMove(event) {
        TM.to(this.mouse, 0.5, {
            x: (event.clientX / window.innerWidth) * 2 - 1,
            y: -(event.clientY / window.innerHeight) * 2 + 1
        })

        if (this.isZoomed || !this.plane) return

        TM.to(this.plane.position, 0.5, {
            z: this.mouse.x * 100 - 100,
        })

        TM.to(this.plane.rotation, 0.5, {
            x: -this.mouse.y * 0.3,
            y: this.mouse.x * (Math.PI / 6),
        })
    }

    // Actions

    createElements() {
        const img = this.images[0]
        const mask = this.images[1]

        const uniforms = {
            u_mouse: { value: this.mouse },
            u_time: { value: this.clock.getElapsedTime() },
            u_direction: { value: this.direction },
            u_progress: { value: 0 },
            u_map: { type: 't', value: img },
            u_mask: { type: 't', value: mask },
            u_map_ar: {
                value: getRatio(this.ctnImage, img.image)
            },
            u_mask_ar: {
                value: getRatio(this.ctnImage, mask.image)
            },
            u_res: { value: new THREE.Vector2(this.W, this.H) }
        }

        const geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1)
        const material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            transparent: true,
            defines: {
                PI: Math.PI,
            },
        })
        this.plane = new THREE.Mesh(geometry, material)
        this.plane.scale.set(this.ctnImage.x, this.ctnImage.y, 1)
        this.scene.add(this.plane)
    }

    // Update

    update() {
        requestAnimationFrame(this.update.bind(this))

        this.plane.material.uniforms.u_time.value += this.clock.getDelta()

        this.renderer.render(this.scene, this.camera)
    }

    // Values

    preload($els, allImagesLoadedCallback) {
        let loadedCounter = 0
        const toBeLoadedNumber = $els.length
        const preloadImage = ($el, anImageLoadedCallback) => {
            const image = this.loader.load($el, anImageLoadedCallback)
            image.center.set(0.5, 0.5)
            image.wrapS = THREE.RepeatWrapping
            image.wrapT = THREE.RepeatWrapping
            this.images.push(image)
        }

        $els.forEach(($el) => {
            preloadImage($el, () => {
                loadedCounter += 1
                if (loadedCounter === toBeLoadedNumber) {
                    allImagesLoadedCallback()
                }
            })
        })
    }
}

// CONSTANTS & HELPERS

const rad = (r) => r * (Math.PI / 180)

const rotateMatrix = (a) => [Math.cos(a), -Math.sin(a), Math.sin(a), Math.cos(a)]

const multiplyMatrixAndPoint = (matrix, point) => {
    const c0r0 = matrix[0]
    const c1r0 = matrix[1]
    const c0r1 = matrix[2]
    const c1r1 = matrix[3]
    const x = point[0]
    const y = point[1]
    return [Math.abs(x * c0r0 + y * c0r1), Math.abs(x * c1r0 + y * c1r1)]
}

const getRatio = ({ x: w, y: h }, { width, height }, r = 0) => {
    const m = multiplyMatrixAndPoint(rotateMatrix(rad(r)), [w, h])
    const originalRatio = {
        w: m[0] / width,
        h: m[1] / height,
    }

    const coverRatio = 1 / Math.max(originalRatio.w, originalRatio.h)

    return new THREE.Vector2(
        originalRatio.w * coverRatio,
        originalRatio.h * coverRatio,
    )
}
