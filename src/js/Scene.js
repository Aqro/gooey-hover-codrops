import * as THREE from 'three'
import { TweenMax as TM, Power2, ExpoScaleEase } from 'gsap'
import Tile from './Tile'

const perspective = 800

export default class Scene {

    constructor($scene) {
        this.container = $scene
        this.$tiles = document.querySelectorAll('.slideshow-list__el')

        this.W = window.innerWidth
        this.H = window.innerHeight

        this.images = []

        this.mouse = new THREE.Vector2(0, 0)

        this.start()


        this.bindEvent()
    }

    bindEvent() {
        window.addEventListener('resize', () => { this.onResize() })
    }


    start() {
        this.mainScene = new THREE.Scene()
        this.initCamera()
        this.initLights()

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.container,
            alpha: true,
        })
        this.renderer.setSize(this.W, this.H)
        this.renderer.setPixelRatio(window.devicePixelRatio)

        this.tiles = Array.from(this.$tiles).map(($el, i) => new Tile($el, this, i))

        this.update()
    }

    initCamera() {
        const fov = (180 * (2 * Math.atan(this.H / 2 / perspective))) / Math.PI

        this.camera = new THREE.PerspectiveCamera(fov, this.W / this.H, 1, 10000)
        this.camera.position.set(0, 0, perspective)
    }

    initLights() {
        const ambientlight = new THREE.AmbientLight(0xffffff, 2)
        this.mainScene.add(ambientlight)
    }




    /* Handlers
    --------------------------------------------------------- */

    onResize() {
        this.W = window.innerWidth
        this.H = window.innerHeight

        this.camera.aspect = this.W / this.H

        this.camera.updateProjectionMatrix()
        this.renderer.setSize(this.W, this.H)
    }


    /* Actions
    --------------------------------------------------------- */

    update() {
        requestAnimationFrame(this.update.bind(this))

        this.tiles.forEach((tile) => {
            tile.update()
        })

        this.renderer.render(this.mainScene, this.camera)
    }

}
